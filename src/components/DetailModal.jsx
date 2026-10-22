import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMovie } from '../api/client'
import { useCatalog } from '../catalog/useCatalog'
import { useLibrary } from '../library/useLibrary'
import Modal from './Modal'
import PosterShape from './PosterShape'
import { paletteFor } from './posterArt'
import './DetailModal.css'

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M4 2.5v13l11-6.5z" fill="currentColor" />
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 3.7 4.5 6.9 4.5c1.9 0 3.5 1 5.1 3 1.6-2 3.2-3 5.1-3 3.2 0 5.3 3.1 4.1 6.6-1.7 4.8-9.2 9.4-9.2 9.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DetailModal({ item, onClose }) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite, addToHistory, favoriteError, clearFavoriteError } = useLibrary()
  const { genres } = useCatalog()
  // Runtime and genre names come from GET /movie when the modal opens. A failure just omits the runtime.
  const [detail, setDetail] = useState({ id: null, movie: null })
  const itemId = item?.id ?? null

  useEffect(() => {
    if (!itemId) return
    let cancelled = false
    getMovie(itemId)
      .then((movie) => !cancelled && setDetail({ id: itemId, movie }))
      .catch(() => !cancelled && setDetail({ id: itemId, movie: null }))
    return () => {
      cancelled = true
    }
  }, [itemId])

  // The dialog is open whenever an item is selected; Modal unmounts its content when it closes.
  const open = Boolean(item)
  const p = item ? paletteFor(item) : null
  const loaded = item && detail.id === item.id
  const full = loaded ? detail.movie : null
  const genreNames = full?.genres
    ? full.genres.map((g) => g.name)
    : (item?.genreIds ?? []).map((id) => genres.find((g) => g.id === id)?.name).filter(Boolean)
  const faved = item ? isFavorite(item.id) : false
  // Remember which item's preview failed to load, so a new selection tries its image again.
  const [failedId, setFailedId] = useState(null)
  const previewSrc = item && failedId !== item.id ? item.previewUrl || item.thumbnailUrl : null

  function play() {
    addToHistory(item) // saved in the background; never delays playback
    navigate(`/cinema/${item.id}`)
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        clearFavoriteError()
        onClose()
      }} title={item?.title ?? ''}
      size="wide"
    >
      {item && (
        <>
          <div className="preview" style={{ background: p.bg }}>
            {previewSrc ? (
              <img
                className="preview__img"
                src={previewSrc}
                alt={`Scene from ${item.title}`}
                onError={() => setFailedId(item.id)}
              />
            ) : (
              <svg className="preview__art" viewBox="0 0 200 200" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
                <PosterShape variant={Number(item.id) % 4} color={p.shape} />
              </svg>
            )}
            <div className="preview__actions">
              <button type="button" className="btn preview__play" onClick={play}>
                <PlayIcon />
                Play
              </button>
              <button
                type="button"
                className={`preview__fav ${faved ? 'is-on' : ''}`}
                aria-pressed={faved}
                aria-label={faved ? 'Remove from favorites' : 'Add to favorites'}
                onClick={() => toggleFavorite(item)}
              >
                <HeartIcon filled={faved} />
              </button>
            </div>
          </div>
          <p className="detail__notice" role="status">
            {favoriteError ? "We couldn't update your favorites. Please try again." : ''}
          </p>
          <p className="detail__meta">
            {genreNames.length > 0 && <span>{genreNames.join(', ')}</span>}
            {item.year && <span>{item.year}</span>}
            {!loaded && <span className="detail__runtime-skeleton skeleton" aria-hidden="true" />}
            {full?.runtime && <span>{full.runtime}</span>}
          </p>
          <p className="detail__desc">{item.description}</p>
        </>
      )}
    </Modal>
  )
}
