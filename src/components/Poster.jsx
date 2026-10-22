import { useState } from 'react'
import PosterShape from './PosterShape'
import { paletteFor } from './posterArt'
import './Poster.css'

// Shows the title's poster image. If there is no image, or it fails to load,
// falls back to flat, gradient-free generated art carrying the title as its label.
export default function Poster({ item, className = '' }) {
  const [failed, setFailed] = useState(false)
  const p = paletteFor(item)
  const showImage = item.thumbnailUrl && !failed

  return (
    <div className={`poster ${className}`} style={{ background: p.bg, color: p.ink }}>
      {showImage ? (
        <img
          className="poster__img"
          src={item.thumbnailUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <svg viewBox="0 0 200 200" className="poster__art" aria-hidden="true">
            <PosterShape variant={Number(item.id) % 4} color={p.shape} />
          </svg>
          <span className="poster__title">{item.title}</span>
        </>
      )}
    </div>
  )
}
