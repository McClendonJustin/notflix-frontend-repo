import BackLink from '../components/BackLink'

export default function NotFound() {
  return (
    <main className="page-error">
      <h1>We can't find that page</h1>
      <p>The address may be mistyped, or the page has moved.</p>
      <BackLink />
    </main>
  )
}
