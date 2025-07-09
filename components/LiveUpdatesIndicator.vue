<template>
  <div class="live-updates-indicator">
    <!-- Connecting State -->
    <div v-if="!isConnected" class="status-item connecting">
      <div class="spinner"></div>
      <span class="status-text">Connecting...</span>
    </div>
    
    <!-- Connected State -->
    <div v-else class="status-item connected">
      <div class="pulse-dot"></div>
      <span class="status-text">Live</span>
      
      <!-- User Presence -->
      <div v-if="presence.total > 0" class="presence-info">
        <span class="user-count">{{ presence.total }} online</span>
        
        <!-- Country Flags -->
        <div class="country-flags" v-if="Object.keys(presence.countries).length > 0">
          <div 
            v-for="(countryData, countryCode) in presence.countries" 
            :key="countryCode"
            class="country-item"
            :title="`${countryData.count} user${countryData.count > 1 ? 's' : ''} from ${countryData.name}`"
          >
            <span class="flag">{{ getCountryFlag(countryCode) }}</span>
            <span class="count">{{ countryData.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isConnected: boolean
  presence: {
    total: number
    countries: Record<string, { count: number; name: string }>
  }
}

const props = defineProps<Props>()

// Convert country code to flag emoji using Unicode regional indicator symbols
function getCountryFlag(countryCode: string): string {
  if (countryCode === 'unknown') return '🌍'
  
  // Convert country code to flag emoji using Unicode regional indicator symbols
  // Each letter maps to its corresponding regional indicator symbol
  return countryCode
    .toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(0x1F1E6 + char.charCodeAt(0) - 65))
    .join('')
}
</script>

<style scoped>
.live-updates-indicator {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connecting {
  color: #d97706;
}

.connected {
  color: #059669;
}

.spinner {
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  font-weight: 500;
}

.presence-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid #e5e7eb;
}

.user-count {
  color: #374151;
  font-weight: 500;
}

.country-flags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.country-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
  cursor: help;
  transition: background-color 0.2s;
}

.country-item:hover {
  background-color: #e5e7eb;
}

.flag {
  font-size: 0.875rem;
  line-height: 1;
}

.count {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  min-width: 1rem;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .presence-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    margin-top: 0.5rem;
  }
  
  .country-flags {
    flex-wrap: wrap;
  }
}
</style>
