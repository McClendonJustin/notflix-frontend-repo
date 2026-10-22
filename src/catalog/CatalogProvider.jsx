import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getGenres, getMovies } from '../api/client'
import { CatalogContext } from './CatalogContext'
import { PAGE_SIZE } from './pageSize'

// The live catalog: TMDB's genres plus the Netflix US movies, one page (18, see pageSize.js) at a time through
// the Notflix API. status: 'loading' | 'ready' | 'error' (first page); moreStatus: 'idle' |
// 'loading' | 'error' (Load more). reload() tries again; setGenre() re-queries by TMDB genre id.
const INITIAL = {
  genres: [],
  genresStatus: 'loading',
  movies: [],
  genreId: null,
  page: 0,
  totalPages: 0,
  status: 'loading',
  moreStatus: 'idle',
}

// Most pages Load more may fetch to fill one page of 18 after dropping repeats.
const MAX_TOP_UP_PAGES = 3

function isMoviePage(data) {
  return Array.isArray(data?.movies) && Number.isFinite(data?.page) && Number.isFinite(data?.totalPages)
}

export function CatalogProvider({ children }) {
  const [state, setState] = useState(INITIAL)
  // Bumped whenever the list is replaced, so late responses for an older request are ignored.
  const token = useRef(0)
  const genreIdRef = useRef(null)

  const fetchFirstPage = useCallback((genreId, myToken) => {
    return getMovies({ page: 1, genreId })
      .then((data) => {
        if (myToken !== token.current) return
        if (!isMoviePage(data)) throw new Error('bad movies')
        setState((s) => ({ ...s, status: 'ready', movies: data.movies, page: data.page, totalPages: data.totalPages }))
      })
      .catch(() => {
        if (myToken === token.current) setState((s) => ({ ...s, status: 'error', movies: [], page: 0, totalPages: 0 }))
      })
  }, [])

  const fetchGenres = useCallback((myToken) => {
    return getGenres()
      .then((data) => {
        if (myToken !== token.current) return
        if (!Array.isArray(data?.genres)) throw new Error('bad genres')
        setState((s) => ({ ...s, genres: data.genres, genresStatus: 'ready' }))
      })
      .catch(() => {
        if (myToken === token.current) setState((s) => ({ ...s, genresStatus: 'error' }))
      })
  }, [])

  // Every page load fetches the genres and the first page of movies in parallel.
  useEffect(() => {
    token.current += 1
    fetchGenres(token.current)
    fetchFirstPage(null, token.current)
    return () => {
      token.current += 1
    }
  }, [fetchGenres, fetchFirstPage])

  const reload = useCallback(() => {
    token.current += 1
    setState((s) => ({ ...s, status: 'loading', genresStatus: 'loading', moreStatus: 'idle' }))
    fetchGenres(token.current)
    fetchFirstPage(genreIdRef.current, token.current)
  }, [fetchGenres, fetchFirstPage])

  const setGenre = useCallback(
    (genreId) => {
      if (genreId === genreIdRef.current) return
      genreIdRef.current = genreId
      token.current += 1
      setState((s) => ({ ...s, genreId, movies: [], page: 0, totalPages: 0, status: 'loading', moreStatus: 'idle' }))
      fetchFirstPage(genreId, token.current)
    },
    [fetchFirstPage],
  )

  const loadMore = useCallback(() => {
    const myToken = token.current
    const nextPage = state.page + 1
    if (state.status !== 'ready' || state.moreStatus === 'loading' || nextPage > state.totalPages) return
    setState((s) => ({ ...s, moreStatus: 'loading' }))
    // TMDB's popularity order can shift between requests, so a page can repeat movies already shown.
    // Drop those, and if that leaves the page short (a gap in the last row), top it up from the next
    // page(s) so each Load more adds a full PAGE_SIZE. `page` stays the last page fully used: when
    // the top-up overshoots, the unused rest of that page is fetched again (and deduped) next time.
    const run = async () => {
      const known = new Set(state.movies.map((m) => m.id))
      const batch = []
      let page = nextPage
      let totalPages = state.totalPages
      let used = state.page
      for (let fetched = 0; fetched < MAX_TOP_UP_PAGES; fetched++) {
        const data = await getMovies({ page, genreId: genreIdRef.current })
        if (myToken !== token.current) return
        if (!isMoviePage(data)) throw new Error('bad movies')
        totalPages = data.totalPages
        for (const m of data.movies) {
          if (!known.has(m.id)) {
            known.add(m.id)
            batch.push(m)
          }
        }
        used = batch.length > PAGE_SIZE ? page - 1 : page
        if (batch.length >= PAGE_SIZE || page >= totalPages) break
        page += 1
      }
      setState((s) => ({
        ...s,
        movies: [...s.movies, ...batch.slice(0, PAGE_SIZE)],
        page: used,
        totalPages,
        moreStatus: 'idle',
      }))
    }
    run().catch(() => {
      if (myToken === token.current) setState((s) => ({ ...s, moreStatus: 'error' }))
    })
  }, [state.movies, state.page, state.status, state.moreStatus, state.totalPages])

  const value = useMemo(() => ({ ...state, hasMore: state.page < state.totalPages, loadMore, setGenre, reload }), [
    state,
    loadMore,
    setGenre,
    reload,
  ])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
