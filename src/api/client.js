// Small fetch client for the Notflix Edge Functions. The catalog is public; library, favorites and
// history send the signed-in user's access token (read from the current session at call time).
// Every failure becomes an Error with a friendly message; raw server text is never surfaced.
import { supabase } from './supabase'

const BASE = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1`
const TIMEOUT_MS = 15000

export const UNREACHABLE = "We can't reach Notflix right now. Please try again."

// A 404 is kept apart from other failures so a missing movie can say "not found".
function notFoundError() {
  const err = new Error(UNREACHABLE)
  err.notFound = true
  return err
}

async function request(path, options = {}, { signedIn = false } = {}) {
  const headers = {}
  if (options.body) headers['Content-Type'] = 'application/json'
  if (signedIn) {
    let token
    try {
      token = (await supabase.auth.getSession()).data.session?.access_token
    } catch {
      token = undefined
    }
    if (!token) throw new Error(UNREACHABLE)
    headers.Authorization = `Bearer ${token}`
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    if (res.status === 404) throw notFoundError()
    if (!res.ok) throw new Error(UNREACHABLE)
    return await res.json()
  } catch (err) {
    if (err?.notFound) throw err
    throw new Error(UNREACHABLE, { cause: err })
  } finally {
    clearTimeout(timer)
  }
}

const post = (path, body, opts) => request(path, { method: 'POST', body: JSON.stringify(body) }, opts)

export const getGenres = () => request('/genres')

// One page (20 movies) of the Netflix US catalog, optionally for one TMDB genre id.
export const getMovies = ({ page = 1, genreId = null } = {}) =>
  request(`/movies?page=${page}${genreId ? `&genre=${encodeURIComponent(genreId)}` : ''}`)

// One movie with its runtime and genre names; rejects with err.notFound when the id is unknown.
export const getMovie = async (id) => (await request(`/movie?id=${encodeURIComponent(id)}`)).movie

// Signed-in endpoints: the user comes from the access token, never from the request.
export const getLibrary = () => request('/library', {}, { signedIn: true })

export const setFavorite = async (titleId, favorite) =>
  (await post('/favorites', { titleId: String(titleId), favorite }, { signedIn: true })).favorites

export const recordPlay = async (titleId) =>
  (await post('/history', { titleId: String(titleId) }, { signedIn: true })).history

// Starts a one-time donation (amount in whole US cents, 1 to 10000). Resolves with the Stripe
// client secret the card form confirms; the browser never sees a Stripe secret key.
export const createDonation = async (amount, userId) =>
  (await post('/process-donation', { amount, user_id: userId }, { signedIn: true })).client_secret
