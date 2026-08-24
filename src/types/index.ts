export interface Profile {
  id: string
  display_name: string
  color: string
  avatar_url?: string | null
  created_at?: string
}

export interface Booking {
  id: string
  user_id: string
  title: string
  start_time: string
  end_time: string
  is_all_day: boolean
  created_at?: string
  profile?: Profile
}

export interface RecurringEvent {
  id: string
  user_id: string
  title: string
  recurrence_type: 'daily' | 'weekly' | 'monthly'
  day_of_week: number[]
  start_time: string
  end_time: string
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at?: string
  profile?: Profile
}

export interface ExpandedBooking extends Omit<Booking, 'id'> {
  id: string
  recurring_event_id?: string
  is_recurring: boolean
}

export interface PendingAction {
  id: string
  type: 'create' | 'update' | 'delete'
  table: 'bookings' | 'recurring_events'
  data: Record<string, unknown>
  created_at: string
}

export type RecurrenceType = 'daily' | 'weekly' | 'monthly'
