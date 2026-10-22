// What a page shows while the saved login is being confirmed (a neutral blank, never private
// content) or when the server could not be reached (a friendly message with "Try again").
export default function AuthPending({ authError, retry }) {
  if (authError) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: '1rem', alignContent: 'center' }}>
        <p role="alert">{authError}</p>
        <button type="button" className="btn" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }
  return (
    <div aria-busy="true" style={{ minHeight: '100vh' }}>
      <p className="visually-hidden" role="status">
        Loading
      </p>
    </div>
  )
}
