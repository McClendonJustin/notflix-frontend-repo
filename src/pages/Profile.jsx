import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Modal from '../components/Modal'
import './Profile.css'

function PasswordForm({ onDone }) {
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (next.length < 8) return setError('Use at least 8 characters for your new password.')
    if (next !== confirm) return setError('The new passwords do not match.')
    if (next === current) return setError('Choose a password you have not used before.')
    const result = await changePassword(current, next)
    if (!result.ok) return setError(result.error)
    onDone()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <input
        className="input"
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Current password"
        aria-label="Current password"
        autoComplete="current-password"
        autoFocus
      />
      <input
        className="input"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="New password"
        aria-label="New password"
        autoComplete="new-password"
      />
      <input
        className="input"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        aria-label="Confirm new password"
        autoComplete="new-password"
      />
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn">
        Update password
      </button>
    </form>
  )
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function handleSignOut() {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="profile">
      <header className="profile__bar">
        <Link to="/selection" className="wordmark">
          Notflix
        </Link>
        <Link to="/selection" className="btn btn--quiet">
          Back to selection
        </Link>
      </header>

      <main className="profile__main">
        <div className="profile__identity">
          <span className="profile__avatar" aria-hidden="true">
            {user.name.charAt(0)}
          </span>
          <div>
            <h1>{user.name}</h1>
            <p className="profile__email">{user.email}</p>
          </div>
        </div>

        {notice && (
          <p className="profile__notice" role="status">
            {notice}
          </p>
        )}

        <div className="profile__actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setNotice('')
              setModalOpen(true)
            }}
          >
            Change password
          </button>
          <button type="button" className="btn btn--quiet" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </main>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Change password">
        <PasswordForm
          onDone={() => {
            setModalOpen(false)
            setNotice('Your password has been updated.')
          }}
        />
      </Modal>
    </div>
  )
}
