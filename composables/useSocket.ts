import type { Question } from '~/stores/questions'
import { useQuestionsStore } from '~/stores/questions'

export const useRealtime = () => {
  const isConnected = ref(true) // Always connected for API-based approach
  const questionsStore = useQuestionsStore()
  let pollInterval: NodeJS.Timeout | null = null

  const fetchQuestions = async () => {
    try {
      const response = await $fetch<{ success: boolean, data: Question[] }>('/api/questions')
      if (response.success) {
        questionsStore.setQuestions(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      isConnected.value = false
      setTimeout(() => {
        isConnected.value = true
      }, 5000)
    }
  }

  const startPolling = () => {
    if (process.client && !pollInterval) {
      fetchQuestions() // Initial fetch
      pollInterval = setInterval(fetchQuestions, 2000) // Poll every 2 seconds
    }
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  const submitQuestion = async (questionText: string) => {
    try {
      await $fetch('/api/questions', {
        method: 'POST',
        body: { text: questionText }
      })
      // Immediately fetch updated questions
      await fetchQuestions()
    } catch (error) {
      console.error('Failed to submit question:', error)
      throw error
    }
  }

  const voteQuestion = async (questionId: string, userId: string) => {
    try {
      await $fetch('/api/questions/vote', {
        method: 'POST',
        body: { questionId, userId }
      })
      // Immediately fetch updated questions
      await fetchQuestions()
    } catch (error) {
      console.error('Failed to vote:', error)
      throw error
    }
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    isConnected: readonly(isConnected),
    submitQuestion,
    voteQuestion,
    fetchQuestions
  }
}
