/// <reference types="vite/client" />

/**
 * Every build-time setting this app understands. Declaring them here (rather
 * than relying on Vite's `[key: string]: any` fallback) means a typo in a
 * variable name is a type error, and this file doubles as the authoritative
 * list that `.env.example` and the README are checked against.
 */
interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcdefgh.supabase.co */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase *anon* (publishable) key. Never the service-role key. */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Name shown in the UI, the browser tab and the installed PWA. */
  readonly VITE_APP_NAME?: string
  /** One-line description used in the PWA manifest and meta tags. */
  readonly VITE_APP_DESCRIPTION?: string
  /** Initial UI language when the visitor has no stored preference: 'en' | 'de'. */
  readonly VITE_DEFAULT_LOCALE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
