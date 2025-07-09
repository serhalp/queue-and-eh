<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Queue and Eh</h1>
        <p class="text-gray-600">Create interactive Q&A sessions for your events</p>
      </div>

      <form @submit.prevent="createEvent" class="space-y-6">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
            Event Title
          </label>
          <input
            id="title"
            v-model="eventTitle"
            type="text"
            required
            placeholder="Enter your event title"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            v-model="eventDescription"
            rows="3"
            placeholder="Brief description of your event"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="isCreating || !eventTitle.trim()"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          <span v-if="isCreating">Creating Event...</span>
          <span v-else>Create Q&A Event</span>
        </button>
      </form>

      <div v-if="createdEvent" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-green-800">Event Created!</p>
            <p class="text-xs text-green-600 mt-1">Link copied to clipboard</p>
          </div>
          <button
            @click="copyLink"
            class="text-green-600 hover:text-green-800 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
        <div class="mt-2">
          <a
            :href="eventUrl"
            class="text-sm text-blue-600 hover:text-blue-800 underline break-all"
          >
            {{ eventUrl }}
          </a>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500">
          Share the link with your audience to collect and vote on questions in real-time
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const eventTitle = ref('')
const eventDescription = ref('')
const isCreating = ref(false)
const createdEvent = ref(null)
const userId = ref('')

const eventUrl = computed(() => {
  if (!createdEvent.value) return ''
  return `${window.location.origin}/event/${createdEvent.value.id}`
})

const createEvent = async () => {
  if (!eventTitle.value.trim()) return
  
  isCreating.value = true
  
  try {
    const response = await $fetch('/api/events', {
      method: 'POST',
      body: {
        title: eventTitle.value,
        description: eventDescription.value
      }
    })
    
    if (response.success) {
      createdEvent.value = response.event
      await copyLink()
      
      // Navigate to the event after a short delay
      setTimeout(() => {
        navigateTo(`/event/${response.event.id}`)
      }, 2000)
    }
  } catch (error) {
    console.error('Error creating event:', error)
    alert('Failed to create event. Please try again.')
  } finally {
    isCreating.value = false
  }
}

const copyLink = async () => {
  if (!createdEvent.value) return
  
  try {
    await navigator.clipboard.writeText(eventUrl.value)
  } catch (error) {
    console.error('Failed to copy link:', error)
  }
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
})

// Set page title
useHead({
  title: 'Queue and Eh - Create Interactive Q&A Sessions'
})
</script>
