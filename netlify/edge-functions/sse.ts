import type { Context } from "@netlify/edge-functions";
import {
  getBlobStore,
  getQuestions,
  QUESTIONS_KEY,
  // @ts-expect-error TODO(serhalp): configure ts separately for edge functions (deno)
} from "../../utils/shared-storage.ts";

const PRESENCE_KEY = "presence";

interface PresenceUser {
  userId: string;
  country: string;
  countryName: string;
  lastSeen: number;
}

interface PresenceData {
  [userId: string]: PresenceUser;
}

// Blob-based presence management functions
async function addUser(
  eventId: string,
  userId: string,
  country: string,
  countryName: string
) {
  const store = getBlobStore(eventId);
  const key = PRESENCE_KEY;

  try {
    const existingData =
      ((await store.get(key, { type: "json" })) as PresenceData) || {};

    existingData[userId] = {
      userId,
      country: country || "unknown",
      countryName: countryName || "Unknown",
      lastSeen: Date.now(),
    };

    await store.set(key, JSON.stringify(existingData));
    console.log(
      `[presence] User ${userId} from ${countryName} (${country}) connected to event ${eventId}`
    );
  } catch (error) {
    console.error(`[presence] Error adding user ${userId}:`, error);
  }
}

async function removeUser(eventId: string, userId: string) {
  const store = getBlobStore(eventId);
  const key = PRESENCE_KEY;

  try {
    const existingData =
      ((await store.get(key, { type: "json" })) as PresenceData) || {};

    if (existingData[userId]) {
      delete existingData[userId];

      if (Object.keys(existingData).length === 0) {
        await store.delete(key);
      } else {
        await store.set(key, JSON.stringify(existingData));
      }

      console.log(
        `[presence] User ${userId} disconnected from event ${eventId}`
      );
    }
  } catch (error) {
    console.error(`[presence] Error removing user ${userId}:`, error);
  }
}

async function cleanupStaleUsers(eventId: string) {
  const store = getBlobStore(eventId);
  const key = PRESENCE_KEY;
  const staleThreshold = 30000; // 30 seconds
  const now = Date.now();

  try {
    const existingData =
      ((await store.get(key, { type: "json" })) as PresenceData) || {};
    let hasChanges = false;

    for (const [userId, user] of Object.entries(existingData)) {
      if (now - user.lastSeen > staleThreshold) {
        delete existingData[userId];
        hasChanges = true;
        console.log(
          `[presence] Cleaned up stale user ${userId} from event ${eventId}`
        );
      }
    }

    if (hasChanges) {
      if (Object.keys(existingData).length === 0) {
        await store.delete(key);
      } else {
        await store.set(key, JSON.stringify(existingData));
      }
    }
  } catch (error) {
    console.error(`[presence] Error cleaning up stale users:`, error);
  }
}

async function updateUserHeartbeat(eventId: string, userId: string) {
  const store = getBlobStore(eventId);
  const key = PRESENCE_KEY;

  try {
    const existingData =
      ((await store.get(key, { type: "json" })) as PresenceData) || {};

    if (existingData[userId]) {
      existingData[userId].lastSeen = Date.now();
      await store.set(key, JSON.stringify(existingData));
    }
  } catch (error) {
    console.error(
      `[presence] Error updating heartbeat for user ${userId}:`,
      error
    );
  }
}

async function getPresenceData(eventId: string) {
  const store = getBlobStore(eventId);
  const key = PRESENCE_KEY;

  try {
    // Clean up stale users first
    await cleanupStaleUsers(eventId);

    const existingData =
      ((await store.get(key, { type: "json" })) as PresenceData) || {};
    const users = Object.values(existingData);

    if (users.length === 0) {
      return { total: 0, countries: {} };
    }

    const countries: Record<string, { count: number; name: string }> = {};
    for (const user of users) {
      if (!countries[user.country]) {
        countries[user.country] = { count: 0, name: user.countryName };
      }
      countries[user.country]!.count += 1;
    }

    return {
      total: users.length,
      countries,
    };
  } catch (error) {
    console.error(`[presence] Error getting presence data:`, error);
    return { total: 0, countries: {} };
  }
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  const userId = url.searchParams.get("userId");
  const country =
    url.searchParams.get("country") || context.geo?.country?.code || "unknown";
  const countryName =
    url.searchParams.get("countryName") ||
    context.geo?.country?.name ||
    "Unknown";

  console.log(
    `[sse] New SSE connection for eventId: ${eventId}, userId: ${userId}, country: ${country}, countryName: ${countryName}`
  );

  if (!eventId || !userId) {
    console.log("[sse] Missing eventId or userId, returning 400");
    return new Response("Event ID and User ID are required", { status: 400 });
  }

  // Add user to presence tracking
  await addUser(eventId, userId, country, countryName);

  // Set up SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      let intervalId: ReturnType<typeof setInterval>;
      let lastQuestionHash = "";
      let lastPresenceHash = "";

      const sendUpdate = async () => {
        try {
          // Update user heartbeat
          await updateUserHeartbeat(eventId, userId);

          const questions = await getQuestions(eventId);
          const presence = await getPresenceData(eventId);

          const currentQuestionHash = JSON.stringify(questions);
          const currentPresenceHash = JSON.stringify(presence);
          const encoder = new TextEncoder();

          // Send questions update if changed
          if (currentQuestionHash !== lastQuestionHash) {
            lastQuestionHash = currentQuestionHash;

            const questionsData = JSON.stringify({
              success: true,
              questions,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(
              encoder.encode(`event: questions\ndata: ${questionsData}\n\n`)
            );
          }

          // Send presence update if changed
          if (currentPresenceHash !== lastPresenceHash) {
            lastPresenceHash = currentPresenceHash;

            const presenceData = JSON.stringify({
              success: true,
              presence,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(
              encoder.encode(`event: presence\ndata: ${presenceData}\n\n`)
            );
          }
        } catch (error) {
          console.error("[sse] Error in sendUpdate:", error);
        }
      };

      // Send initial update
      sendUpdate();

      // Set up interval for periodic updates
      intervalId = setInterval(sendUpdate, 2000);

      // Handle cleanup on stream close
      const cleanup = async () => {
        console.log(
          `[sse] Cleaning up connection for eventId: ${eventId}, userId: ${userId}`
        );
        await removeUser(eventId, userId);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };

      // Store cleanup function for later use
      (controller as any).cleanup = cleanup;
    },

    async cancel() {
      console.log(
        `[sse] Stream cancelled for eventId: ${eventId}, userId: ${userId}`
      );
      await removeUser(eventId, userId);
      if ((this as any).cleanup) {
        await (this as any).cleanup();
      }
    },
  });

  return new Response(stream, { headers });
};

export const config = {
  path: "/sse",
};
