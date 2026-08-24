/**
 * `||` rather than `??`: an env var that is declared but left empty arrives as
 * `''`, which `??` would happily keep -- leaving the app with a blank name.
 */
export const APP_NAME = import.meta.env.VITE_APP_NAME?.trim() || 'Carshare'

export const APP_DESCRIPTION =
  import.meta.env.VITE_APP_DESCRIPTION?.trim() || 'Shared-car booking for small groups'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

/**
 * Whether the app has enough configuration to reach a backend at all. The UI
 * checks this to explain what is missing, instead of letting every request
 * fail against a placeholder host with an opaque network error.
 */
export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
