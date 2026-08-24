<script setup lang="ts">
import { computed } from 'vue'
import { User } from '@lucide/vue'

const props = withDefaults(defineProps<{
  src?: string | null
  name?: string
  color?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  // Explicit rather than implicit `undefined`: the template branches on both,
  // and the empty cases are the documented fallbacks (initials, then an icon).
  src: null,
  name: '',
  size: 'md',
  color: '#3b82f6'
})

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl'
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const initials = computed(() => {
  if (!props.name) return ''
  return props.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<template>
  <div
    class="rounded-full flex items-center justify-center overflow-hidden shrink-0"
    :class="sizeClasses[size]"
    :style="{ backgroundColor: !src ? color : undefined }"
  >
    <img
      v-if="src"
      :src="src"
      :alt="name || 'Avatar'"
      class="w-full h-full object-cover"
    >
    <span
      v-else-if="initials"
      class="font-semibold text-white"
    >
      {{ initials }}
    </span>
    <User
      v-else
      class="text-white"
      :class="iconSizes[size]"
    />
  </div>
</template>
