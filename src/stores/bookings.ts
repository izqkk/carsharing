import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/types'
import { useOfflineStore } from './offline'
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const useBookingsStore = defineStore('bookings', () => {
  const bookings = ref<Booking[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let subscription: RealtimeChannel | null = null

  const currentWeek = ref(new Date())

  const bookingsForCurrentWeek = computed(() => {
    const start = startOfWeek(currentWeek.value, { weekStartsOn: 1 })
    const end = endOfWeek(currentWeek.value, { weekStartsOn: 1 })

    return bookings.value.filter((booking) => {
      const bookingStart = parseISO(booking.start_time)
      return isWithinInterval(bookingStart, { start, end })
    })
  })

  async function fetchBookings() {
    loading.value = true
    error.value = null

    const start = startOfWeek(currentWeek.value, { weekStartsOn: 1 })
    const end = endOfWeek(currentWeek.value, { weekStartsOn: 1 })

    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, profile:profiles(*)')
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString())
      .order('start_time', { ascending: true })

    if (err) {
      error.value = err.message
      loading.value = false
      return
    }

    bookings.value = data || []
    loading.value = false
  }

  async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'profile'>) {
    const offlineStore = useOfflineStore()

    if (!offlineStore.isOnline) {
      await offlineStore.addPendingAction({
        type: 'create',
        table: 'bookings',
        data: booking
      })
      return { id: crypto.randomUUID(), ...booking } as Booking
    }

    const { data, error: err } = await supabase
      .from('bookings')
      .insert(booking)
      .select('*, profile:profiles(*)')
      .single()

    if (err) {
      error.value = err.message
      return null
    }

    return data as Booking
  }

  async function updateBooking(id: string, updates: Partial<Booking>) {
    const offlineStore = useOfflineStore()

    if (!offlineStore.isOnline) {
      await offlineStore.addPendingAction({
        type: 'update',
        table: 'bookings',
        data: { id, ...updates }
      })
      const index = bookings.value.findIndex((b) => b.id === id)
      if (index !== -1) {
        bookings.value[index] = { ...bookings.value[index], ...updates }
      }
      return true
    }

    const { error: err } = await supabase.from('bookings').update(updates).eq('id', id)

    if (err) {
      error.value = err.message
      return false
    }

    return true
  }

  async function deleteBooking(id: string) {
    const offlineStore = useOfflineStore()

    if (!offlineStore.isOnline) {
      await offlineStore.addPendingAction({
        type: 'delete',
        table: 'bookings',
        data: { id }
      })
      bookings.value = bookings.value.filter((b) => b.id !== id)
      return true
    }

    const { error: err } = await supabase.from('bookings').delete().eq('id', id)

    if (err) {
      error.value = err.message
      return false
    }

    return true
  }

  function subscribeToChanges() {
    subscription = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('bookings')
              .select('*, profile:profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              bookings.value.push(data)
            }
          } else if (payload.eventType === 'UPDATE') {
            const index = bookings.value.findIndex((b) => b.id === payload.new.id)
            if (index !== -1) {
              const { data } = await supabase
                .from('bookings')
                .select('*, profile:profiles(*)')
                .eq('id', payload.new.id)
                .single()
              if (data) {
                bookings.value[index] = data
              }
            }
          } else if (payload.eventType === 'DELETE') {
            bookings.value = bookings.value.filter((b) => b.id !== payload.old.id)
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

  function setCurrentWeek(date: Date) {
    currentWeek.value = date
    fetchBookings()
  }

  return {
    bookings,
    loading,
    error,
    currentWeek,
    bookingsForCurrentWeek,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    subscribeToChanges,
    unsubscribe,
    setCurrentWeek
  }
})
