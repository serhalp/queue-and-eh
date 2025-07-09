import type { Context } from "@netlify/edge-functions";
import { getQuestions } from '../../utils/shared-storage.ts';

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');
  
  console.log(`[sse-questions] New SSE connection for eventId: ${eventId}`);
  
  if (!eventId) {
    console.log('[sse-questions] Missing eventId, returning 400');
    return new Response('Event ID is required', { status: 400 });
  }

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      let intervalId: ReturnType<typeof setInterval>;
      let lastQuestionHash = '';

      const sendUpdate = async () => {
        try {
          console.log(`[sse-questions] Checking for updates for eventId: ${eventId}`);
          const questions = await getQuestions(eventId);
          console.log(`[sse-questions] Got ${questions.length} questions`);
          const currentHash = JSON.stringify(questions);
          
          // Only send update if questions have changed
          if (currentHash !== lastQuestionHash) {
            console.log(`[sse-questions] Questions changed, sending update`);
            lastQuestionHash = currentHash;
            const data = JSON.stringify({
              success: true,
              questions,
              timestamp: new Date().toISOString()
            });
            
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            console.log(`[sse-questions] Sent SSE update with ${questions.length} questions`);
          } else {
            console.log(`[sse-questions] No changes detected, skipping update`);
          }
        } catch (error) {
          console.error('Error fetching questions:', error);
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            success: false,
            error: 'Failed to fetch questions'
          })}\n\n`));
        }
      };

      // Send initial data
      sendUpdate();

      // Set up polling interval (2 seconds)
      intervalId = setInterval(sendUpdate, 2000);

      // Handle client disconnect
      request.signal?.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
};

export const config = {
  path: "/_netlify/sse/questions"
};
