import { defineStore } from 'pinia'
import { ref } from 'vue'
import { openDB, type IDBPDatabase } from 'idb'
import { supabase } from '@/lib/supabase'
import type { PendingAction, Booking, RecurringEvent } from '@/types'

const DB_NAME = 'carshare-offline'
const DB_VERSION = 1

interface OfflineDB {
  pending_actions: PendingAction
  bookings_cache: Booking
  recurring_cache: RecurringEvent
}

export const useOfflineStore = defineStore('offline', () => {
  const isOnline = ref(navigator.onLine)
  const pendingCount = ref(0)
  const syncing = ref(false)
  let db: IDBPDatabase<OfflineDB> | null = null

  async function initDB() {
    db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_actions')) {
          db.createObjectStore('pending_actions', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('bookings_cache')) {
          db.createObjectStore('bookings_cache', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('recurring_cache')) {
          db.createObjectStore('recurring_cache', { keyPath: 'id' })
        }
      }
    })

    await updatePendingCount()
  }

  async function updatePendingCount() {
    if (!db) return
    const count = await db.count('pending_actions')
    pendingCount.value = count
  }

  async function addPendingAction(action: Omit<PendingAction, 'id' | 'created_at'>) {
    if (!db) return

    const pendingAction: PendingAction = {
      ...action,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    }

    await db.add('pending_actions', pendingAction)
    await updatePendingCount()
  }

  async function syncPendingActions() {
    if (!db || !isOnline.value || syncing.value) return

    syncing.value = true

    try {
      const actions = await db.getAll('pending_actions')

      for (const action of actions) {
        let success = false

        if (action.table === 'bookings') {
          if (action.type === 'create') {
            const { error } = await supabase.from('bookings').insert(action.data)
            success = !error
          } else if (action.type === 'update') {
            const { id, ...updates } = action.data as { id: string }
            const { error } = await supabase.from('bookings').update(updates).eq('id', id)
            success = !error
          } else if (action.type === 'delete') {
            const { id } = action.data as { id: string }
            const { error } = await supabase.from('bookings').delete().eq('id', id)
            success = !error
          }
        } else if (action.table === 'recurring_events') {
          if (action.type === 'create') {
            const { error } = await supabase.from('recurring_events').insert(action.data)
            success = !error
          } else if (action.type === 'update') {
            const { id, ...updates } = action.data as { id: string }
            const { error } = await supabase.from('recurring_events').update(updates).eq('id', id)
            success = !error
          } else if (action.type === 'delete') {
            const { id } = action.data as { id: string }
            const { error } = await supabase.from('recurring_events').delete().eq('id', id)
            success = !error
          }
        }

        if (success) {
          await db.delete('pending_actions', action.id)
        }
      }

      await updatePendingCount()
    } finally {
      syncing.value = false
    }
  }

  async function cacheBookings(bookings: Booking[]) {
    if (!db) return

    const tx = db.transaction('bookings_cache', 'readwrite')
    await tx.store.clear()
    for (const booking of bookings) {
      await tx.store.add(booking)
    }
    await tx.done
  }

  async function getCachedBookings(): Promise<Booking[]> {
    if (!db) return []
    return db.getAll('bookings_cache')
  }

  async function cacheRecurringEvents(events: RecurringEvent[]) {
    if (!db) return

    const tx = db.transaction('recurring_cache', 'readwrite')
    await tx.store.clear()
    for (const event of events) {
      await tx.store.add(event)
    }
    await tx.done
  }

  async function getCachedRecurringEvents(): Promise<RecurringEvent[]> {
    if (!db) return []
    return db.getAll('recurring_cache')
  }

  function handleOnline() {
    isOnline.value = true
    syncPendingActions()
  }

  function handleOffline() {
    isOnline.value = false
  }

  function setupListeners() {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  function cleanupListeners() {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  return {
    isOnline,
    pendingCount,
    syncing,
    initDB,
    addPendingAction,
    syncPendingActions,
    cacheBookings,
    getCachedBookings,
    cacheRecurringEvents,
    getCachedRecurringEvents,
    setupListeners,
    cleanupListeners
  }
})
