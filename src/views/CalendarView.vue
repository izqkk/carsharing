<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useBookingsStore } from '@/stores/bookings'
import { useRecurringStore } from '@/stores/recurring'
import { useOfflineStore } from '@/stores/offline'
import CalendarGrid from '@/components/calendar/CalendarGrid.vue'
import CalendarHeader from '@/components/calendar/CalendarHeader.vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const bookingsStore = useBookingsStore()
const recurringStore = useRecurringStore()
const offlineStore = useOfflineStore()

const allBookings = computed(() => {
  const regular = bookingsStore.bookingsForCurrentWeek.map((b) => ({
    ...b,
    is_recurring: false
  }))
  const expanded = recurringStore.expandEventsForWeek(bookingsStore.currentWeek)
  return [...regular, ...expanded]
})

onMounted(async () => {
  await offlineStore.initDB()
  offlineStore.setupListeners()

  await Promise.all([bookingsStore.fetchBookings(), recurringStore.fetchRecurringEvents()])

  bookingsStore.subscribeToChanges()
  recurringStore.subscribeToChanges()
})

onUnmounted(() => {
  bookingsStore.unsubscribe()
  recurringStore.unsubscribe()
  offlineStore.cleanupListeners()
})
</script>

<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <CalendarHeader />
      <CalendarGrid :bookings="allBookings" />
    </div>
  </AppLayout>
</template>
