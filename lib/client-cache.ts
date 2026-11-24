// ============================================
// In-memory cache of page data (stale-while-revalidate): a page shows what it
// loaded last time at once and refreshes it in the background. Lives until the
// tab is reloaded; keys include the user and the day, and the whole cache is
// cleared when a different user signs in or out.
// ============================================

const store = new Map<string, unknown>()

/** Key for one user's data of today; `parts` are the request parameters */
export function cacheKey(userId: string | undefined, ...parts: (string | number | null | undefined)[]) {
  return [userId ?? 'anon', new Date().toDateString(), ...parts].join('|')
}

export function cacheGet<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function cacheSet<T>(key: string, value: T) {
  store.set(key, value)
}

export function cacheClear() {
  store.clear()
}
