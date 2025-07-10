// Shared storage utilities between Deno (edge functions) and Node.js (server)
import type { Question } from "../types/shared";
import { getStore, getDeployStore } from "@netlify/blobs";

// Re-export types
export type { Question };

// Event management types
export interface Event {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

// Helper to get event-specific key
export const getEventKey = (eventId: string, type: "questions" | "event") =>
  `${type}-${eventId}`;

// Get the appropriate blob store based on environment - works in both Deno and Node.js
export function getBlobStore(eventId: string) {
  const storeName = getEventKey(eventId, "questions");

  // Use global store for production, deploy store for development/preview
  if (process.env.CONTEXT === "production") {
    const store = getStore(storeName);
    return store;
  }
  const store = getDeployStore(storeName);
  return store;
}

export const QUESTIONS_KEY = (eventId: string) => "questions";

// Get questions from blob storage - shared between Deno and Node.js
export const getQuestions = async (eventId: string): Promise<Question[]> => {
  try {
    console.log(`[getQuestions] Fetching questions for eventId: ${eventId}`);
    const store = getBlobStore(eventId);
    const key = QUESTIONS_KEY(eventId);
    console.log(`[getQuestions] Using key: ${key}`);

    const result = await store.get(key, { type: "json" });
    console.log(`[getQuestions] Raw result:`, result);

    if (!result) {
      console.log("[getQuestions] No result found, returning empty array");
      return [];
    }

    const questions = result || [];
    console.log(`[getQuestions] Found ${questions.length} questions`);
    const sorted = questions.sort(
      (a: Question, b: Question) => b.votes - a.votes
    );
    console.log(`[getQuestions] Returning ${sorted.length} sorted questions`);
    return sorted;
  } catch (error) {
    console.error("[getQuestions] Error getting questions:", error);
    return [];
  }
};

// Atomic write functionality
interface QuestionsWithETag {
  questions: Question[];
  etag: string | null;
}

const MAX_RETRIES = 5;
const RETRY_DELAY = 100; // ms

// Helper function to get questions with their ETag for atomic operations
const getQuestionsWithETag = async (
  eventId: string
): Promise<QuestionsWithETag> => {
  console.log(`[getQuestionsWithETag] Starting for eventId: ${eventId}`);

  try {
    const store = getBlobStore(eventId);
    console.log(
      `[getQuestionsWithETag] Got blob store for eventId: ${eventId}`
    );

    const key = QUESTIONS_KEY(eventId);
    console.log(`[getQuestionsWithETag] Using key: ${key}`);

    const result = await store.getWithMetadata(key, { type: "json" });
    console.log(`[getQuestionsWithETag] Raw result:`, result);

    if (!result) {
      console.log(
        `[getQuestionsWithETag] No result found, returning empty array`
      );
      return { questions: [], etag: null };
    }

    const questions = result.data || [];
    console.log(`[getQuestionsWithETag] Found ${questions.length} questions`);
    console.log(`[getQuestionsWithETag] ETag: ${result.etag}`);

    const sorted = questions.sort(
      (a: Question, b: Question) => b.votes - a.votes
    );
    console.log(
      `[getQuestionsWithETag] Returning ${sorted.length} sorted questions`
    );

    return {
      questions: sorted,
      etag: result.etag || null,
    };
  } catch (error: any) {
    console.error(`[getQuestionsWithETag] ❌ Error:`, error);
    throw error;
  }
};

// Helper function for atomic writes with retry logic
const atomicWrite = async (
  eventId: string,
  questions: Question[],
  etag: string | null
): Promise<boolean> => {
  console.log(`[atomicWrite] Starting write for eventId: ${eventId}`);
  console.log(`[atomicWrite] Questions count: ${questions.length}`);
  console.log(`[atomicWrite] ETag: ${etag}`);

  const store = getBlobStore(eventId);
  console.log(`[atomicWrite] Got blob store for eventId: ${eventId}`);

  const key = QUESTIONS_KEY(eventId);
  console.log(`[atomicWrite] Using key: ${key}`);

  const options: any = {};

  if (etag) {
    // Only write if the ETag matches (no concurrent modifications)
    options.onlyIfMatch = etag;
    console.log(`[atomicWrite] Using onlyIfMatch with etag: ${etag}`);
  } else {
    console.log(`[atomicWrite] No etag provided, writing without conditions`);
  }

  const questionsJson = JSON.stringify(questions);
  console.log(`[atomicWrite] JSON length: ${questionsJson.length} characters`);
  console.log(
    `[atomicWrite] First 200 chars: ${questionsJson.substring(0, 200)}`
  );

  try {
    const result = await store.set(key, questionsJson, options);
    console.log(`[atomicWrite] Set result:`, result);
    console.log(`[atomicWrite] Modified property: ${result.modified}`);

    if (result.modified) {
      console.log(
        `[atomicWrite] ✅ Successfully wrote ${questions.length} questions to ${key}`
      );
    } else {
      console.log(
        `[atomicWrite] ❌ Write failed - not modified (possible ETag mismatch)`
      );
    }

    return result.modified;
  } catch (error) {
    console.error(`[atomicWrite] ❌ Error during store.set:`, error);
    throw error;
  }
};

// Add question with atomic write and retry logic
export const addQuestion = async (
  eventId: string,
  question: Question
): Promise<void> => {
  console.log(
    `[addQuestion] Starting to add question ${question.id} to eventId: ${eventId}`
  );
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(
        `[addQuestion] Attempt ${retryCount + 1} - Getting current questions`
      );
      const { questions, etag } = await getQuestionsWithETag(eventId);
      console.log(
        `[addQuestion] Current questions count: ${questions.length}, etag: ${etag}`
      );
      const updatedQuestions = [...questions, question];
      console.log(
        `[addQuestion] Updated questions count: ${updatedQuestions.length}`
      );

      console.log(`[addQuestion] Calling atomicWrite`);
      const wasModified = await atomicWrite(eventId, updatedQuestions, etag);
      console.log(`[addQuestion] atomicWrite result: ${wasModified}`);

      if (wasModified) {
        console.log(`[addQuestion] Successfully added question ${question.id}`);
        return; // Success! The write went through
      }

      // Write was not applied due to conflict, retry
      console.log(
        `Atomic write conflict, retrying... (attempt ${retryCount + 1})`
      );
      retryCount++;
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * retryCount)
      );
    } catch (error: any) {
      console.error("Error adding question:", error);
      throw error;
    }
  }

  throw new Error("Failed to add question after maximum retries");
};

// Find a specific question
export const findQuestion = async (
  eventId: string,
  id: string
): Promise<Question | null> => {
  try {
    const questions = await getQuestions(eventId);
    return questions.find((q) => q.id === id) ?? null;
  } catch (error) {
    console.error("Error finding question:", error);
    return null;
  }
};

// Update question with atomic write and retry logic
export const updateQuestion = async (
  eventId: string,
  id: string,
  updates: Partial<Question>
): Promise<Question | null> => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const { questions, etag } = await getQuestionsWithETag(eventId);
      const questionIndex = questions.findIndex((q) => q.id === id);

      if (questionIndex === -1) {
        return null;
      }

      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        ...updates,
      } as Question;

      const wasModified = await atomicWrite(eventId, updatedQuestions, etag);

      if (wasModified) {
        return updatedQuestions[questionIndex]; // Success! The write went through
      }

      // Write was not applied due to conflict, retry
      console.log(
        `Atomic write conflict, retrying... (attempt ${retryCount + 1})`
      );
      retryCount++;
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * retryCount)
      );
    } catch (error: any) {
      console.error("Error updating question:", error);
      throw error;
    }
  }

  throw new Error("Failed to update question after maximum retries");
};

// Event management
export interface Event {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export const createEvent = async (event: Event): Promise<void> => {
  const store = getBlobStore(event.id);

  // Initialize empty questions array for this event
  await store.set(QUESTIONS_KEY(event.id), JSON.stringify([]));

  // Store event metadata
  await store.set(`event-${event.id}`, JSON.stringify(event));
};

export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const store = getBlobStore(eventId);
    const result = await store.get(`event-${eventId}`, { type: "json" });
    return result || null;
  } catch (error) {
    console.error("Error getting event:", error);
    return null;
  }
};
