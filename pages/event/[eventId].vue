<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <NuxtLink to="/" class="text-blue-600 hover:text-blue-800 font-semibold text-lg transition-colors">
                Queue and Eh
              </NuxtLink>
              <span class="text-gray-400">/</span>
              <span class="text-gray-600 text-sm">Event</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">{{ event?.title || 'Loading...' }}</h1>
            <p class="text-gray-600 mt-2" v-if="event?.description">
              {{ event.description }}
            </p>
            <p class="text-gray-500 mt-1 text-sm" v-else-if="!event">
              Loading event details...
            </p>
          </div>
          <button
            @click="copyEventLink"
            class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- Event Not Found -->
      <div v-if="eventNotFound" class="text-center py-12">
        <div class="text-6xl mb-4">🤔</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
        <p class="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
        <NuxtLink to="/" class="btn-primary">
          Create New Event
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-else-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading event...</p>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- Question Submission Form -->
        <div class="card mb-8">
          <h2 class="text-xl font-semibold mb-4">Submit a Question</h2>
          <form @submit.prevent="submitQuestion" class="space-y-4">
            <div>
              <textarea
                v-model="newQuestion"
                @keydown="handleKeyDown"
                placeholder="Ask your question here... (Press Enter to submit, Shift+Enter for new line)"
                class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                maxlength="500"
                required
              ></textarea>
              <div class="text-sm text-gray-500 mt-1">
                {{ newQuestion.length }}/500 characters
              </div>
            </div>
            <button
              type="submit"
              :disabled="!newQuestion.trim() || isSubmitting"
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Submitting...' : 'Submit Question' }}
            </button>
          </form>
        </div>



        <!-- Questions List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Questions ({{ sortedQuestions.length }})</h2>
            <LiveUpdatesIndicator :is-connected="isConnected" :presence="presence" />
          </div>

          <div v-if="sortedQuestions.length === 0" class="text-center py-12 text-gray-500">
            <div class="text-4xl mb-4">💭</div>
            <p>No questions yet. Be the first to ask something!</p>
          </div>

          <div v-for="question in sortedQuestions" :key="question.id" class="card hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-gray-900 mb-3">{{ question.text }}</p>
                <div class="flex items-center text-sm text-gray-500">
                  <span>{{ formatTimeAgo(new Date(question.createdAt)) }}</span>
                </div>
              </div>
              <div class="flex items-center ml-4">
                <div v-if="isOwnQuestion(question)" class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium">{{ question.votes }}</span>
                  <span class="text-xs">(Your question)</span>
                </div>
                <button
                  v-else
                  @click="toggleVote(question.id)"
                  :class="[
                    'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                    hasVoted(question.id)
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="font-medium">{{ question.votes }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
const route = useRoute()
const eventId = route.params.eventId

// Use SSE for real-time updates
const { questions: sseQuestions, presence, isConnected, error: sseError } = useSSE(eventId)

// Reactive state
const event = ref(null)
const questions = ref([])
const newQuestion = ref('')
const isSubmitting = ref(false)
const isLoading = ref(true)
const eventNotFound = ref(false)
const userId = ref('')
const userCreatedQuestions = ref(new Set())
const linkCopied = ref(false)

// Watch SSE questions and update local state
watch(sseQuestions, (newQuestions) => {
  if (newQuestions && newQuestions.length >= 0) {
    questions.value = newQuestions
  }
}, { immediate: true })

// Computed
const sortedQuestions = computed(() => {
  return [...questions.value].sort((a, b) => b.votes - a.votes)
})

const hasVoted = (questionId) => {
  const question = questions.value.find(q => q.id === questionId)
  return question?.votedBy?.includes(userId.value) || false
}

const isOwnQuestion = (question) => {
  return question.authorId === userId.value || userCreatedQuestions.value.has(question.id)
}

const canVote = (question) => {
  return !isOwnQuestion(question)
}

// Methods
const loadEvent = async () => {
  try {
    const response = await $fetch(`/api/events/${eventId}`)
    if (response.success) {
      event.value = response.event
    } else {
      eventNotFound.value = true
    }
  } catch (error) {
    console.error('Error loading event:', error)
    eventNotFound.value = true
  } finally {
    isLoading.value = false
  }
}



const submitQuestion = async () => {
  if (!newQuestion.value.trim()) return
  
  isSubmitting.value = true
  
  try {
    const response = await $fetch(`/api/events/${eventId}/questions`, {
      method: 'POST',
      body: { 
        text: newQuestion.value,
        authorId: userId.value
      }
    })
    
    if (response.success) {
      // Track this question as created by the user
      userCreatedQuestions.value.add(response.question.id)
      // Store in localStorage for persistence
      const storedQuestions = JSON.parse(localStorage.getItem('qa-user-questions') || '[]')
      storedQuestions.push(response.question.id)
      localStorage.setItem('qa-user-questions', JSON.stringify(storedQuestions))
      
      newQuestion.value = ''
      // Questions will be updated automatically via SSE
    }
  } catch (error) {
    console.error('Error submitting question:', error)
    alert('Failed to submit question. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const handleKeyDown = (event) => {
  // Submit on Enter (but not Shift+Enter)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submitQuestion()
  }
}

const toggleVote = async (questionId) => {
  const hasUserVoted = hasVoted(questionId)
  const action = hasUserVoted ? 'unvote' : 'vote'
  
  try {
    const response = await $fetch(`/api/events/${eventId}/questions/vote`, {
      method: 'POST',
      body: {
        questionId,
        userId: userId.value,
        action
      }
    })
    
    if (response.success) {
      await loadQuestions() // Refresh questions
    }
  } catch (error) {
    console.error('Error voting:', error)
  }
}

const copyEventLink = async () => {
  try {
    const url = `${window.location.origin}/event/${eventId}`
    await navigator.clipboard.writeText(url)
    
    // Show a temporary success message
    const button = event.target.closest('button')
    const originalText = button.innerHTML
    button.innerHTML = '<span>Copied!</span>'
    setTimeout(() => {
      button.innerHTML = originalText
    }, 2000)
  } catch (error) {
    console.error('Failed to copy link:', error)
  }
}

const formatTimeAgo = (date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

// Initialize user ID
onMounted(() => {
  // Get or create user ID
  let storedUserId = localStorage.getItem('qa-user-id')
  if (!storedUserId) {
    storedUserId = crypto.randomUUID()
    localStorage.setItem('qa-user-id', storedUserId)
  }
  userId.value = storedUserId
  
  // Load user-created questions from localStorage
  const storedQuestions = JSON.parse(localStorage.getItem('qa-user-questions') || '[]')
  userCreatedQuestions.value = new Set(storedQuestions)
  
  // Load initial event data (questions come via SSE)
  loadEvent()
})

// Set page title
useHead({
  title: computed(() => event.value ? `${event.value.title} - Queue and Eh` : 'Queue and Eh'),
  meta: [
    { name: 'description', content: computed(() => event.value?.description || 'Interactive Q&A session') }
  ]
})
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
}
</style>
