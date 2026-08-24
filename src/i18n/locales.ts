export const LOCALES = ['en', 'de'] as const

export type Locale = (typeof LOCALES)[number]

export const FALLBACK_LOCALE: Locale = 'en'

/** Where the user's explicit choice is remembered across sessions. */
export const LOCALE_STORAGE_KEY = 'carshare.locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Locale precedence, most specific first:
 *
 *   1. what the user picked in the app (localStorage)
 *   2. what the operator configured at build time (VITE_DEFAULT_LOCALE)
 *   3. what the browser asks for
 *   4. English
 *
 * Reading localStorage can throw outright in a locked-down browser (Safari
 * private mode, "block all cookies"), so it is guarded rather than checked --
 * a language preference is never worth a blank screen.
 */
export function resolveInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // Storage unavailable; fall through to the build-time / browser defaults.
  }

  const configured = import.meta.env.VITE_DEFAULT_LOCALE
  if (isLocale(configured)) return configured

  // Guarded because this module is also imported by the test runner, where
  // there is no browser navigator at all.
  const requested = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])

  for (const preferred of requested) {
    const base = preferred?.split('-')[0]
    if (isLocale(base)) return base
  }

  return FALLBACK_LOCALE
}
