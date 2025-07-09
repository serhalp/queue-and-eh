import type { Question } from '../../types/shared'
import { getBlobStore, QUESTIONS_KEY, getQuestions as sharedGetQuestions } from '../../utils/shared-storage'

// Re-export for backward compatibility
export type { Question }

interface QuestionsWithETag {
  questions: Question[]
  etag: string | null
}
const MAX_RETRIES = 5
const RETRY_DELAY = 100 // ms

// Helper function to get questions with their ETag for atomic operations
const getQuestionsWithETag = async (eventId: string): Promise<QuestionsWithETag> => {
  try {
    const store = getBlobStore(eventId)
    const result = await store.getWithMetadata(QUESTIONS_KEY(eventId), { type: 'json' })
    
    if (!result) {
      return { questions: [], etag: null }
    }
    
    const questions = result.data || []
    return { 
      questions: questions.sort((a: Question, b: Question) => b.votes - a.votes),
      etag: result.etag || null
    }
  } catch (error: any) {
    console.error('Error getting questions with ETag:', error)
    throw error
  }
}

// Helper function for atomic writes with retry logic
const atomicWrite = async (eventId: string, questions: Question[], etag: string | null): Promise<boolean> => {
  const store = getBlobStore(eventId)
  const options: any = {}
  
  console.log('atomicWrite called with etag:', etag)
  
  if (etag) {
    // Only write if the ETag matches (no concurrent modifications)
    options.onlyIfMatch = etag
    console.log('Using onlyIfMatch with etag:', etag)
  }
  // Note: Don't use onlyIfNew when etag is null but data exists
  // onlyIfNew should only be used for truly new keys
  
  const result = await store.set(QUESTIONS_KEY(eventId), JSON.stringify(questions), options)
  console.log('Set result:', result)
  console.log('Modified property:', result.modified)
  
  return result.modified
}

export const getQuestions = async (eventId: string): Promise<Question[]> => {
  try {
    return sharedGetQuestions(eventId)
  } catch (error) {
    console.error('Error getting questions:', error)
    return []
  }
}

export const addQuestion = async (eventId: string, question: Question): Promise<void> => {
  console.log(`[addQuestion] Starting to add question ${question.id} to eventId: ${eventId}`);
  let retryCount = 0
  
  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[addQuestion] Attempt ${retryCount + 1} - Getting current questions`);
      const { questions, etag } = await getQuestionsWithETag(eventId)
      console.log(`[addQuestion] Current questions count: ${questions.length}, etag: ${etag}`);
      const updatedQuestions = [...questions, question]
      console.log(`[addQuestion] Updated questions count: ${updatedQuestions.length}`);
      
      console.log(`[addQuestion] Calling atomicWrite`);
      const wasModified = await atomicWrite(eventId, updatedQuestions, etag)
      console.log(`[addQuestion] atomicWrite result: ${wasModified}`);
      
      if (wasModified) {
        console.log(`[addQuestion] Successfully added question ${question.id}`);
        return // Success! The write went through
      }
      
      // Write was not applied due to conflict, retry
      console.log(`Atomic write conflict, retrying... (attempt ${retryCount + 1})`)
      retryCount++
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount))
      
    } catch (error: any) {
      console.error('Error adding question:', error)
      throw error
    }
  }
  
  throw new Error('Failed to add question after maximum retries')
}

export const findQuestion = async (eventId: string, id: string): Promise<Question | null> => {
  try {
    const questions = await getQuestions(eventId)
    return questions.find(q => q.id === id) || null
  } catch (error) {
    console.error('Error finding question:', error)
    return null
  }
}

export const updateQuestion = async (eventId: string, id: string, updates: Partial<Question>): Promise<Question | null> => {
  let retryCount = 0
  
  while (retryCount < MAX_RETRIES) {
    try {
      const { questions, etag } = await getQuestionsWithETag(eventId)
      const questionIndex = questions.findIndex(q => q.id === id)
      
      if (questionIndex === -1) {
        return null
      }
      
      const updatedQuestions = [...questions]
      updatedQuestions[questionIndex] = { ...updatedQuestions[questionIndex], ...updates }
      
      const wasModified = await atomicWrite(eventId, updatedQuestions, etag)
      
      if (wasModified) {
        return updatedQuestions[questionIndex] // Success! The write went through
      }
      
      // Write was not applied due to conflict, retry
      console.log(`Atomic write conflict, retrying... (attempt ${retryCount + 1})`)
      retryCount++
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount))
      
    } catch (error: any) {
      console.error('Error updating question:', error)
      throw error
    }
  }
  
  throw new Error('Failed to update question after maximum retries')
}

// Event management functions
export interface Event {
  id: string
  title: string
  description?: string
  createdAt: string
}

export const createEvent = async (event: Event): Promise<void> => {
  const store = getBlobStore(event.id)
  
  // Initialize empty questions array for this event
  await store.set(QUESTIONS_KEY(event.id), JSON.stringify([]))
  
  // Store event metadata
  await store.set(`event-${event.id}`, JSON.stringify(event))
}

export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const store = getBlobStore(eventId)
    const result = await store.get(`event-${eventId}`, { type: 'json' })
    return result || null
  } catch (error) {
    console.error('Error getting event:', error)
    return null
  }
}
