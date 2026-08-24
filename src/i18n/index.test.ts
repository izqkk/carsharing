import { describe, expect, it } from 'vitest'
import { plural, translate, weekdayNames } from './index'

describe('translate', () => {
  it('resolves a nested key', () => {
    expect(translate('en', 'auth.signIn')).toBe('Sign in')
    expect(translate('de', 'auth.signIn')).toBe('Anmelden')
  })

  it('substitutes placeholders', () => {
    expect(translate('en', 'booking.timeRange', { start: '09:00', end: '17:00' })).toBe(
      '09:00 – 17:00'
    )
  })

  it('leaves an unknown placeholder untouched rather than printing "undefined"', () => {
    expect(translate('en', 'booking.timeRange', { start: '09:00' })).toBe('09:00 – {end}')
  })

  it('returns the key itself when it does not exist, so the gap is visible', () => {
    // @ts-expect-error -- deliberately not a valid key; this is the runtime guard.
    expect(translate('en', 'nope.not.here')).toBe('nope.not.here')
  })

  it('does not resolve a key that points at a nested object', () => {
    // @ts-expect-error -- "auth" is a namespace, not a string.
    expect(translate('en', 'auth')).toBe('auth')
  })
})

describe('plural', () => {
  it('picks the singular and plural forms in English', () => {
    expect(plural('en', 'profile.pendingSync', 1)).toBe('1 change waiting to sync')
    expect(plural('en', 'profile.pendingSync', 4)).toBe('4 changes waiting to sync')
  })

  it('picks the singular and plural forms in German', () => {
    expect(plural('de', 'profile.pendingSync', 1)).toBe('1 Änderung wartet auf Synchronisierung')
    expect(plural('de', 'profile.pendingSync', 4)).toBe('4 Änderungen warten auf Synchronisierung')
  })

  it('treats zero as plural in both languages', () => {
    expect(plural('en', 'profile.pendingSync', 0)).toBe('0 changes waiting to sync')
    expect(plural('de', 'profile.pendingSync', 0)).toBe('0 Änderungen warten auf Synchronisierung')
  })
})

describe('weekdayNames', () => {
  it('starts at Sunday, matching Date.getDay() and the day_of_week column', () => {
    expect(weekdayNames('en', 'long')[0]).toBe('Sunday')
    expect(weekdayNames('en', 'long')[1]).toBe('Monday')
    expect(weekdayNames('de', 'long')[0]).toBe('Sonntag')
  })

  it('returns exactly seven names in both styles', () => {
    expect(weekdayNames('de', 'short')).toHaveLength(7)
    expect(weekdayNames('en', 'short')).toHaveLength(7)
  })
})
