import { addQuestion, type Question } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const body = await readBody(event)
    const { text, authorId } = body

    if (!eventId) {
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

    await addQuestion(eventId, question)

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
