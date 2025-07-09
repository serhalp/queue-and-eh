// Shared storage utilities between Deno (edge functions) and Node.js (server)
import type { Question } from '../types/shared'
import { getStore, getDeployStore } from '@netlify/blobs'

// Helper to get event-specific key
export const getEventKey = (eventId: string, type: 'questions' | 'event') => `${type}-${eventId}`

// Get the appropriate blob store based on environment - works in both Deno and Node.js
export function getBlobStore(eventId: string) {
  
  // Check environment context (works in both Deno and Node.js)
  const context = typeof Netlify !== 'undefined' 
    ? Netlify.env.get('CONTEXT') 
    : process.env.CONTEXT
  
  const storeName = getEventKey(eventId, 'questions')
  
  console.log(`[getBlobStore] eventId: ${eventId}, context: ${context}, storeName: ${storeName}`)
  
  // Use global store for production, deploy store for development/preview
  if (context === 'production') {
    console.log('[getBlobStore] Using global store for production')
    return getStore(storeName)
  }
  console.log('[getBlobStore] Using deploy store for development')
  return getDeployStore({name: storeName, region: 'us-east-2'})
}

export const QUESTIONS_KEY = (eventId: string) => getEventKey(eventId, 'questions')

// Get questions from blob storage - shared between Deno and Node.js
export const getQuestions = async (eventId: string): Promise<Question[]> => {
  try {
    console.log(`[getQuestions] Fetching questions for eventId: ${eventId}`)
    const store = getBlobStore(eventId)
    const key = QUESTIONS_KEY(eventId)
    console.log(`[getQuestions] Using key: ${key}`)
    
    const result = await store.get(key, { type: 'json' })
    console.log(`[getQuestions] Raw result:`, result)
    
    if (!result) {
      console.log('[getQuestions] No result found, returning empty array')
      return []
    }
    
    const questions = result || []
    console.log(`[getQuestions] Found ${questions.length} questions`)
    const sorted = questions.sort((a: Question, b: Question) => b.votes - a.votes)
    console.log(`[getQuestions] Returning ${sorted.length} sorted questions`)
    return sorted
  } catch (error) {
    console.error('[getQuestions] Error getting questions:', error)
    return []
  }
}
