import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultQuickTitles, loadQuickTitles, saveQuickTitles } from './quick-titles'

const KEY = 'carshare.quickTitles'

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key)
  }
  vi.stubGlobal('localStorage', storage)
  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('defaultQuickTitles', () => {
  it('is translated per locale', () => {
    expect(defaultQuickTitles('en')).toContain('Groceries')
    expect(defaultQuickTitles('de')).toContain('Einkaufen')
  })

  it('hands out a fresh array each time, so callers cannot mutate the seed', () => {
    defaultQuickTitles('en').push('Mutated')
    expect(defaultQuickTitles('en')).not.toContain('Mutated')
  })
})

describe('loadQuickTitles', () => {
  beforeEach(() => stubStorage())

  it('falls back to the locale defaults when nothing is stored', () => {
    expect(loadQuickTitles('de')).toEqual(defaultQuickTitles('de'))
  })

  it('returns what the user saved, ignoring the defaults', () => {
    stubStorage({ [KEY]: JSON.stringify(['Ferry', 'Airport']) })
    expect(loadQuickTitles('en')).toEqual(['Ferry', 'Airport'])
  })

  it('keeps an empty list the user deliberately emptied', () => {
    stubStorage({ [KEY]: '[]' })
    expect(loadQuickTitles('en')).toEqual([])
  })

  it('falls back when the stored value is not valid JSON', () => {
    stubStorage({ [KEY]: 'not json' })
    expect(loadQuickTitles('en')).toEqual(defaultQuickTitles('en'))
  })

  it('falls back when the stored value is the wrong shape', () => {
    stubStorage({ [KEY]: '{"titles":["Work"]}' })
    expect(loadQuickTitles('en')).toEqual(defaultQuickTitles('en'))
  })

  it('drops non-string entries rather than rendering them', () => {
    stubStorage({ [KEY]: '["Work", 42, null]' })
    expect(loadQuickTitles('en')).toEqual(['Work'])
  })

  it('survives storage being blocked entirely', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      }
    })
    expect(loadQuickTitles('en')).toEqual(defaultQuickTitles('en'))
  })
})

describe('saveQuickTitles', () => {
  it('round-trips through storage', () => {
    stubStorage()
    saveQuickTitles(['Work'])
    expect(loadQuickTitles('en')).toEqual(['Work'])
  })

  it('does not throw when storage rejects the write', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('QuotaExceededError')
      }
    })
    expect(() => saveQuickTitles(['Work'])).not.toThrow()
  })
})
