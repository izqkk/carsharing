import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { RecurringEvent } from '@/types'
import { expandEventsForWeek } from '@/lib/recurrence'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useRecurringStore = defineStore('recurring', () => {
  const recurringEvents = ref<RecurringEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let subscription: RealtimeChannel | null = null

  async function fetchRecurringEvents() {
    loading.value = true
    error.value = null

    const { data, error: err } = await supabase
      .from('recurring_events')
      .select('*, profile:profiles(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (err) {
      error.value = err.message
      loading.value = false
      return
    }

    recurringEvents.value = data || []
    loading.value = false
  }

  const userRecurringEvents = computed(() => {
    return recurringEvents.value
  })

  async function createRecurringEvent(
    event: Omit<RecurringEvent, 'id' | 'created_at' | 'profile'>
  ) {
    const { data, error: err } = await supabase
      .from('recurring_events')
      .insert(event)
      .select('*, profile:profiles(*)')
      .single()

    if (err) {
      error.value = err.message
      return null
    }

    recurringEvents.value.push(data)
    return data as RecurringEvent
  }

  async function updateRecurringEvent(id: string, updates: Partial<RecurringEvent>) {
    const { error: err } = await supabase.from('recurring_events').update(updates).eq('id', id)

    if (err) {
      error.value = err.message
      return false
    }

    const index = recurringEvents.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      recurringEvents.value[index] = { ...recurringEvents.value[index], ...updates }
    }

    return true
  }

  async function deleteRecurringEvent(id: string) {
    const { error: err } = await supabase.from('recurring_events').delete().eq('id', id)

    if (err) {
      error.value = err.message
      return false
    }

    recurringEvents.value = recurringEvents.value.filter((e) => e.id !== id)
    return true
  }

  async function toggleActive(id: string) {
    const event = recurringEvents.value.find((e) => e.id === id)
    if (!event) return false

    return updateRecurringEvent(id, { is_active: !event.is_active })
  }

  function subscribeToChanges() {
    subscription = supabase
      .channel('recurring_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_events' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('recurring_events')
              .select('*, profile:profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              recurringEvents.value.push(data)
            }
          } else if (payload.eventType === 'UPDATE') {
            const index = recurringEvents.value.findIndex((e) => e.id === payload.new.id)
            if (index !== -1) {
              const { data } = await supabase
                .from('recurring_events')
                .select('*, profile:profiles(*)')
                .eq('id', payload.new.id)
                .single()
              if (data) {
                recurringEvents.value[index] = data
              }
            }
          } else if (payload.eventType === 'DELETE') {
            recurringEvents.value = recurringEvents.value.filter((e) => e.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  function unsubscribe() {
    if (subscription) {
      subscription.unsubscribe()
      subscription = null
    }
  }

  return {
    recurringEvents,
    loading,
    error,
    userRecurringEvents,
    fetchRecurringEvents,
    expandEventsForWeek: (date: Date) => expandEventsForWeek(recurringEvents.value, date),
    createRecurringEvent,
    updateRecurringEvent,
    deleteRecurringEvent,
    toggleActive,
    subscribeToChanges,
    unsubscribe
  }
})
