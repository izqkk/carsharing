<script setup lang="ts">
import BottomNav from './BottomNav.vue'

defineProps<{
  hideNav?: boolean
}>()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-(--color-background)">
    <main
      class="flex-1 flex flex-col overflow-hidden"
      :class="!hideNav && 'pb-16'"
    >
      <slot />
    </main>
    <BottomNav v-if="!hideNav" />
  </div>
</template>
