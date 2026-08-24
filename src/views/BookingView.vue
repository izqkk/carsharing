<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import { useAuthStore } from '@/stores/auth'
import { useI18n, type TranslationKey } from '@/i18n'
import { loadQuickTitles } from '@/lib/quick-titles'
import AppLayout from '@/components/layout/AppLayout.vue'
import { ArrowLeft, Trash2, Clock, Car, ChevronLeft, ChevronRight } from '@lucide/vue'
import { format, parseISO, addDays, subDays, formatISO } from 'date-fns'

const route = useRoute()
const router = useRouter()
const bookingsStore = useBookingsStore()
const authStore = useAuthStore()
const { t, locale, dateLocale } = useI18n()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const title = ref('')
const date = ref((route.query.date as string) || format(new Date(), 'yyyy-MM-dd'))
const startTime = ref('09:00')
const endTime = ref('17:00')
const isAllDay = ref(false)

type TimePreset = {
  key: TranslationKey
  start: string
  end: string
  allDay?: boolean
  icon: string
}

const timePresets: TimePreset[] = [
  { key: 'booking.presets.morning', start: '08:00', end: '12:00', icon: '🌅' },
  { key: 'booking.presets.afternoon', start: '12:00', end: '18:00', icon: '☀️' },
  { key: 'booking.presets.evening', start: '18:00', end: '22:00', icon: '🌙' },
  { key: 'booking.presets.allDay', start: '00:00', end: '23:59', allDay: true, icon: '📅' }
]

const quickTitles = ref<string[]>([])

const formattedWeekday = computed(() =>
  date.value ? format(parseISO(date.value), 'EEEE', { locale: dateLocale.value }) : ''
)

const formattedDate = computed(() =>
  date.value ? format(parseISO(date.value), 'd MMMM', { locale: dateLocale.value }) : ''
)

const timeDisplay = computed(() =>
  isAllDay.value
    ? t('booking.allDay')
    : t('booking.timeRange', { start: startTime.value, end: endTime.value })
)

function previousDay() {
  date.value = format(subDays(parseISO(date.value), 1), 'yyyy-MM-dd')
}

function nextDay() {
  date.value = format(addDays(parseISO(date.value), 1), 'yyyy-MM-dd')
}

function isPresetActive(preset: TimePreset): boolean {
  if (preset.allDay) return isAllDay.value
  return !isAllDay.value && startTime.value === preset.start && endTime.value === preset.end
}

function selectPreset(preset: TimePreset) {
  if (preset.allDay) {
    isAllDay.value = true
    return
  }
  isAllDay.value = false
  startTime.value = preset.start
  endTime.value = preset.end
}

onMounted(() => {
  quickTitles.value = loadQuickTitles(locale.value)

  if (!isEdit.value) return

  const booking = bookingsStore.bookings.find((b) => b.id === route.params.id)
  if (!booking) return

  title.value = booking.title
  date.value = format(parseISO(booking.start_time), 'yyyy-MM-dd')
  startTime.value = format(parseISO(booking.start_time), 'HH:mm')
  endTime.value = format(parseISO(booking.end_time), 'HH:mm')
  isAllDay.value = booking.is_all_day
})

async function handleSubmit() {
  if (!authStore.user || !title.value.trim()) return

  loading.value = true
  errorMessage.value = null

  try {
    const [year, month, day] = date.value.split('-').map(Number)
    const [startHour, startMinute] = isAllDay.value ? [0, 0] : startTime.value.split(':').map(Number)
    const [endHour, endMinute] = isAllDay.value ? [23, 59] : endTime.value.split(':').map(Number)

    // Built from local components on purpose: "09:00" means nine o'clock where
    // the car is, not nine o'clock UTC. `formatISO` then attaches the offset.
    const start = new Date(year, month - 1, day, startHour, startMinute, 0)
    const end = new Date(year, month - 1, day, endHour, endMinute, isAllDay.value ? 59 : 0)

    const changes = {
      title: title.value.trim(),
      start_time: formatISO(start),
      end_time: formatISO(end),
      is_all_day: isAllDay.value
    }

    const result = isEdit.value
      ? await bookingsStore.updateBooking(route.params.id as string, changes)
      : await bookingsStore.createBooking({ user_id: authStore.user.id, ...changes })

    // `createBooking` returns null on failure, `updateBooking` false. Staying
    // put keeps the user's input and lets them see what went wrong.
    if (!result) {
      errorMessage.value = bookingsStore.error || t('booking.errors.saveFailed')
      return
    }

    router.push('/')
  } catch {
    errorMessage.value = t('booking.errors.saveTimeout')
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  if (!confirm(t('booking.confirmDelete'))) return

  loading.value = true
  errorMessage.value = null

  try {
    if (!(await bookingsStore.deleteBooking(route.params.id as string))) {
      errorMessage.value = bookingsStore.error || t('booking.errors.deleteFailed')
      return
    }
    router.push('/')
  } catch {
    errorMessage.value = t('booking.errors.deleteTimeout')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AppLayout hide-nav>
    <div class="flex flex-col h-full bg-(--color-background)">
      <header class="flex items-center gap-4 p-4 border-b">
        <button
          type="button"
          class="p-2 -ml-2 rounded-full hover:bg-(--color-muted)"
          @click="router.back()"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold flex-1">
          {{ isEdit ? t('booking.editTitle') : t('booking.newTitle') }}
        </h1>
        <button
          v-if="isEdit"
          type="button"
          :aria-label="t('actions.delete')"
          class="p-2 rounded-full text-(--color-destructive) hover:bg-(--color-destructive)/10"
          @click="handleDelete"
        >
          <Trash2 class="w-5 h-5" />
        </button>
      </header>

      <div class="flex-1 overflow-auto">
        <div class="bg-(--color-primary) text-(--color-primary-foreground) p-6">
          <div class="flex items-center justify-between">
            <button
              type="button"
              :aria-label="t('booking.previousDay')"
              class="p-3 rounded-full hover:bg-white/20 -ml-3"
              @click="previousDay"
            >
              <ChevronLeft class="w-6 h-6" />
            </button>
            <div class="text-center">
              <p class="text-sm opacity-80 uppercase tracking-wide">
                {{ formattedWeekday }}
              </p>
              <p class="text-3xl font-bold mt-1">
                {{ formattedDate }}
              </p>
            </div>
            <button
              type="button"
              :aria-label="t('booking.nextDay')"
              class="p-3 rounded-full hover:bg-white/20 -mr-3"
              @click="nextDay"
            >
              <ChevronRight class="w-6 h-6" />
            </button>
          </div>

          <div class="mt-4 flex items-center justify-center gap-2 text-lg opacity-90">
            <Clock class="w-5 h-5" />
            <span>{{ timeDisplay }}</span>
          </div>
        </div>

        <div class="p-4 space-y-6">
          <div>
            <span class="block text-sm font-medium text-(--color-muted-foreground) mb-3">
              {{ t('booking.when') }}
            </span>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="preset in timePresets"
                :key="preset.key"
                type="button"
                :aria-pressed="isPresetActive(preset)"
                class="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all"
                :class="isPresetActive(preset)
                  ? 'border-(--color-primary) bg-(--color-primary)/10'
                  : 'border-transparent bg-(--color-muted) hover:border-(--color-border)'"
                @click="selectPreset(preset)"
              >
                <span
                  class="text-xl"
                  aria-hidden="true"
                >{{ preset.icon }}</span>
                <span class="text-xs font-medium">{{ t(preset.key) }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="!isAllDay"
            class="grid grid-cols-2 gap-4"
          >
            <div>
              <label
                for="start-time"
                class="block text-sm font-medium text-(--color-muted-foreground) mb-2"
              >
                {{ t('booking.from') }}
              </label>
              <input
                id="start-time"
                v-model="startTime"
                type="time"
                class="w-full px-4 py-3 rounded-xl border bg-(--color-background) text-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
            </div>
            <div>
              <label
                for="end-time"
                class="block text-sm font-medium text-(--color-muted-foreground) mb-2"
              >
                {{ t('booking.to') }}
              </label>
              <input
                id="end-time"
                v-model="endTime"
                type="time"
                class="w-full px-4 py-3 rounded-xl border bg-(--color-background) text-lg focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              >
            </div>
          </div>

          <div>
            <label
              for="booking-title"
              class="block text-sm font-medium text-(--color-muted-foreground) mb-3"
            >
              {{ t('booking.whatFor') }}
            </label>
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                v-for="quick in quickTitles"
                :key="quick"
                type="button"
                :aria-pressed="title === quick"
                class="px-4 py-2 rounded-full text-sm font-medium transition-all"
                :class="title === quick
                  ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                  : 'bg-(--color-muted) hover:bg-(--color-muted)/80'"
                @click="title = quick"
              >
                {{ quick }}
              </button>
            </div>
            <input
              id="booking-title"
              v-model="title"
              type="text"
              :placeholder="t('booking.titlePlaceholder')"
              class="w-full px-4 py-3 rounded-xl border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>
        </div>
      </div>

      <div class="p-4 border-t bg-(--color-background)">
        <p
          v-if="errorMessage"
          class="mb-3 text-sm text-(--color-destructive) text-center"
        >
          {{ errorMessage }}
        </p>
        <button
          type="button"
          :disabled="loading || !title.trim()"
          class="w-full py-4 px-6 rounded-xl bg-(--color-primary) text-(--color-primary-foreground) font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
          @click="handleSubmit"
        >
          <Car class="w-6 h-6" />
          {{ loading ? t('actions.saving') : (isEdit ? t('booking.submitEdit') : t('booking.submit')) }}
        </button>
      </div>
    </div>
  </AppLayout>
</template>
