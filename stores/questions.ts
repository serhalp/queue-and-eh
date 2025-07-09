import { defineStore } from 'pinia'

export interface Question {
  id: string
  text: string
  votes: number
  createdAt: Date
  votedBy: Set<string>
}

export const useQuestionsStore = defineStore('questions', () => {
  const questions = ref<Question[]>([])
  const userVotes = ref<Set<string>>(new Set())
  const userId = ref<string>('')

  // Initialize user ID on client side
  onMounted(() => {
    if (process.client) {
      const storedUserId = localStorage.getItem('userId')
      if (storedUserId) {
        userId.value = storedUserId
      } else {
        userId.value = crypto.randomUUID()
        localStorage.setItem('userId', userId.value)
      }
      
      // Load user votes from localStorage
      const storedVotes = localStorage.getItem('userVotes')
      if (storedVotes) {
        userVotes.value = new Set(JSON.parse(storedVotes))
      }
    }
  })

  const sortedQuestions = computed(() => {
    return [...questions.value].sort((a, b) => b.votes - a.votes)
  })

  const addQuestion = (questionText: string) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: questionText.trim(),
      votes: 0,
      createdAt: new Date(),
      votedBy: new Set()
    }
    questions.value.push(newQuestion)
    return newQuestion
  }

  const toggleVote = (questionId: string) => {
    const question = questions.value.find(q => q.id === questionId)
    if (!question) return

    const hasVoted = userVotes.value.has(questionId)
    
    if (hasVoted) {
      // Remove vote
      userVotes.value.delete(questionId)
      question.votes = Math.max(0, question.votes - 1)
      question.votedBy.delete(userId.value)
    } else {
      // Add vote
      userVotes.value.add(questionId)
      question.votes += 1
      question.votedBy.add(userId.value)
    }

    // Save to localStorage
    if (process.client) {
      localStorage.setItem('userVotes', JSON.stringify([...userVotes.value]))
    }

    return !hasVoted
  }

  const hasUserVoted = (questionId: string) => {
    return userVotes.value.has(questionId)
  }

  const setQuestions = (newQuestions: any[]) => {
    questions.value = newQuestions.map(q => ({
      ...q,
      createdAt: new Date(q.createdAt),
      votedBy: new Set(Array.isArray(q.votedBy) ? q.votedBy : [])
    }))
  }

  const updateQuestion = (updatedQuestion: Question) => {
    const index = questions.value.findIndex(q => q.id === updatedQuestion.id)
    if (index !== -1) {
      questions.value[index] = {
        ...updatedQuestion,
        createdAt: new Date(updatedQuestion.createdAt),
        votedBy: new Set(updatedQuestion.votedBy)
      }
    }
  }

  return {
    questions: readonly(questions),
    sortedQuestions,
    userVotes: readonly(userVotes),
    userId: readonly(userId),
    addQuestion,
    toggleVote,
    hasUserVoted,
    setQuestions,
    updateQuestion
  }
})
