import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getLibrary, recordPlay, setFavorite } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { LibraryContext } from './LibraryContext'

const HISTORY_LIMIT = 10
const EMPTY = { favorites: [], history: [] }
const NOTICE_MS = 4000

// Favorites and watch history of the signed-in user, stored in the database. Both are lists of
// movie summaries (newest first), hydrated from TMDB by GET /library.
// Updates are optimistic: the UI changes at once, then the server's list replaces it;
// if the request fails the change is undone. Signing out clears the loaded library from state.
export function LibraryProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // The loaded library is tagged with the user it belongs to, so a different (or no) user
  // never sees it and nothing has to be reset by hand when the user changes.
  const [lib, setLib] = useState({ userId: null, status: 'idle', ...EMPTY })
  const [attempt, setAttempt] = useState(0)
  const [favoriteError, setFavoriteError] = useState(false)
  const pending = useRef({ favorites: 0, history: 0 })
  const libRef = useRef(lib) // latest library, for reconciling a server id list with known movies
  const noticeTimer = useRef(null)

  const mine = lib.userId === userId ? lib : null
  const data = mine ?? EMPTY
  let status = 'idle'
  if (userId) status = mine ? mine.status : 'loading'

  useEffect(() => {
    libRef.current = lib
  }, [lib])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    pending.current = { favorites: 0, history: 0 }
    getLibrary()
      .then((res) => {
        if (cancelled) return
        setLib({
          userId,
          status: 'ready',
          favorites: Array.isArray(res?.favorites) ? res.favorites : [],
          history: Array.isArray(res?.history) ? res.history.slice(0, HISTORY_LIMIT) : [],
        })
      })
      .catch(() => {
        if (!cancelled) setLib({ userId, status: 'error', ...EMPTY })
      })
    return () => {
      cancelled = true
      setLib({ userId: null, status: 'idle', ...EMPTY }) // sign-out (or a reload) clears the loaded library
    }
  }, [userId, attempt])

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  // Silently replaces the library with the server's hydrated copy (no loading state).
  const refetch = useCallback(() => {
    if (!userId) return
    getLibrary()
      .then((res) => {
        setLib((l) =>
          l.userId === userId
            ? {
                ...l,
                favorites: Array.isArray(res?.favorites) ? res.favorites : l.favorites,
                history: Array.isArray(res?.history) ? res.history.slice(0, HISTORY_LIMIT) : l.history,
              }
            : l,
        )
      })
      .catch(() => {})
  }, [userId])

  // Runs one optimistic change. `apply` maps the list to its new value, `undo` reverses it.
  const mutate = useCallback(
    (field, apply, undo, request, onFail) => {
      if (!userId) return
      const change = (fn) => setLib((l) => (l.userId === userId ? { ...l, [field]: fn(l[field]) } : l))
      change(apply)
      pending.current[field] += 1
      request()
        .then((ids) => {
          pending.current[field] -= 1
          // Only take the server's list once no other change to this list is in flight.
          if (pending.current[field] !== 0 || !Array.isArray(ids)) return
          const cur = libRef.current
          if (cur.userId !== userId) return
          const known = new Map([...cur.favorites, ...cur.history].map((m) => [m.id, m]))
          const list = (field === 'history' ? ids.slice(0, HISTORY_LIMIT) : ids).map((id) => known.get(id))
          if (list.every(Boolean)) change(() => list)
          else refetch() // an id we have no movie for: ask the server for the hydrated library
        })
        .catch(() => {
          pending.current[field] -= 1
          change(undo)
          onFail?.()
        })
    },
    [userId, refetch],
  )

  const toggleFavorite = useCallback(
    (movie) => {
      const id = movie.id
      const on = !data.favorites.some((f) => f.id === id)
      mutate(
        'favorites',
        (list) => (on ? [movie, ...list.filter((f) => f.id !== id)] : list.filter((f) => f.id !== id)),
        (list) => (on ? list.filter((f) => f.id !== id) : [movie, ...list.filter((f) => f.id !== id)]),
        () => setFavorite(id, on),
        () => {
          setFavoriteError(true)
          clearTimeout(noticeTimer.current)
          noticeTimer.current = setTimeout(() => setFavoriteError(false), NOTICE_MS)
        },
      )
    },
    [data.favorites, mutate],
  )

  // A failed history save is reverted quietly; playback is never blocked.
  const addToHistory = useCallback(
    (movie) => {
      const before = data.history
      mutate(
        'history',
        (list) => [movie, ...list.filter((h) => h.id !== movie.id)].slice(0, HISTORY_LIMIT),
        () => before,
        () => recordPlay(movie.id),
      )
    },
    [data.history, mutate],
  )

  const clearFavoriteError = useCallback(() => setFavoriteError(false), [])

  const value = useMemo(
    () => ({
      favorites: data.favorites,
      history: data.history,
      status,
      reload,
      favoriteError,
      clearFavoriteError,
      isFavorite: (id) => data.favorites.some((f) => f.id === id),
      toggleFavorite,
      addToHistory,
    }),
    [data, status, reload, favoriteError, clearFavoriteError, toggleFavorite, addToHistory],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
