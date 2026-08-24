<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecurringStore } from '@/stores/recurring'
import { useI18n } from '@/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import { Plus, Calendar, Repeat, ChevronRight } from '@lucide/vue'
import type { RecurringEvent } from '@/types'

const router = useRouter()
const recurringStore = useRecurringStore()
const { t, weekdays } = useI18n()

onMounted(() => {
  recurringStore.fetchRecurringEvents()
})

function formatSchedule(event: RecurringEvent): string {
  if (event.recurrence_type === 'daily') return t('recurring.everyDay')
  if (event.recurrence_type === 'monthly') {
    return t('recurring.onDaysOfMonth', { days: event.day_of_week.join(', ') })
  }
  const names = weekdays('long')
  return event.day_of_week.map((day) => names[day]).join(', ')
}

function formatTime(start: string, end: string): string {
  // TIME columns arrive as "19:00:00"; the seconds are never meaningful here.
  return t('booking.timeRange', { start: start.slice(0, 5), end: end.slice(0, 5) })
}
</script>

<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <header class="flex items-center justify-between p-4 border-b">
        <h1 class="text-lg font-semibold">
          {{ t('recurring.title') }}
        </h1>
        <button
          type="button"
          :aria-label="t('recurring.newTitle')"
          class="p-2 rounded-lg bg-(--color-primary) text-(--color-primary-foreground)"
          @click="router.push('/recurring/new')"
        >
          <Plus class="w-5 h-5" />
        </button>
      </header>

      <div class="flex-1 overflow-auto">
        <div
          v-if="recurringStore.loading"
          class="flex items-center justify-center h-32"
        >
          <div class="animate-spin w-6 h-6 border-2 border-(--color-primary) border-t-transparent rounded-full" />
        </div>

        <div
          v-else-if="recurringStore.recurringEvents.length === 0"
          class="flex flex-col items-center justify-center h-64 text-(--color-muted-foreground)"
        >
          <Repeat class="w-12 h-12 mb-4 opacity-50" />
          <p>{{ t('recurring.empty') }}</p>
          <button
            type="button"
            class="mt-4 px-4 py-2 rounded-lg bg-(--color-primary) text-(--color-primary-foreground) text-sm"
            @click="router.push('/recurring/new')"
          >
            {{ t('recurring.emptyCta') }}
          </button>
        </div>

        <div
          v-else
          class="divide-y"
        >
          <button
            v-for="event in recurringStore.recurringEvents"
            :key="event.id"
            type="button"
            class="w-full p-4 text-left flex items-center gap-4 hover:bg-(--color-muted)/50 transition-colors"
            @click="router.push(`/recurring/${event.id}`)"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :style="{ backgroundColor: event.profile?.color || '#3b82f6' }"
            >
              <Calendar class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="font-medium truncate"
                :class="!event.is_active && 'opacity-50'"
              >
                {{ event.title }}
              </p>
              <p class="text-sm text-(--color-muted-foreground)">
                {{ formatSchedule(event) }}
              </p>
              <p class="text-sm text-(--color-muted-foreground)">
                {{ formatTime(event.start_time, event.end_time) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="!event.is_active"
                class="px-2 py-1 text-xs rounded bg-(--color-muted) text-(--color-muted-foreground)"
              >
                {{ t('recurring.inactive') }}
              </span>
              <ChevronRight class="w-5 h-5 text-(--color-muted-foreground)" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
