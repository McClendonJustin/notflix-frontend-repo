import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useAuth } from '../auth/useAuth'
import { createDonation } from '../api/client'
import './Donate.css'

// Loaded once, at module level. The publishable key is public by design; no secret key lives here.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

const PRESETS = [5, 10, 25, 50]
const MAX_CENTS = 10000

const CARD_OPTIONS = {
  style: {
    base: {
      color: '#f2f4f0',
      fontFamily: 'Figtree, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#a3acb0' },
    },
    invalid: { color: '#ff8f86', iconColor: '#ff8f86' },
  },
}

// "12.5" -> 1250. Works on the digits of the text, so there is no floating-point rounding.
// Returns null unless the text is a positive amount of at most $100 with up to 2 decimals.
function toCents(text) {
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(text.trim())
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return cents >= 1 && cents <= MAX_CENTS ? cents : null
}

const formatMoney = (cents) => `$${(cents / 100).toFixed(2)}`

function DonateForm() {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [preset, setPreset] = useState(10)
  const [custom, setCustom] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [status, setStatus] = useState('form') // form | submitting | success | declined | error
  const [donated, setDonated] = useState(0)

  const usingCustom = preset === null
  const cents = usingCustom ? toCents(custom) : preset * 100
  const customInvalid = usingCustom && custom.trim() !== '' && cents === null
  const canSubmit = Boolean(stripe && elements && cents && cardComplete && (status === 'form' || status === 'declined'))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('submitting')
    try {
      const clientSecret = await createDonation(cents, user.id)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      })
      if (result.paymentIntent?.status === 'succeeded') {
        setDonated(cents)
        setStatus('success')
      } else if (result.error?.type === 'card_error') {
        setStatus('declined')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  function reset() {
    setStatus('form')
    setCardComplete(false)
  }

  if (status === 'success') {
    return (
      <div className="donate__result" role="status">
        <h2>Thank you!</h2>
        <p>Your {formatMoney(donated)} donation helps keep Notflix running.</p>
        <div className="donate__actions">
          <button type="button" className="btn" onClick={() => { setCustom(''); setPreset(10); reset() }}>
            Donate again
          </button>
          <Link to="/selection" className="btn btn--quiet">
            Back to selection
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="donate__result" role="alert">
        <h2>Something went wrong</h2>
        <p>Your card was not charged. Please try again.</p>
        <div className="donate__actions">
          <button type="button" className="btn" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const busy = status === 'submitting'

  return (
    <form className="donate__form" onSubmit={handleSubmit} noValidate>
      <fieldset className="donate__amounts" disabled={busy}>
        <legend>Choose an amount</legend>
        {PRESETS.map((dollars) => (
          <label key={dollars} className="donate__chip">
            <input
              type="radio"
              name="amount"
              checked={preset === dollars}
              onChange={() => setPreset(dollars)}
            />
            <span>${dollars}</span>
          </label>
        ))}
        <label className="donate__chip">
          <input type="radio" name="amount" checked={usingCustom} onChange={() => setPreset(null)} />
          <span>Other</span>
        </label>
      </fieldset>

      {usingCustom && (
        <div className="donate__custom">
          <label htmlFor="donate-custom">Amount in dollars (up to $100)</label>
          <input
            id="donate-custom"
            className="input"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 7.50"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-invalid={customInvalid}
            aria-describedby={customInvalid ? 'donate-custom-error' : undefined}
            disabled={busy}
            autoFocus
          />
          {customInvalid && (
            <p id="donate-custom-error" className="form__error" role="alert">
              Enter an amount from $0.01 to $100, with up to 2 decimals.
            </p>
          )}
        </div>
      )}

      <div className="donate__card">
        <span className="donate__label">Card details</span>
        <div className="donate__cardbox">
          <CardElement options={CARD_OPTIONS} onChange={(e) => setCardComplete(e.complete)} />
        </div>
      </div>

      {status === 'declined' && (
        <p className="form__error" role="alert">
          Your card was declined. Please try another card.
        </p>
      )}

      <button type="submit" className="btn" disabled={!canSubmit} aria-busy={busy}>
        {busy ? 'Processing...' : cents ? `Donate ${formatMoney(cents)}` : 'Donate'}
      </button>
      <p className="donate__note">Payments are handled by Stripe. Notflix never sees your card number.</p>
    </form>
  )
}

export default function Donate() {
  return (
    <div className="donate">
      <header className="donate__bar">
        <Link to="/selection" className="wordmark">
          Notflix
        </Link>
        <Link to="/selection" className="btn btn--quiet">
          Back to selection
        </Link>
      </header>

      <main className="donate__main">
        <h1>Buy us a coffee</h1>
        <p className="donate__lead">
          Notflix is a free prototype. A one-time donation helps cover the hosting. Thank you for watching.
        </p>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <DonateForm />
          </Elements>
        ) : (
          <p className="form__error" role="alert">
            Donations are not available right now.
          </p>
        )}
      </main>
    </div>
  )
}
