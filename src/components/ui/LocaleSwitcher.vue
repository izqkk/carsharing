<script setup lang="ts">
import { LOCALES, useI18n, type Locale } from '@/i18n'
import { Languages } from '@lucide/vue'

const { locale, setLocale } = useI18n()

/**
 * Each language is labelled in itself -- someone who lands on the wrong one
 * has to be able to recognise their own.
 */
const LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch'
}
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-full border p-1">
    <Languages
      class="w-4 h-4 mx-1.5 text-(--color-muted-foreground)"
      aria-hidden="true"
    />
    <button
      v-for="code in LOCALES"
      :key="code"
      type="button"
      :lang="code"
      :aria-pressed="locale === code"
      class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
      :class="locale === code
        ? 'bg-(--color-primary) text-(--color-primary-foreground)'
        : 'text-(--color-muted-foreground) hover:text-(--color-foreground)'"
      @click="setLocale(code)"
    >
      {{ LABELS[code] }}
    </button>
  </div>
</template>
