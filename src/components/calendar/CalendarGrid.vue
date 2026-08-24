<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import { useI18n } from '@/i18n'
import type { ExpandedBooking } from '@/types'
import Avatar from '@/components/ui/Avatar.vue'
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  format,
  parseISO,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns'
import { Car } from '@lucide/vue'

const props = defineProps<{
  bookings: ExpandedBooking[]
}>()

const router = useRouter()
const bookingsStore = useBookingsStore()
const { t, dateLocale } = useI18n()

const weekDays = computed(() =>
  eachDayOfInterval({
    start: startOfWeek(bookingsStore.currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(bookingsStore.currentWeek, { weekStartsOn: 1 })
  })
)

function getBookingsForDay(day: Date) {
  return props.bookings
    .filter((booking) => isSameDay(parseISO(booking.start_time), day))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
}

function isDayFree(day: Date): boolean {
  return getBookingsForDay(day).length === 0
}

function isPastDay(day: Date): boolean {
  return isBefore(day, startOfDay(new Date()))
}

function formatTimeRange(startStr: string, endStr: string): string {
  return t('booking.timeRange', {
    start: format(parseISO(startStr), 'HH:mm'),
    end: format(parseISO(endStr), 'HH:mm')
  })
}

function handleDayClick(day: Date) {
  if (isPastDay(day)) return
  router.push(`/booking/new?date=${format(day, 'yyyy-MM-dd')}`)
}

function handleBookingClick(booking: ExpandedBooking, event: Event) {
  event.stopPropagation()
  // Recurring occurrences are expanded on the fly and have no row of their own,
  // so there is nothing to open. They are edited via the recurrence itself.
  if (!booking.is_recurring) {
    router.push(`/booking/${booking.id}`)
  }
}
</script>

<template>
  <div class="flex-1 overflow-auto">
    <div class="divide-y">
      <div
        v-for="day in weekDays"
        :key="day.toISOString()"
        class="flex gap-3 p-4 transition-colors"
        :class="[
          isPastDay(day) ? 'opacity-50 bg-(--color-muted)/30' : 'cursor-pointer hover:bg-(--color-muted)/30',
          isToday(day) && 'bg-(--color-primary)/5'
        ]"
        @click="handleDayClick(day)"
      >
        <!-- Date column -->
        <div class="flex flex-col items-center w-14 shrink-0">
          <span class="text-xs text-(--color-muted-foreground) uppercase">
            {{ format(day, 'EEE', { locale: dateLocale }) }}
          </span>
          <span
            class="w-10 h-10 flex items-center justify-center rounded-full text-lg font-semibold"
            :class="isToday(day) ? 'bg-(--color-primary) text-(--color-primary-foreground)' : ''"
          >
            {{ format(day, 'd') }}
          </span>
        </div>

        <!-- Bookings / status column -->
        <div class="flex-1 min-w-0">
          <div
            v-if="isDayFree(day) && !isPastDay(day)"
            class="flex items-center gap-2 py-2 px-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400"
          >
            <Car class="w-5 h-5" />
            <span class="font-medium">{{ t('calendar.free') }}</span>
          </div>

          <div
            v-else-if="isDayFree(day) && isPastDay(day)"
            class="py-2 px-3 text-(--color-muted-foreground) text-sm"
          >
            {{ t('calendar.noBookings') }}
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="booking in getBookingsForDay(day)"
              :key="booking.id"
              class="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors"
              :class="booking.is_recurring ? 'opacity-80' : 'hover:opacity-80 cursor-pointer'"
              :style="{ backgroundColor: (booking.profile?.color || '#3b82f6') + '20' }"
              @click="handleBookingClick(booking, $event)"
            >
              <div
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: booking.profile?.color || '#3b82f6' }"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">
                  {{ booking.title }}
                </p>
                <p class="text-sm text-(--color-muted-foreground)">
                  <template v-if="booking.is_all_day">
                    {{ t('booking.allDay') }}
                  </template>
                  <template v-else>
                    {{ formatTimeRange(booking.start_time, booking.end_time) }}
                  </template>
                  <span
                    v-if="booking.is_recurring"
                    class="ml-1"
                  >{{ t('calendar.recurringSuffix') }}</span>
                </p>
              </div>
              <Avatar
                :src="booking.profile?.avatar_url"
                :name="booking.profile?.display_name"
                :color="booking.profile?.color || '#3b82f6'"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
