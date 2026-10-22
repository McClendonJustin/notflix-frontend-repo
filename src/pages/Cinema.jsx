import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BackLink from '../components/BackLink'
import PosterShape from '../components/PosterShape'
import { getMovie } from '../api/client'
import { paletteFor } from '../components/posterArt'
import './Cinema.css'

// TMDB ids: 1 to 9 digits, no leading zero (the API rejects anything else).
const MOVIE_ID_RE = /^[1-9][0-9]{0,8}$/

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 2.5v13l11-6.5z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 3h3.5v12H4zM10.5 3H14v12h-3.5z" fill="currentColor" />
    </svg>
  )
}

export default function Cinema() {
  const { id } = useParams()
  const [playing, setPlaying] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null) // { key, movie } or { key, notFound } or { key, failed }
  const validId = MOVIE_ID_RE.test(id)
  const key = `${id}:${attempt}`

  // The movie is loaded by id (not from the catalog list), so any /cinema/:id link works.
  useEffect(() => {
    if (!validId) return
    let cancelled = false
    getMovie(id)
      .then((movie) => !cancelled && setResult({ key, movie }))
      .catch((err) => !cancelled && setResult({ key, [err?.notFound ? 'notFound' : 'failed']: true }))
    return () => {
      cancelled = true
    }
  }, [id, key, validId])

  const current = result?.key === key ? result : null
  const item = current?.movie ?? null
  const status = !validId || current?.notFound ? 'missing' : current?.failed ? 'error' : item ? 'ready' : 'loading'

  if (status === 'loading') {
    return (
      <div className="cinema" aria-busy="true">
        <header className="cinema__bar">
          <Link to="/selection" className="cinema__back">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to selection
          </Link>
        </header>
        <main className="cinema__main">
          <div className="stage skeleton" role="status" aria-label="Loading">
            <span className="visually-hidden">Loading</span>
          </div>
        </main>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <main className="page-error">
        <h1>We can't load this title</h1>
        <p>We can't load titles right now.</p>
        <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>
        <BackLink />
      </main>
    )
  }

  if (status === 'missing') {
    return (
      <main className="page-error">
        <h1>We can't find that title</h1>
        <p>No selection matches this address. Head back and pick something to watch.</p>
        <BackLink />
      </main>
    )
  }

  const p = paletteFor(item)

  return (
    <div className="cinema">
      <header className="cinema__bar">
        <Link to="/selection" className="cinema__back">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to selection
        </Link>
        <h1 className="cinema__title">{item.title}</h1>
      </header>

      <main className="cinema__main">
        {/* Placeholder stage: the real video element goes here later. */}
        <div className="stage" style={{ background: p.bg, color: p.ink }}>
          <svg className="stage__art" viewBox="0 0 200 200" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
            <PosterShape variant={Number(item.id) % 4} color={p.shape} />
          </svg>
          <div className="stage__text" role="status">
            <p className="stage__line">{playing ? 'Your selection is playing' : 'Paused'}</p>
            <p className="stage__sub">{item.title}</p>
          </div>
        </div>
      </main>

      <footer className="cinema__controls">
        <button
          type="button"
          className="btn cinema__toggle"
          aria-pressed={!playing}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? 'Pause' : 'Play'}
        </button>
      </footer>
    </div>
  )
}
