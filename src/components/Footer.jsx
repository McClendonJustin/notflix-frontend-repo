import './Footer.css'

// Attribution required by TMDB's API Terms of Use (section 3): the TMDB logo, kept less
// prominent than our own wordmark, plus TMDB's notice in its exact wording. The JustWatch line is
// the attribution TMDB asks for when watch-provider (streaming availability) data is used.
// https://www.themoviedb.org/api-terms-of-use
export default function Footer({ className = '' }) {
  return (
    <footer className={`footer ${className}`}>
      <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="footer__logo">
        <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" height="16" />
      </a>
      <p>This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.</p>
      <p className="footer__credit">
        Streaming availability data provided by{' '}
        <a href="https://www.justwatch.com" target="_blank" rel="noreferrer">
          JustWatch
        </a>
        .
      </p>
    </footer>
  )
}
