import { getQuestions } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    const questions = await getQuestions(eventId)
    
    return {
      success: true,
      questions
    }
  } catch (error: any) {
    console.error('Error getting questions:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get questions'
    })
  }
})
