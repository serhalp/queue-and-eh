import { initializeEvent, type Event } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, description } = body

    console.log(`[POST events] Creating new event with title: ${title}`);
    console.log(`[POST events] Description:`, description?.substring(0, 100));

    if (!title || typeof title !== 'string') {
      console.log('[POST events] Missing or invalid title');
      throw createError({
        statusCode: 400,
        statusMessage: 'Title is required'
      })
    }

    // Generate a unique event ID
    const eventId = crypto.randomUUID()
    console.log(`[POST events] Generated eventId: ${eventId}`);
    
    const newEvent: Event = {
      id: eventId,
      title: title.trim(),
      description: description?.trim() || '',
      createdAt: new Date().toISOString()
    }

    console.log(`[POST events] Calling initializeEvent for eventId: ${eventId}`);
    await initializeEvent(newEvent)
    console.log(`[POST events] Successfully created event: ${eventId}`);
    console.log(`[POST events] Event title: ${newEvent.title}`);
    console.log(`[POST events] Event description: ${newEvent.description}`);
    console.log(`[POST events] Event createdAt: ${newEvent.createdAt}`);

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
