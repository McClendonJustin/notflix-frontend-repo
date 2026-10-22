import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../api/supabase'
import { AuthContext } from './AuthContext'

// The signed-in user comes from a real Supabase Auth session. Sign-up and sign-in are built;
// a saved session is recovered on load; changing the password is not built yet.
const UNREACHABLE = "We can't reach Notflix right now. Please try again."
const EXISTS = 'An account with this email already exists. Sign in instead.'

// The profile name defaults to the email's local part with a capital first letter (as the database does).
const fallbackName = (email) => {
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchProfile(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email_address')
    .eq('id', id)
    .maybeSingle()
  return error ? null : data
}

// Loads the profile row; retries once if the trigger's row is not visible yet.
async function loadProfile(id) {
  let row = await fetchProfile(id)
  if (!row) {
    await wait(600)
    row = await fetchProfile(id)
  }
  return row
}

function signUpError(error) {
  const code = error?.code
  const status = error?.status
  if (code === 'user_already_exists' || code === 'email_exists') return EXISTS
  if (code === 'weak_password') return 'Choose a stronger password and try again.'
  if (code === 'email_address_invalid') return 'Enter a valid email address.'
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (status === 0 || status === undefined || status >= 500 || error?.name === 'AuthRetryableFetchError') {
    return UNREACHABLE
  }
  return "We couldn't create your account. Check your details and try again."
}

const BAD_CREDENTIALS = 'That email and password do not match an account.'

function signInError(error) {
  const code = error?.code
  const status = error?.status
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (status === 0 || status >= 500 || error?.name === 'AuthRetryableFetchError') return UNREACHABLE
  if (
    code === 'invalid_credentials' ||
    code === 'validation_failed' ||
    code === 'email_not_confirmed' ||
    status === 400 ||
    status === 422
  ) {
    return BAD_CREDENTIALS
  }
  return "We couldn't sign you in. Please try again."
}

// Removes any Supabase session the library left in browser storage (keys start with "sb-").
function clearStoredSession() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      Object.keys(store)
        .filter((k) => k.startsWith('sb-'))
        .forEach((k) => store.removeItem(k))
    } catch {
      // storage unavailable
    }
  }
}

// A saved login the server rejects (expired, revoked, deleted account, garbage) is a bad token;
// anything else (offline, timeout, 5xx) is treated as a network problem and never wipes the login.
const BAD_CODES = ['refresh_token_not_found', 'refresh_token_already_used', 'session_not_found', 'user_not_found', 'bad_jwt', 'session_expired']
function isBadToken(error) {
  if (!error) return false
  if (error.name === 'AuthSessionMissingError' || BAD_CODES.includes(error.code)) return true
  return [400, 401, 403, 404, 422].includes(error.status)
}

async function endSession() {
  try {
    await supabase.auth.signOut()
  } catch {
    // the storage cleanup below still signs the user out locally
  }
  clearStoredSession()
}

function passwordError(error) {
  const code = error?.code
  const status = error?.status
  if (code === 'weak_password') return 'Choose a stronger password and try again.'
  if (code === 'same_password') return 'Choose a password you have not used before.'
  if (status === 0 || status >= 500 || error?.name === 'AuthRetryableFetchError') return UNREACHABLE
  return "We couldn't change your password. Please try again."
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [authError, setAuthError] = useState('')
  const busy = useRef(false) // an explicit sign-in or sign-up is running
  const gen = useRef(0) // bumped by every start/stop of a session flow; stale async results are dropped
  const userRef = useRef(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  // Replaces (never merges) the signed-in user with the profile of the given auth user.
  // Returns false (and changes nothing) if a newer flow started while the profile loaded.
  const adoptUser = useCallback(async (authUser, fallbackEmail, g) => {
    const profile = await loadProfile(authUser.id)
    if (g !== gen.current) return false
    setUser({
      id: authUser.id,
      email: profile?.email_address ?? authUser.email ?? fallbackEmail,
      name: profile?.name || fallbackName(authUser.email ?? fallbackEmail),
    })
    return true
  }, [])

  // Recovers the user from the saved session, confirmed with the server (getUser).
  const restore = useCallback(
    async ({ silent = false } = {}) => {
      const g = ++gen.current
      if (!silent) {
        setInitializing(true)
        setAuthError('')
      }
      const stale = () => g !== gen.current
      try {
        const { data: sd, error: se } = await supabase.auth.getSession()
        if (stale()) return
        if (se && !isBadToken(se)) throw se
        if (se || !sd?.session) {
          if (se) await endSession()
          if (!stale()) setUser(null)
          return
        }
        const { data: ud, error: ue } = await supabase.auth.getUser()
        if (stale()) return
        if (ue && !isBadToken(ue)) throw ue
        if (ue || !ud?.user) {
          await endSession()
          if (!stale()) setUser(null)
          return
        }
        await adoptUser(ud.user, ud.user.email ?? '', g)
      } catch {
        // Could not reach the server: keep the saved login, say so (never wipe it).
        if (!stale() && !silent) setAuthError(UNREACHABLE)
      } finally {
        if (!stale()) setInitializing(false)
      }
    },
    [adoptUser],
  )

  // Recover the session on load.
  useEffect(() => {
    const timer = setTimeout(restore, 0)
    return () => clearTimeout(timer)
  }, [restore])

  // Follow the session. Supabase calls are deferred with setTimeout (never made inside the callback).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        gen.current += 1
        setUser(null)
        setInitializing(false)
        return
      }
      if (busy.current) return // sign-in/up adopts its own user
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Another tab signed in as someone else (or this tab has no user yet): re-confirm silently.
        if (session?.user && userRef.current?.id !== session.user.id) {
          setTimeout(() => restore({ silent: true }), 0)
        }
      }
    })
    return () => data.subscription.unsubscribe()
  }, [restore])

  const signUp = useCallback(async (email, password) => {
    if (busy.current) return { ok: false, error: 'Please wait a moment.' }
    busy.current = true
    const g = ++gen.current
    setInitializing(false)
    try {
      const cleanEmail = email.trim()
      let res
      try {
        res = await supabase.auth.signUp({ email: cleanEmail, password })
      } catch {
        return { ok: false, error: UNREACHABLE }
      }
      if (res.error) return { ok: false, error: signUpError(res.error) }
      const authUser = res.data?.user
      if (authUser && Array.isArray(authUser.identities) && authUser.identities.length === 0) {
        return { ok: false, error: EXISTS }
      }
      if (!res.data?.session || !authUser) {
        return { ok: false, error: 'Check your email to confirm your account.' }
      }
      await adoptUser(authUser, cleanEmail, g)
      return { ok: true }
    } finally {
      busy.current = false
    }
  }, [adoptUser])

  const signIn = useCallback(
    async (email, password) => {
      if (busy.current) return { ok: false, error: 'Please wait a moment.' }
      const cleanEmail = (email ?? '').trim()
      if (!cleanEmail || !password) return { ok: false, error: BAD_CREDENTIALS }
      busy.current = true
      const g = ++gen.current
      setInitializing(false)
      try {
        let res
        try {
          res = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        } catch {
          return { ok: false, error: UNREACHABLE }
        }
        if (res.error) return { ok: false, error: signInError(res.error) }
        const authUser = res.data?.user
        if (!authUser || !res.data?.session) return { ok: false, error: BAD_CREDENTIALS }
        await adoptUser(authUser, cleanEmail, g)
        return { ok: true }
      } finally {
        busy.current = false
      }
    },
    [adoptUser],
  )

  // Signs out at once in the UI (which also clears the library, keyed by user id), then ends the
  // Supabase session. If that call fails (offline), stored credentials are removed anyway.
  const signOut = useCallback(async () => {
    gen.current += 1
    setUser(null)
    setInitializing(false)
    setAuthError('')
    await endSession()
  }, [])

  // Checks the current password (a sign-in that must return the same user), then sets the new one.
  // `busy` keeps the auth events of the re-check from touching the signed-in user or the library.
  const changePassword = useCallback(
    async (current, next) => {
      if (!user) return { ok: false, error: 'Sign in to change your password.' }
      if (busy.current) return { ok: false, error: 'Please wait a moment.' }
      busy.current = true
      try {
        let check
        try {
          check = await supabase.auth.signInWithPassword({ email: user.email, password: current })
        } catch {
          return { ok: false, error: UNREACHABLE }
        }
        if (check.error) {
          const msg = signInError(check.error)
          return { ok: false, error: msg === BAD_CREDENTIALS ? 'Your current password is not correct.' : msg }
        }
        if (check.data?.user?.id !== user.id) {
          return { ok: false, error: 'Your current password is not correct.' }
        }
        let res
        try {
          res = await supabase.auth.updateUser({ password: next })
        } catch {
          return { ok: false, error: UNREACHABLE }
        }
        if (res.error) return { ok: false, error: passwordError(res.error) }
        return { ok: true }
      } finally {
        busy.current = false
      }
    },
    [user],
  )

  const retry = useCallback(() => restore(), [restore])

  const value = useMemo(
    () => ({ user, initializing, authError, retry, signUp, signIn, signOut, changePassword }),
    [user, initializing, authError, retry, signUp, signIn, signOut, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
