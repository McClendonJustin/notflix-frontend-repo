// Drawn on a 200x200 canvas. Four variants, picked from the title id.
export default function PosterShape({ variant, color }) {
  switch (variant) {
    case 0:
      return <circle cx="100" cy="110" r="56" fill={color} />
    case 1:
      return <rect x="44" y="54" width="112" height="112" rx="8" fill={color} transform="rotate(12 100 110)" />
    case 2:
      return <path d="M100 48 L168 168 H32 Z" fill={color} />
    default:
      return (
        <g fill={color}>
          <rect x="36" y="70" width="128" height="16" />
          <rect x="36" y="104" width="96" height="16" />
          <rect x="36" y="138" width="64" height="16" />
        </g>
      )
  }
}
