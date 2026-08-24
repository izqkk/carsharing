import { eachDayOfInterval, endOfWeek, format, getDay, parseISO, startOfWeek } from 'date-fns'
import type { ExpandedBooking, RecurringEvent } from '@/types'

/** Monday-based weeks, matching the calendar grid. */
const WEEK_OPTIONS = { weekStartsOn: 1 } as const

function isWithinValidity(day: Date, event: RecurringEvent): boolean {
  if (day < parseISO(event.valid_from)) return false

  // An event with no end date runs indefinitely. (An earlier version capped it
  // at "twelve months from now", which made open-ended entries quietly vanish
  // from the calendar once the user scrolled far enough ahead.)
  if (!event.valid_until) return true

  return day <= parseISO(event.valid_until)
}

function occursOn(day: Date, event: RecurringEvent): boolean {
  switch (event.recurrence_type) {
    case 'daily':
      return true
    case 'weekly':
      // `day_of_week` holds 0-6, Sunday-first, matching `Date.getDay()`.
      return event.day_of_week.includes(getDay(day))
    case 'monthly':
      // The same column is reused for days of the month (1-31).
      return event.day_of_week.includes(day.getDate())
  }
}

/**
 * Turns recurrence rules into concrete calendar entries for the week
 * containing `date`. Nothing is written to the database: occurrences exist
 * only for as long as they are on screen, which is why they cannot be edited
 * or deleted individually.
 */
export function expandEventsForWeek(
  events: RecurringEvent[],
  date: Date
): ExpandedBooking[] {
  const days = eachDayOfInterval({
    start: startOfWeek(date, WEEK_OPTIONS),
    end: endOfWeek(date, WEEK_OPTIONS)
  })

  const expanded: ExpandedBooking[] = []

  for (const event of events) {
    if (!event.is_active) continue

    for (const day of days) {
      if (!isWithinValidity(day, event)) continue
      if (!occursOn(day, event)) continue

      const dateStr = format(day, 'yyyy-MM-dd')
      expanded.push({
        // Stable and unique per occurrence, so Vue's keyed rendering does not
        // reuse one day's row for another.
        id: `${event.id}_${dateStr}`,
        recurring_event_id: event.id,
        user_id: event.user_id,
        title: event.title,
        start_time: `${dateStr}T${event.start_time}`,
        end_time: `${dateStr}T${event.end_time}`,
        is_all_day: false,
        is_recurring: true,
        profile: event.profile
      })
    }
  }

  return expanded
}
