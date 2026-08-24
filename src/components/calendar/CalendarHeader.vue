<script setup lang="ts">
import { computed } from 'vue'
import { useBookingsStore } from '@/stores/bookings'
import { useOfflineStore } from '@/stores/offline'
import { useI18n } from '@/i18n'
import { ChevronLeft, ChevronRight, WifiOff } from '@lucide/vue'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'

const bookingsStore = useBookingsStore()
const offlineStore = useOfflineStore()
const { t, dateLocale } = useI18n()

const weekLabel = computed(() => {
  const options = { locale: dateLocale.value }
  const start = startOfWeek(bookingsStore.currentWeek, { weekStartsOn: 1 })
  const end = endOfWeek(bookingsStore.currentWeek, { weekStartsOn: 1 })
  return `${format(start, 'd MMM', options)} – ${format(end, 'd MMM yyyy', options)}`
})

function previousWeek() {
  bookingsStore.setCurrentWeek(subWeeks(bookingsStore.currentWeek, 1))
}

function nextWeek() {
  bookingsStore.setCurrentWeek(addWeeks(bookingsStore.currentWeek, 1))
}

function goToToday() {
  bookingsStore.setCurrentWeek(new Date())
}
</script>

<template>
  <header class="flex items-center gap-2 p-4 border-b">
    <button
      type="button"
      :aria-label="t('calendar.previousWeek')"
      class="p-2 rounded-lg hover:bg-(--color-muted) transition-colors"
      @click="previousWeek"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>

    <button
      type="button"
      :title="t('calendar.jumpToToday')"
      class="flex-1 text-center font-semibold hover:text-(--color-primary) transition-colors"
      @click="goToToday"
    >
      {{ weekLabel }}
    </button>

    <button
      type="button"
      :aria-label="t('calendar.nextWeek')"
      class="p-2 rounded-lg hover:bg-(--color-muted) transition-colors"
      @click="nextWeek"
    >
      <ChevronRight class="w-5 h-5" />
    </button>

    <div
      v-if="!offlineStore.isOnline"
      class="ml-2"
      :title="t('calendar.offline')"
    >
      <WifiOff class="w-5 h-5 text-(--color-destructive)" />
    </div>
  </header>
</template>
