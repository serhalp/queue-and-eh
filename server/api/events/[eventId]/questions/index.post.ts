import { addQuestion, type Question } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const body = await readBody(event)
    const { text, authorId } = body

    console.log(`[POST questions] Received request for eventId: ${eventId}`);
    console.log(`[POST questions] Body:`, { text: text?.substring(0, 50), authorId });

    if (!eventId) {
      console.log('[POST questions] Missing eventId');
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    if (!text || typeof text !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Question text is required'
      })
    }

    if (!authorId || typeof authorId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Author ID is required'
      })
    }

    const question: Question = {
      id: crypto.randomUUID(),
      text: text.trim(),
      votes: 0,
      createdAt: new Date().toISOString(),
      votedBy: [],
      authorId: authorId
    }

    console.log(`[POST questions] Created question:`, { id: question.id, text: question.text.substring(0, 50) });
    console.log(`[POST questions] Calling addQuestion for eventId: ${eventId}`);
    
    await addQuestion(eventId, question)
    
    console.log(`[POST questions] Successfully added question ${question.id}`);
    console.log(`[POST questions] Question stored with text: ${question.text}`);
    console.log(`[POST questions] Question authorId: ${question.authorId}`);
    console.log(`[POST questions] Question votes: ${question.votes}`);
    console.log(`[POST questions] Question createdAt: ${question.createdAt}`);

    return {
      success: true,
      question
    }
  } catch (error: any) {
    console.error('Error adding question:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add question'
    })
  }
})
