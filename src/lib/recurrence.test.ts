import { describe, expect, it } from 'vitest'
import { expandEventsForWeek } from './recurrence'
import type { RecurringEvent } from '@/types'

/** Wednesday. The week it belongs to runs Mon 2026-01-12 .. Sun 2026-01-18. */
const MID_WEEK = new Date(2026, 0, 14)

function event(overrides: Partial<RecurringEvent> = {}): RecurringEvent {
  return {
    id: 'evt-1',
    user_id: 'user-1',
    title: 'Choir practice',
    recurrence_type: 'weekly',
    day_of_week: [3],
    start_time: '19:00:00',
    end_time: '22:00:00',
    valid_from: '2020-01-01',
    valid_until: null,
    is_active: true,
    ...overrides
  }
}

function datesOf(events: RecurringEvent[], date = MID_WEEK): string[] {
  return expandEventsForWeek(events, date).map((b) => b.start_time.slice(0, 10))
}

describe('expandEventsForWeek', () => {
  it('expands a weekly rule onto the selected weekdays only', () => {
    // 1 = Monday, 3 = Wednesday, matching Date.getDay().
    expect(datesOf([event({ day_of_week: [1, 3] })])).toEqual(['2026-01-12', '2026-01-14'])
  })

  it('expands a daily rule onto every day of the week', () => {
    expect(datesOf([event({ recurrence_type: 'daily', day_of_week: [] })])).toHaveLength(7)
  })

  it('reads day_of_week as days of the month for monthly rules', () => {
    // The 31st exists, but not inside this week.
    const dates = datesOf([event({ recurrence_type: 'monthly', day_of_week: [14, 31] })])
    expect(dates).toEqual(['2026-01-14'])
  })

  it('skips inactive rules', () => {
    expect(datesOf([event({ is_active: false })])).toEqual([])
  })

  it('ignores days before valid_from', () => {
    expect(datesOf([event({ valid_from: '2026-01-15' })])).toEqual([])
  })

  it('ignores days after valid_until', () => {
    expect(datesOf([event({ valid_until: '2026-01-13' })])).toEqual([])
  })

  it('keeps an open-ended rule running years into the future', () => {
    // Regression guard: an earlier version stopped an unbounded rule twelve
    // months from "now", so it silently disappeared further ahead.
    const farFuture = new Date(2036, 0, 16) // a Wednesday
    expect(datesOf([event({ valid_until: null })], farFuture)).toEqual(['2036-01-16'])
  })

  it('combines the date with the rule time and marks the entry as recurring', () => {
    const [occurrence] = expandEventsForWeek([event()], MID_WEEK)

    expect(occurrence.start_time).toBe('2026-01-14T19:00:00')
    expect(occurrence.end_time).toBe('2026-01-14T22:00:00')
    expect(occurrence.is_recurring).toBe(true)
    expect(occurrence.recurring_event_id).toBe('evt-1')
    expect(occurrence.is_all_day).toBe(false)
  })

  it('gives every occurrence a distinct, reproducible id', () => {
    const ids = expandEventsForWeek([event({ day_of_week: [1, 3, 5] })], MID_WEEK).map((b) => b.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(expandEventsForWeek([event({ day_of_week: [1, 3, 5] })], MID_WEEK).map((b) => b.id))
  })

  it('expands several rules into one list', () => {
    const bookings = expandEventsForWeek(
      [event({ id: 'a', day_of_week: [1] }), event({ id: 'b', day_of_week: [5] })],
      MID_WEEK
    )

    expect(bookings.map((b) => b.recurring_event_id)).toEqual(['a', 'b'])
  })
})
