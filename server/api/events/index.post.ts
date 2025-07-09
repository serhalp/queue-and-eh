import { createEvent, type Event } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, description } = body

    if (!title || typeof title !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title is required'
      })
    }

    // Generate a unique event ID
    const eventId = crypto.randomUUID()
    
    const newEvent: Event = {
      id: eventId,
      title: title.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString()
    }

    await createEvent(newEvent)

    return {
      success: true,
      event: newEvent
    }
  } catch (error: any) {
    console.error('Error creating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create event'
    })
  }
})
