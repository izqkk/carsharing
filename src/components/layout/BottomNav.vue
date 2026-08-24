<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { Calendar, Plus, User } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-(--color-background) border-t safe-area-pb">
    <div class="flex items-center justify-between h-16 max-w-md mx-auto px-8">
      <button
        type="button"
        class="flex flex-col items-center justify-center h-full transition-colors"
        :class="isActive('/') ? 'text-(--color-foreground)' : 'text-(--color-muted-foreground)'"
        @click="router.push('/')"
      >
        <Calendar class="w-6 h-6" />
        <span class="text-xs mt-1">{{ t('nav.calendar') }}</span>
      </button>

      <button
        type="button"
        :aria-label="t('nav.newBooking')"
        class="w-14 h-14 -mt-5 rounded-full bg-(--color-primary) flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
        @click="router.push('/booking/new')"
      >
        <Plus class="w-7 h-7 text-(--color-primary-foreground)" />
      </button>

      <button
        type="button"
        class="flex flex-col items-center justify-center h-full transition-colors"
        :class="isActive('/profile') ? 'text-(--color-foreground)' : 'text-(--color-muted-foreground)'"
        @click="router.push('/profile')"
      >
        <User class="w-6 h-6" />
        <span class="text-xs mt-1">{{ t('nav.profile') }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
