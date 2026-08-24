<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecurringStore } from '@/stores/recurring'
import { useAuthStore } from '@/stores/auth'
import { useI18n, type TranslationKey } from '@/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import { ArrowLeft, Trash2 } from '@lucide/vue'
import { format, parseISO } from 'date-fns'
import type { RecurrenceType } from '@/types'

const route = useRoute()
const router = useRouter()
const recurringStore = useRecurringStore()
const authStore = useAuthStore()
const { t, weekdays, dateLocale } = useI18n()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const title = ref('')
const recurrenceType = ref<RecurrenceType>('weekly')
const selectedDays = ref<number[]>([])
const startTime = ref('19:00')
const endTime = ref('22:00')
const validFrom = ref(format(new Date(), 'yyyy-MM-dd'))
const validUntil = ref('')
const isActive = ref(true)

const recurrenceTypes: { value: RecurrenceType; key: TranslationKey }[] = [
  { value: 'daily', key: 'recurring.daily' },
  { value: 'weekly', key: 'recurring.weekly' },
  { value: 'monthly', key: 'recurring.monthly' }
]

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)

const weekdayLabels = computed(() => weekdays('short'))
const weekdayNamesLong = computed(() => weekdays('long'))

function formatHumanDate(value: string): string {
  return value ? format(parseISO(value), 'd MMMM yyyy', { locale: dateLocale.value }) : ''
}

const formattedValidFrom = computed(() => formatHumanDate(validFrom.value))
const formattedValidUntil = computed(() => formatHumanDate(validUntil.value))

onMounted(() => {
  if (!isEdit.value) return

  const event = recurringStore.recurringEvents.find((e) => e.id === route.params.id)
  if (!event) return

  title.value = event.title
  recurrenceType.value = event.recurrence_type
  selectedDays.value = [...event.day_of_week]
  startTime.value = event.start_time.slice(0, 5)
  endTime.value = event.end_time.slice(0, 5)
  validFrom.value = event.valid_from
  validUntil.value = event.valid_until || ''
  isActive.value = event.is_active
})

// Weekday indices and days of the month share one column but mean different
// things, so a leftover selection would silently change the schedule.
watch(recurrenceType, () => {
  selectedDays.value = []
})

function toggleDay(day: number) {
  const index = selectedDays.value.indexOf(day)
  if (index === -1) {
    selectedDays.value.push(day)
  } else {
    selectedDays.value.splice(index, 1)
  }
}

async function handleSubmit() {
  if (!authStore.user) return

  loading.value = true

  const data = {
    user_id: authStore.user.id,
    title: title.value.trim(),
    recurrence_type: recurrenceType.value,
    day_of_week: [...selectedDays.value].sort((a, b) => a - b),
    start_time: `${startTime.value}:00`,
    end_time: `${endTime.value}:00`,
    valid_from: validFrom.value,
    valid_until: validUntil.value || null,
    is_active: isActive.value
  }

  if (isEdit.value) {
    await recurringStore.updateRecurringEvent(route.params.id as string, data)
  } else {
    await recurringStore.createRecurringEvent(data)
  }

  loading.value = false
  router.push('/recurring')
}

async function handleDelete() {
  if (!confirm(t('recurring.confirmDelete'))) return

  loading.value = true
  await recurringStore.deleteRecurringEvent(route.params.id as string)
  loading.value = false
  router.push('/recurring')
}
</script>

<template>
  <AppLayout hide-nav>
    <div class="flex flex-col h-full">
      <header class="flex items-center gap-4 p-4 border-b">
        <button
          type="button"
          class="p-2 -ml-2 rounded-lg hover:bg-(--color-muted)"
          @click="router.back()"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold">
          {{ isEdit ? t('recurring.editTitle') : t('recurring.newTitle') }}
        </h1>
        <button
          v-if="isEdit"
          type="button"
          :aria-label="t('actions.delete')"
          class="ml-auto p-2 rounded-lg text-(--color-destructive) hover:bg-(--color-destructive)/10"
          @click="handleDelete"
        >
          <Trash2 class="w-5 h-5" />
        </button>
      </header>

      <form
        class="flex-1 p-4 space-y-4 overflow-auto"
        @submit.prevent="handleSubmit"
      >
        <div>
          <label
            for="recurring-title"
            class="block text-sm font-medium mb-1.5"
          >
            {{ t('recurring.titleLabel') }}
          </label>
          <input
            id="recurring-title"
            v-model="title"
            type="text"
            :placeholder="t('recurring.titlePlaceholder')"
            required
            class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          >
        </div>

        <div>
          <span class="block text-sm font-medium mb-1.5">{{ t('recurring.repetition') }}</span>
          <div class="flex gap-2">
            <button
              v-for="type in recurrenceTypes"
              :key="type.value"
              type="button"
              :aria-pressed="recurrenceType === type.value"
              class="flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors"
              :class="recurrenceType === type.value
                ? 'bg-(--color-primary) text-(--color-primary-foreground) border-transparent'
                : 'hover:bg-(--color-muted)'"
              @click="recurrenceType = type.value"
            >
              {{ t(type.key) }}
            </button>
          </div>
        </div>

        <div v-if="recurrenceType === 'weekly'">
          <span class="block text-sm font-medium mb-1.5">{{ t('recurring.weekdays') }}</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(label, index) in weekdayLabels"
              :key="index"
              type="button"
              :aria-label="weekdayNamesLong[index]"
              :aria-pressed="selectedDays.includes(index)"
              class="min-w-10 h-10 px-2 rounded-full text-sm font-medium transition-colors"
              :class="selectedDays.includes(index)
                ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                : 'bg-(--color-muted) hover:bg-(--color-muted)/80'"
              @click="toggleDay(index)"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div v-if="recurrenceType === 'monthly'">
          <span class="block text-sm font-medium mb-1.5">{{ t('recurring.daysOfMonth') }}</span>
          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="day in monthDays"
              :key="day"
              type="button"
              :aria-pressed="selectedDays.includes(day)"
              class="w-9 h-9 rounded text-sm font-medium transition-colors"
              :class="selectedDays.includes(day)
                ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                : 'bg-(--color-muted) hover:bg-(--color-muted)/80'"
              @click="toggleDay(day)"
            >
              {{ day }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="recurring-start"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('recurring.from') }}
            </label>
            <input
              id="recurring-start"
              v-model="startTime"
              type="time"
              required
              class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>
          <div>
            <label
              for="recurring-end"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('recurring.to') }}
            </label>
            <input
              id="recurring-end"
              v-model="endTime"
              type="time"
              required
              class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="valid-from"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('recurring.validFrom') }}
            </label>
            <input
              id="valid-from"
              v-model="validFrom"
              type="date"
              required
              class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
            <p
              v-if="formattedValidFrom"
              class="mt-1 text-xs text-(--color-muted-foreground)"
            >
              {{ formattedValidFrom }}
            </p>
          </div>
          <div>
            <label
              for="valid-until"
              class="block text-sm font-medium mb-1.5"
            >
              {{ t('recurring.validUntil') }}
            </label>
            <input
              id="valid-until"
              v-model="validUntil"
              type="date"
              class="w-full px-4 py-2.5 rounded-lg border bg-(--color-background) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            >
            <p
              v-if="formattedValidUntil"
              class="mt-1 text-xs text-(--color-muted-foreground)"
            >
              {{ formattedValidUntil }}
            </p>
          </div>
        </div>

        <div
          v-if="isEdit"
          class="flex items-center gap-3"
        >
          <input
            id="recurring-active"
            v-model="isActive"
            type="checkbox"
            class="w-5 h-5 rounded border-2 accent-(--color-primary)"
          >
          <label
            for="recurring-active"
            class="text-sm font-medium"
          >{{ t('recurring.active') }}</label>
        </div>

        <div class="pt-4">
          <button
            type="submit"
            :disabled="loading || (recurrenceType !== 'daily' && selectedDays.length === 0)"
            class="w-full py-3 px-4 rounded-lg bg-(--color-primary) text-(--color-primary-foreground) font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {{ loading ? t('actions.saving') : (isEdit ? t('actions.save') : t('recurring.create')) }}
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>
