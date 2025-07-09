import { getQuestions } from '~/server/utils/storage'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Legacy endpoint - use default eventId for backward compatibility
    const eventId = 'default'
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
