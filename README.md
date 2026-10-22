# Notflix

A streaming-site prototype: sign up or sign in, browse a live catalog of movies streaming on Netflix (US), read about one, and "play" it in a placeholder cinema. Built with React 19, Vite and React Router (`react-router-dom` v7, `BrowserRouter`).

**Data comes from the Notflix API** (public Supabase Edge Functions, see `../supabase/docs/api-contract.md`). The catalog is **live from TMDB**, fetched by the Edge Functions on every request; the browser never calls TMDB and holds no TMDB token. Each user's favorites and history **persist in the database** (only TMDB movie ids are stored). **Accounts are real**: sign-up, sign-in, sign-out and change-password use Supabase Auth (`@supabase/supabase-js`), and the saved login survives a refresh and closing the browser. The signed-in endpoints (`library`, `favorites`, `history`) take the user's access token, and row-level security in the database lets each user see only their own rows.

## Configuration

Copy `.env.example` to `.env` and set two variables: `VITE_SUPABASE_URL` (the Supabase project URL) and `VITE_SUPABASE_ANON_KEY` (the project's publishable key, which is public by design; never use the service-role key here). The API client calls `${VITE_SUPABASE_URL}/functions/v1/...`, and supabase-js uses the same two values for sign-up, sign-in and the session. Do not commit `.env`.

## Run it

```bash
npm install
npm run dev       # dev server (Vite prints the local URL)
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run lint      # ESLint
```

## Donations (Stripe)

`/donate` (`src/pages/Donate.jsx`) takes a one-time donation. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env` (a `pk_test_...` or `pk_live_...` key, public by design; never put a Stripe secret key in the front-end). The flow: `createDonation(cents, user.id)` in `src/api/client.js` POSTs `{ amount, user_id }` to the `process-donation` Edge Function with the access token and gets a `client_secret`; then `stripe.confirmCardPayment` confirms the card entered in Stripe's `CardElement` (loaded once with `loadStripe` at module level). Amounts are converted to integer cents from the digits of the text (1 to 10000). Outcomes: a thank-you with the amount and "Donate again"; "Your card was declined. Please try another card." for card errors; "Something went wrong" with Try again for anything else. Raw Stripe or server messages are never shown. The floating coffee-mug link (bottom right, `/selection` only, `.mug` in `Selection.css`) goes to `/donate`; its icon `public/coffee-mug.svg` is hand-drawn for this project (transparent background, no third-party license).

## Accounts

There is no demo account: create your own from the Home page (an email, then a password of at least 8 characters entered twice). Emails are matched case-insensitively; passwords are case-sensitive. Email confirmation is off in the Supabase project, so sign-up logs you straight in. Your display name defaults to the part of your email before the @.

How the login works (`src/auth/AuthProvider.jsx`):
- **Sign up / sign in** call `supabase.auth.signUp` / `signInWithPassword`. The profile name comes from the `users` table (created by a database trigger). Failures show short friendly messages, never raw server text.
- **Saved login:** supabase-js keeps the session in the browser's localStorage (keys start with `sb-`). On every load the app reads it, confirms it with the server (`getUser()`), then loads the profile and the library. While that check runs, guarded pages show a blank loading page (no redirect, no private content). A login the server rejects (expired, revoked, deleted account) is cleared and you land on `/`; if the server cannot be reached the login is kept and the page offers Try again. A signed-in visitor on `/` is sent straight to `/selection`.
- **Sign out** (Profile page only) ends the session, removes the saved `sb-*` entries and clears the library from state, even if the sign-out request fails.
- **Change password** (Profile) first re-checks the current password with a sign-in, then calls `updateUser({ password })`.

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | **Home**: poster wall, email field + Sign Up, Sign In button; sign-up and sign-in modals | Public (signed-in users are sent to `/selection`) |
| `/selection` | **Selection**: grid of movies with Load more, left drawer, detail modal | Signed in |
| `/cinema/:id` | **Cinema**: placeholder player with Pause/Play; loads the movie by id; "We can't find that title" for an unknown or malformed id | Signed in |
| `/donate` | **Donate**: one-time Stripe donation ($5/$10/$25/$50 or a custom amount up to $100, card form from Stripe Elements) | Signed in |
| `/profile` | **Profile**: name and email, change-password modal, sign out (the only sign-out control) | Signed in |
| `*` | **Not found** | Public |

Signed-out visits to guarded routes redirect to `/`.

### Selection page

- **Hamburger menu** opens a left drawer with:
  - **Search** by title. It filters only the movies already loaded (not all of TMDB); Enter closes the drawer.
  - **History**: your last 10 played movies, newest first (a replay moves it to the top; no duplicates).
  - **Favorites**: movies you hearted, newest first.
  - **Genres**: TMDB's 19 genres, or All genres. Choosing one asks TMDB for that genre (it is not filtered in the browser) and the heading shows the genre name.
  - History, Favorites and Genres expand one at a time. Clicking a history or favorite movie opens its detail modal, even if it is not in the current grid page.
- **Load more** under the grid appends the next 18 movies (duplicates are dropped); every page is 18 movies, so three rows of six fill neatly. It is hidden on the last page; while loading it shows skeleton tiles; if it fails it shows "We can't load more titles right now." with Try again and keeps the movies already shown.
- **Detail modal**: title, a widescreen scene image, **Play**, a favorite (heart) toggle, genre names, year, runtime and description. The runtime (and the genre names) arrive from `GET /movie` a moment after the modal opens; if that fails the runtime is simply omitted and Play and the heart still work. Play records the movie in History and opens `/cinema/:id`.
- Favorites and history are saved **per user in the database** (the user is identified by the access token the API receives), so they survive a refresh and a new sign-in.

### Cinema page

There is no real video yet. The movie is fetched by id from `GET /movie` (a loading skeleton, then the stage; an unknown or malformed id shows "We can't find that title"; any other failure shows an error with Try again). The stage shows "Your selection is playing" (or "Paused") over the title's art, with a Pause/Play button. The stage in `src/pages/Cinema.jsx` is where the video element goes later.

## Project structure

```
src/
  main.jsx            entry: StrictMode > BrowserRouter > AuthProvider > CatalogProvider > LibraryProvider > App
  App.jsx             route table; RequireAuth wraps the guarded routes
  index.css           design tokens and shared classes (.btn, .input, .wordmark, ...)
  auth/               AuthProvider (Supabase Auth: signUp, signIn, signOut, changePassword, saved-login recovery), useAuth, savedLogin (is there a stored login?)
  api/supabase.js    the shared supabase-js client (URL and publishable key from .env)
  api/client.js      fetch client for the Edge Functions (getGenres, getMovies, getMovie, getLibrary, setFavorite, recordPlay, createDonation); signed-in calls send the access token; failures become friendly Errors, a 404 is flagged `notFound`
  catalog/            CatalogProvider (genres + first page of movies in parallel on every load; selected genre, page, Load more, stale-response guard, de-duplication), useCatalog
  library/            LibraryProvider (favorites + history as movie summaries, optimistic updates), useLibrary
  components/         Modal, NavDrawer, DetailModal, Poster, PosterSkeleton, PosterShape, posterArt (palettes by TMDB genre id), Footer, BackLink, RequireAuth, AuthPending
  pages/              Home, Selection, Cinema, Donate, Profile, NotFound (each with its own .css)
```

Data flow:
- On every page load `CatalogProvider` fetches `GET /genres` and `GET /movies?page=1` in parallel. `setGenre(id)` re-queries `GET /movies?genre=<id>` and resets the list; `loadMore()` fetches the next page. Responses for an older genre are ignored.
- Sign-up and sign-in go straight to Supabase Auth from the browser (passwords never touch the Edge Functions). The API client reads the current access token at call time and sends it as `Authorization: Bearer <token>` on `library`, `favorites` and `history`; no user id is ever sent.
- When the signed-in user changes, `LibraryProvider` loads `GET /library` (movie summaries). The heart uses `POST /favorites`, Play uses `POST /history` (the movie id is sent as a string). Changes show at once and are reconciled with the server's id list (an unknown id triggers a refetch of the library); if a request fails the change is undone. Signing out clears the library from state (the data stays in the database). History keeps the last 10, newest first.

Loading and error states:
- Neutral 2:3 skeleton tiles while the catalog loads (Home wall, Selection grid, Load more), skeleton rows in the drawer, a small skeleton for the runtime in the detail modal, and a skeleton stage on Cinema. Animation is a very slow pulse and is off under `prefers-reduced-motion`.
- If the first page fails: Selection shows "We can't load titles right now." with Try again (which reloads genres and movies); Home keeps skeleton tiles. If genres fail the drawer says so. If the library fails the drawer lists show an error line with Try again.
- A failed favorite update is reverted and shows a small `role="status"` message in the detail modal. A failed history save is reverted quietly and never blocks playback. Error messages never show raw server text.

Notes:
- **Images** come from TMDB's image CDN (`image.tmdb.org`). Each movie from the API has `thumbnailUrl` (poster, 342px wide) and `previewUrl` (widescreen scene, 780px wide). No image files are stored in the repo.
- If an image is missing or fails to load, `Poster` falls back to generated art: one color palette per TMDB genre id (the movie's first genre; neutral default) in `posterArt.js` and one of four shapes picked from the movie id (`PosterShape.jsx`), labeled with the title.
- The app does not read `seed.json`; `app_outline/pages/selection/seed.json` stays only as a historical record.
- `Footer` shows TMDB's required attribution (logo and notice) and a JustWatch line on Home and Selection. See **TMDB compliance** below.
- Modals use the native `<dialog>` element (focus trap, Esc to close).
- `LibraryProvider` must stay inside `AuthProvider` because it reads the signed-in user.

## Design

Dark theme: near-black background, off-white text, light-green accent (`#b7e8bf`), Figtree typeface (loaded from Google Fonts). Mobile-first (designed at 390px), with the Cinema page also fitting an 844px landscape phone. Motion is kept short and subtle, and respects `prefers-reduced-motion`. The design inputs (user journey, wireframes, user stories, style guide) are in `app_outline/`.

The Selection grid is six posters across from 640px up and three on phones, centered in a column no wider than 1440px, with posters at TMDB's natural 2:3 shape (never cropped). A page is 18 movies (`src/catalog/pageSize.js`, which must match `PAGE_SIZE` in the `movies` Edge Function), so a full page is always three rows of six, or six rows of three on a phone, with no blank cells.

## TMDB compliance

Movie data and images come live from [TMDB](https://www.themoviedb.org) through the Edge Functions. This app follows TMDB's [API Terms of Use](https://www.themoviedb.org/api-terms-of-use):

- **Attribution (section 3):** `src/components/Footer.jsx` shows the TMDB logo (`public/tmdb-logo.svg`, unmodified) at 16px tall, kept smaller than the Notflix wordmark, plus TMDB's notice in its exact wording: "This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB." Keep both if the footer is ever restyled.
- **JustWatch:** the catalog is filtered by streaming availability, which TMDB supplies from JustWatch, so the footer also says "Streaming availability data provided by JustWatch." with a link to justwatch.com (text only, no JustWatch logo).
- **Non-commercial only:** TMDB's free API access does not permit commercial use. Notflix is a class prototype. A paid service would need a written commercial agreement with TMDB (and licensing for the JustWatch data) first.
- **Nothing from TMDB is stored by us:** the database holds only movie ids (in favorites and history). Movie data is fetched live and not cached by the front-end beyond the current page view.
- **No modified TMDB content:** posters display uncropped at their native 2:3 ratio, and scene images at their native 16:9. TMDB's logo is used as supplied.
- **Token:** the TMDB token lives only as a Supabase secret used by the Edge Functions. The browser never calls `api.themoviedb.org` and never holds a token.

## Known limits

- Closing or reloading the page within about a second of pressing Play can lose that history save (it is sent in the background so it never delays playback).
- Changing the login email is not blocked by the database; the app has no UI for it. See `../supabase/docs/security.md`.
- There is no "return to the page you wanted" after signing in.
- No payment information is collected; the 8-question template mentions it, but no page covers it.
- The catalog depends on TMDB being reachable; there is no offline fallback. Its order (popularity) changes over time.
- Search only covers movies already loaded, not all of TMDB.
- Everything is a movie (the catalog has no TV shows). TMDB only serves its first 500 pages (10,000 movies), which caps the catalog at 556 pages of 18.
- The decorative Home wall repeats the 18 movies of page 1 to fill 24 tiles.
