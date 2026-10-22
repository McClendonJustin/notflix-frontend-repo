import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import DetailModal from '../components/DetailModal'
import Footer from '../components/Footer'
import NavDrawer from '../components/NavDrawer'
import Poster from '../components/Poster'
import PosterSkeleton from '../components/PosterSkeleton'
import { PAGE_SIZE } from '../catalog/pageSize'
import { useCatalog } from '../catalog/useCatalog'
import { useLibrary } from '../library/useLibrary'
import './Selection.css'

export default function Selection() {
  const { user } = useAuth()
  const {
    status,
    movies,
    genres,
    genreId,
    setGenre,
    hasMore,
    moreStatus,
    loadMore,
    reload: reloadCatalog,
  } = useCatalog()
  const { history, favorites, status: libraryStatus, reload: reloadLibrary } = useLibrary()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const menuBtn = useRef(null)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return movies.filter((m) => !q || m.title.toLowerCase().includes(q))
  }, [movies, query])

  // The drawer lists come straight from the hydrated library, not from the catalog page.
  const listsStatus = libraryStatus === 'idle' ? 'ready' : libraryStatus
  const genre = genres.find((g) => g.id === genreId)?.name ?? null
  const filtered = Boolean(genreId || query.trim())

  function closeDrawer() {
    setDrawerOpen(false)
    menuBtn.current?.focus()
  }

  function clearFilters() {
    setQuery('')
    setGenre(null)
  }

  let heading = 'All titles'
  if (genre && query.trim()) heading = `${genre} matching "${query.trim()}"`
  else if (genre) heading = genre
  else if (query.trim()) heading = `Results for "${query.trim()}"`

  return (
    <div className="selection">
      <header className="selection__bar">
        <div className="selection__brand">
          <button
            ref={menuBtn}
            type="button"
            className="icon-btn"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/selection" className="wordmark">
            Notflix
          </Link>
        </div>
        <Link to="/profile" className="selection__user" aria-label={`Profile: ${user.name}`}>
          {user.name}
        </Link>
      </header>

      <NavDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        query={query}
        onQuery={setQuery}
        genre={genreId}
        onGenre={setGenre}
        history={history}
        favorites={favorites}
        onOpenTitle={setActive}
        listsStatus={listsStatus}
        onRetryLists={reloadLibrary}
      />

      <main className="selection__main">
        <div className="selection__heading">
          <h1>{heading}</h1>
          {filtered && (
            <button type="button" className="btn btn--quiet selection__clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {status === 'loading' && (
          <ul className="grid" aria-busy="true" aria-label="Loading titles">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
              <li key={i}>
                <PosterSkeleton />
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && (
          <div className="selection__empty" role="status">
            <p>We can't load titles right now.</p>
            <button type="button" className="btn" onClick={reloadCatalog}>
              Try again
            </button>
          </div>
        )}

        {status === 'ready' &&
          (visible.length === 0 ? (
            <div className="selection__empty" role="status">
              <p>Nothing matches that search. Try a different title or clear the filters.</p>
              <button type="button" className="btn" onClick={clearFilters}>
                Show all titles
              </button>
            </div>
          ) : (
            <>
              <ul className="grid">
                {visible.map((item) => (
                  <li key={item.id}>
                    <button type="button" className="grid__tile" aria-label={item.title} onClick={() => setActive(item)}>
                      <Poster item={item} />
                    </button>
                  </li>
                ))}
                {moreStatus === 'loading' &&
                  Array.from({ length: PAGE_SIZE }, (_, i) => (
                    <li key={`more-${i}`}>
                      <PosterSkeleton />
                    </li>
                  ))}
              </ul>
              {hasMore && moreStatus === 'error' && (
                <div className="selection__more" role="status">
                  <p>We can't load more titles right now.</p>
                  <button type="button" className="btn" onClick={loadMore}>
                    Try again
                  </button>
                </div>
              )}
              {hasMore && moreStatus === 'idle' && (
                <div className="selection__more">
                  <button type="button" className="btn" onClick={loadMore}>
                    Load more
                  </button>
                </div>
              )}
            </>
          ))}
      </main>

      <Footer className="selection__footer" />

      <Link to="/donate" className="mug" aria-label="Donate">
        <img src="/coffee-mug.svg" alt="" width="56" height="56" />
      </Link>

      <DetailModal item={active} onClose={() => setActive(null)} />
    </div>
  )
}
