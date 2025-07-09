import { getEvent } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    const eventData = await getEvent(eventId)
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    return {
      success: true,
      event: eventData
    }
  } catch (error: any) {
    console.error('Error getting event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get event'
    })
  }
})
