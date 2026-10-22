import { useEffect, useRef, useState } from 'react'
import { useCatalog } from '../catalog/useCatalog'
import './NavDrawer.css'

function Chevron({ open }) {
  return (
    <svg className={`drawer__chev ${open ? 'is-open' : ''}`} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Section({ id, label, open, onToggle, children }) {
  return (
    <div className="drawer__section">
      <button
        type="button"
        className="drawer__toggle"
        aria-expanded={open}
        aria-controls={`drawer-${id}`}
        onClick={() => onToggle(id)}
      >
        <span>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <ul id={`drawer-${id}`} className="drawer__list">
          {children}
        </ul>
      )}
    </div>
  )
}

export default function NavDrawer({
  open,
  onClose,
  query,
  onQuery,
  genre,
  onGenre,
  history,
  favorites,
  onOpenTitle,
  listsStatus,
  onRetryLists,
}) {
  const { genresStatus, genres } = useCatalog()
  const [section, setSection] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const toggle = (id) => setSection((s) => (s === id ? null : id))

  function pickTitle(item) {
    onOpenTitle(item)
    onClose()
  }

  function loadingRows() {
    return [0, 1, 2].map((i) => (
      <li key={i} className="drawer__skeleton skeleton" aria-hidden="true" />
    ))
  }

  function titleItems(items, empty) {
    if (listsStatus === 'loading') return loadingRows()
    if (listsStatus === 'error') {
      return (
        <li className="drawer__empty" role="status">
          We can't load this list right now.
          <button type="button" className="drawer__retry" onClick={onRetryLists}>
            Try again
          </button>
        </li>
      )
    }
    if (items.length === 0) {
      return <li className="drawer__empty">{empty}</li>
    }
    return items.map((item) => (
      <li key={item.id}>
        <button type="button" className="drawer__item" onClick={() => pickTitle(item)}>
          {item.title}
        </button>
      </li>
    ))
  }

  return (
    <>
      <div className={`scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside
        id="nav-drawer"
        className={`drawer ${open ? 'is-open' : ''}`}
        aria-label="Menu"
        inert={!open}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
      >
        <div className="drawer__head">
          <form
            className="drawer__search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              onClose()
            }}
          >
            <input
              ref={searchRef}
              className="input"
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search by title"
              autoComplete="off"
            />
          </form>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="drawer__nav">
          <Section id="history" label="History" open={section === 'history'} onToggle={toggle}>
            {titleItems(history, 'Nothing watched yet. Press Play on a title and it shows up here.')}
          </Section>
          <Section id="favorites" label="Favorites" open={section === 'favorites'} onToggle={toggle}>
            {titleItems(favorites, 'No favorites yet. Open a title and tap the heart.')}
          </Section>
          <Section id="genres" label="Genres" open={section === 'genres'} onToggle={toggle}>
            {genresStatus === 'loading' && loadingRows()}
            {genresStatus === 'error' && (
              <li className="drawer__empty" role="status">
                We can't load genres right now.
              </li>
            )}
            {genresStatus === 'ready' &&
              [{ id: null, name: 'All genres' }, ...genres].map((g) => {
                const active = genre === g.id
                return (
                  <li key={g.id ?? 'all'}>
                    <button
                      type="button"
                      className={`drawer__item ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        onGenre(g.id)
                        onClose()
                      }}
                    >
                      {g.name}
                    </button>
                  </li>
                )
              })}
          </Section>
        </nav>
      </aside>
    </>
  )
}
