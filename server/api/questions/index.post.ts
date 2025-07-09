import { addQuestion, type Question } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, authorId } = body

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

  if (text.trim().length > 500) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Question text must be 500 characters or less'
    })
  }

  const newQuestion: Question = {
    id: crypto.randomUUID(),
    text: text.trim(),
    votes: 0,
    createdAt: new Date().toISOString(),
    votedBy: [],
    authorId: authorId
  }

  try {
    // Legacy endpoint - use default eventId for backward compatibility
    const eventId = 'default'
    await addQuestion(eventId, newQuestion)

    return {
      success: true,
      question: newQuestion,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error adding question:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add question'
    })
  }
})
