// One palette per TMDB genre id (the first genre of a movie picks its art); shared by posters,
// detail previews and the Cinema stage.
export const PALETTES = {
  28: { bg: '#e2572b', shape: '#1f2326', ink: '#f7f8f4' }, // Action
  12: { bg: '#2f6f5e', shape: '#f2c94c', ink: '#f7f8f4' }, // Adventure
  16: { bg: '#6fb3e0', shape: '#1f2326', ink: '#1f2326' }, // Animation
  35: { bg: '#f2c94c', shape: '#1f2326', ink: '#1f2326' }, // Comedy
  80: { bg: '#2b2f3a', shape: '#c9a24a', ink: '#f7f8f4' }, // Crime
  99: { bg: '#b7e8bf', shape: '#2d7a47', ink: '#1f2326' }, // Documentary
  18: { bg: '#d9a58b', shape: '#5b3a2e', ink: '#1f2326' }, // Drama
  10751: { bg: '#f4b6a6', shape: '#3d6b8c', ink: '#1f2326' }, // Family
  14: { bg: '#4a2f6b', shape: '#e8c6f0', ink: '#f7f8f4' }, // Fantasy
  36: { bg: '#8a6a43', shape: '#f1e3c4', ink: '#f7f8f4' }, // History
  27: { bg: '#3a1f24', shape: '#c8473f', ink: '#f7f8f4' }, // Horror
  10402: { bg: '#1f4d6b', shape: '#f08fb0', ink: '#f7f8f4' }, // Music
  9648: { bg: '#243447', shape: '#9fb4c9', ink: '#f7f8f4' }, // Mystery
  10749: { bg: '#e8929f', shape: '#6b2237', ink: '#1f2326' }, // Romance
  878: { bg: '#1f3a4d', shape: '#7fd1c7', ink: '#f7f8f4' }, // Science Fiction
  10770: { bg: '#5c6670', shape: '#e6e9ec', ink: '#f7f8f4' }, // TV Movie
  53: { bg: '#2d2a26', shape: '#d4672e', ink: '#f7f8f4' }, // Thriller
  10752: { bg: '#4b5340', shape: '#d8cfa0', ink: '#f7f8f4' }, // War
  37: { bg: '#c58a4f', shape: '#4a2e17', ink: '#1f2326' }, // Western
}

export const DEFAULT_PALETTE = { bg: '#2a2f33', shape: '#8d979d', ink: '#f7f8f4' }

// Palette for a movie: its first genre id, or a neutral default.
export const paletteFor = (movie) => PALETTES[movie?.genreIds?.[0]] ?? DEFAULT_PALETTE
