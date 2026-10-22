import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { hasSavedLogin } from '../auth/savedLogin'
import AuthPending from '../components/AuthPending'
import Footer from '../components/Footer'
import Modal from '../components/Modal'
import Poster from '../components/Poster'
import PosterSkeleton from '../components/PosterSkeleton'
import { useCatalog } from '../catalog/useCatalog'
import './Home.css'

// A page has 18 movies; the decorative wall repeats from the start to fill 24 tiles.
const WALL_TILES = 24
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function SignUpForm({ email, onSwitch }) {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (pending) return
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirm) return setError('The passwords do not match.')
    setPending(true)
    const result = await signUp(email, password)
    setPending(false)
    if (!result.ok) return setError(result.error)
    navigate('/selection')
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <input className="input" type="email" value={email} aria-label="Email" autoComplete="username" readOnly />
      <input
        className="input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        autoComplete="new-password"
        autoFocus
      />
      <input
        className="input"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm password"
        aria-label="Confirm password"
        autoComplete="new-password"
      />
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        Sign Up
      </button>
      <p className="form__switch">
        Already have an account? <button type="button" onClick={onSwitch}>Sign In</button>
      </p>
    </form>
  )
}

function SignInForm({ initialEmail, onSwitch }) {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    const result = await signIn(email, password)
    setPending(false)
    if (!result.ok) return setError(result.error)
    navigate('/selection')
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <input
        className="input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
        autoComplete="email"
        autoFocus={!initialEmail}
      />
      <input
        className="input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        autoComplete="current-password"
        autoFocus={!!initialEmail}
      />
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={pending}>
        Sign In
      </button>
      <p className="form__switch">
        New to Notflix? <button type="button" onClick={onSwitch}>Create an account</button>
      </p>
    </form>
  )
}

export default function Home() {
  const { user, initializing, authError, retry } = useAuth()
  const { status, movies } = useCatalog()
  const [email, setEmail] = useState('')
  const [modal, setModal] = useState(null) // null | 'signup' | 'signin'
  const [emailError, setEmailError] = useState('')

  if (user) return <Navigate to="/selection" replace />
  // A saved login may exist: wait for it to be confirmed instead of flashing the landing page.
  if ((initializing || authError) && hasSavedLogin()) {
    return <AuthPending authError={initializing ? '' : authError} retry={retry} />
  }

  function startSignUp(e) {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address to sign up.')
      return
    }
    setEmailError('')
    setModal('signup')
  }

  const close = () => setModal(null)

  return (
    <div className="home">
      <div className="home__wall" aria-hidden="true">
        {status === 'ready' && movies.length > 0
          ? Array.from({ length: WALL_TILES }, (_, i) => movies[i % movies.length]).map((m, i) => (
              <Poster key={`${m.id}-${i}`} item={m} />
            ))
          : Array.from({ length: WALL_TILES }, (_, i) => <PosterSkeleton key={i} />)}
      </div>

      <header className="home__bar">
        <span className="wordmark home__mark">Notflix</span>
        <button type="button" className="btn btn--quiet home__signin" onClick={() => setModal('signin')}>
          Sign In
        </button>
      </header>

      <main className="home__main">
        <form className="home__signup" onSubmit={startSignUp} noValidate>
          <h1 className="visually-hidden">Notflix, streaming without the price tag</h1>
          <div className="home__row">
            <input
              className="input home__email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email Address"
              aria-label="Email address"
              aria-invalid={emailError ? 'true' : undefined}
              aria-describedby={emailError ? 'email-error' : undefined}
              autoComplete="email"
            />
            <button type="submit" className="btn">
              Sign Up
            </button>
          </div>
          {emailError && (
            <p id="email-error" className="form__error home__error" role="alert">
              {emailError}
            </p>
          )}
        </form>
      </main>

      <Footer className="home__footer" />

      <Modal open={modal === 'signup'} onClose={close} title="Create your account">
        <SignUpForm email={email.trim()} onSwitch={() => setModal('signin')} />
      </Modal>
      <Modal open={modal === 'signin'} onClose={close} title="Sign in">
        <SignInForm initialEmail={email.trim()} onSwitch={() => setModal('signup')} />
      </Modal>
    </div>
  )
}
