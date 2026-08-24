import { createClient } from '@supabase/supabase-js'
import { IS_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from './app-config'

if (!IS_CONFIGURED) {
  console.warn(
    'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, ' +
      'then rebuild -- these are compiled into the bundle, not read at runtime.'
  )
}

// `navigator.onLine` can report "online" when nothing actually gets through:
// captive portals, a weak signal, a PWA woken from the background. Without a
// deadline the fetch then hangs forever and the UI sits on a spinner.
const REQUEST_TIMEOUT_MS = 15_000

const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  // Honour an abort signal the caller supplied as well as our own deadline.
  if (init.signal) {
    init.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

/**
 * Placeholder values keep `createClient` from throwing at import time when the
 * app is unconfigured, so the UI can render and explain what is missing
 * instead of failing to boot at all.
 */
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    global: { fetch: fetchWithTimeout }
  }
)
