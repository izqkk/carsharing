import { computed, ref, watch } from 'vue'
import { enGB, de as deDateFns } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import { en, type Dictionary } from './dictionaries/en'
import { de } from './dictionaries/de'
import {
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  resolveInitialLocale
} from './locales'

/**
 * English is the reference shape; `de.ts` declares itself as `Dictionary`, so a
 * missing or misspelled German key is a compile error rather than an
 * "auth.signIn" string leaking into the UI at runtime.
 */
export type { Dictionary }

const dictionaries: Record<Locale, Dictionary> = { en, de }

const dateFnsLocales: Record<Locale, DateFnsLocale> = { en: enGB, de: deDateFns }

/** Dotted paths into the dictionary -- "auth.signIn", "booking.presets.morning". */
export type TranslationKey<T = Dictionary> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${TranslationKey<T[K]>}`
}[keyof T & string]

export type TranslationVars = Record<string, string | number>

/**
 * Keys that carry plural forms -- every `x.y.other` in the dictionary
 * contributes the base `x.y` here, so `plural()` cannot be handed a key that
 * has no plural branches.
 */
type PluralBase<K> = K extends `${infer Base}.other` ? Base : never
export type PluralKey = PluralBase<TranslationKey>

const locale = ref<Locale>(resolveInitialLocale())

watch(locale, (next) => {
  document.documentElement.lang = next
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    // Preference simply will not survive this session. Not worth surfacing.
  }
})

function lookup(dictionary: Dictionary, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>((node, segment) => (node as Record<string, unknown>)?.[segment], dictionary)

  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  )
}

export function translate(
  activeLocale: Locale,
  key: TranslationKey,
  vars?: TranslationVars
): string {
  const template =
    lookup(dictionaries[activeLocale], key) ?? lookup(dictionaries[FALLBACK_LOCALE], key)

  // Showing the key beats showing nothing: it is obvious in a screenshot and
  // greppable in a bug report.
  return template === undefined ? key : interpolate(template, vars)
}

/**
 * Weekday names straight from the platform, so adding a locale never means
 * hand-maintaining another seven strings. Index 0 is Sunday, matching both
 * `Date.getDay()` and the `day_of_week` column.
 */
export function plural(
  activeLocale: Locale,
  key: PluralKey,
  count: number,
  vars?: TranslationVars
): string {
  const rule = new Intl.PluralRules(activeLocale).select(count)
  const withCount = { count, ...vars }

  // Intl knows six categories; English and German only ever populate two, so
  // fall back to `other` rather than rendering a raw key for "few"/"many".
  const exact = `${key}.${rule}` as TranslationKey
  const translated = translate(activeLocale, exact, withCount)
  return translated === exact
    ? translate(activeLocale, `${key}.other` as TranslationKey, withCount)
    : translated
}

export function weekdayNames(activeLocale: Locale, style: 'long' | 'short'): string[] {
  const formatter = new Intl.DateTimeFormat(activeLocale, { weekday: style, timeZone: 'UTC' })
  // 2024-01-07 was a Sunday; the following six days complete the week.
  return Array.from({ length: 7 }, (_, day) =>
    formatter.format(new Date(Date.UTC(2024, 0, 7 + day)))
  )
}

export function useI18n() {
  return {
    locale: computed(() => locale.value),
    setLocale: (next: Locale) => {
      locale.value = next
    },
    t: (key: TranslationKey, vars?: TranslationVars) => translate(locale.value, key, vars),
    tp: (key: PluralKey, count: number, vars?: TranslationVars) =>
      plural(locale.value, key, count, vars),
    /** Pass to date-fns `format()` so dates follow the chosen language. */
    dateLocale: computed(() => dateFnsLocales[locale.value]),
    weekdays: (style: 'long' | 'short') => weekdayNames(locale.value, style)
  }
}

export { LOCALES, type Locale } from './locales'
