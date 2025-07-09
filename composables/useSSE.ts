export const useSSE = (eventId: string) => {
  const questions = ref<any[]>([])
  const presence = ref<{ total: number; countries: Record<string, { count: number; name: string }> }>({ total: 0, countries: {} })
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  
  let eventSource: EventSource | null = null
  let reconnectTimeout: NodeJS.Timeout | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000 // Start with 1 second

  const connect = () => {
    if (import.meta.server) return // Only run on client
    
    try {
      // Close existing connection
      disconnect()
      
      // Get user ID from localStorage (should be set by the app)
      let userId = localStorage.getItem('qa-user-id')
      if (!userId) {
        userId = crypto.randomUUID()
        localStorage.setItem('qa-user-id', userId)
      }
      
      // Get country from geo data
      const geo = useGeo()
      const country = geo.value?.country || 'unknown'
      const countryName = geo.value?.countryName || 'Unknown'
      
      const url = `/sse?eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(userId)}&country=${encodeURIComponent(country)}&countryName=${encodeURIComponent(countryName)}`
      console.log('[useSSE] Connecting with:', { eventId, userId, country })
      eventSource = new EventSource(url)
      
      eventSource.onopen = () => {
        console.log('SSE connection opened')
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
      }
      
      // Handle questions events
      eventSource.addEventListener('questions', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.success && data.questions) {
            questions.value = data.questions
            console.log('[useSSE] Updated questions:', data.questions.length)
          } else if (!data.success) {
            console.error('SSE questions error:', data.error)
            error.value = data.error
          }
        } catch (err) {
          console.error('Error parsing SSE questions data:', err)
          error.value = 'Failed to parse questions data'
        }
      })
      
      // Handle presence events
      eventSource.addEventListener('presence', (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.success && data.presence) {
            presence.value = data.presence
            console.log('[useSSE] Updated presence:', data.presence)
          } else if (!data.success) {
            console.error('SSE presence error:', data.error)
          }
        } catch (err) {
          console.error('Error parsing SSE presence data:', err)
        }
      })
      
      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event)
        isConnected.value = false
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts)
          reconnectAttempts++
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
          
          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        } else {
          error.value = 'Connection lost. Please refresh the page.'
        }
      }
      
    } catch (err) {
      console.error('Failed to create SSE connection:', err)
      error.value = 'Failed to establish connection'
      isConnected.value = false
    }
  }
  
  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    
    isConnected.value = false
  }
  
  // Auto-connect when composable is used
  onMounted(() => {
    connect()
  })
  
  // Clean up on unmount
  onUnmounted(() => {
    disconnect()
  })
  
  // Handle page visibility changes to reconnect when page becomes visible
  if (import.meta.client) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !isConnected.value) {
        connect()
      }
    })
  }
  
  return {
    questions: readonly(questions),
    presence: readonly(presence),
    isConnected: readonly(isConnected),
    error: readonly(error),
    connect,
    disconnect
  }
}
