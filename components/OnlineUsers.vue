<template>
  <div v-if="presence.total > 0" class="online-users">
    <div class="online-badge">
      <div class="online-indicator">
        <div class="pulse-dot"></div>
        <span class="online-count">{{ presence.total }} online</span>
      </div>
      
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
</template>

<script setup lang="ts">
interface Props {
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
.online-users {
  display: inline-block;
}

.online-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.online-badge:hover {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(34, 197, 94);
  font-weight: 500;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: rgb(34, 197, 94);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.online-count {
  white-space: nowrap;
}

.country-flags {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.country-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(55, 65, 81);
  cursor: help;
  transition: all 0.2s ease;
}

.country-item:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.flag {
  font-size: 1rem;
  line-height: 1;
}

.count {
  font-weight: 600;
  color: rgb(34, 197, 94);
}
</style>
