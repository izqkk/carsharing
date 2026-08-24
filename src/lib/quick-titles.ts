import type { Locale } from '@/i18n'

/**
 * Seed suggestions for the "What for?" chips on the booking screen. They are
 * only ever defaults: as soon as the user edits the list it lives in
 * localStorage and is never overwritten, including after a language switch --
 * the titles are their data, not part of the translation.
 */
const DEFAULTS: Record<Locale, string[]> = {
  en: ['Groceries', 'Work', 'Doctor', 'Sports', 'Day trip'],
  de: ['Einkaufen', 'Arbeit', 'Arzt', 'Sport', 'Ausflug']
}

const STORAGE_KEY = 'carshare.quickTitles'

export function defaultQuickTitles(locale: Locale): string[] {
  return [...DEFAULTS[locale]]
}

export function loadQuickTitles(locale: Locale): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultQuickTitles(locale)

    const parsed: unknown = JSON.parse(stored)
    // Anything can end up in localStorage -- a half-written value, an older
    // format, a different app on the same origin during development.
    if (!Array.isArray(parsed)) return defaultQuickTitles(locale)

    return parsed.filter((title): title is string => typeof title === 'string')
  } catch {
    return defaultQuickTitles(locale)
  }
}

export function saveQuickTitles(titles: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(titles))
  } catch {
    // Quota exceeded or storage blocked; the list still works for this session.
  }
}
