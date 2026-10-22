Opens the App
Arrives at the Sign-In/Sign-Up landing page
    'Create a New Account' Page
    'Sign-In' Page
Arrives at the 'Make A Selection' page
When click on an option, a detail page will either pop-up or open where they can read about their selection
When they click Watch, a 'Cinema' page will open where their selection will stream

On the 'Make A Selection' page they can see any items they have favorited, as well as their watch history.

User Journey - Notflix (Netflix Clone)
—
What it is: A streaming platform for watching all of your favorite TV Shows and Movies

Problem: Netflix is expensive, Notflix is… NOT. We are building a service that is affordable and meets the needs of budget conscious consumers of video entertainment.

User: One type (for now) - A busy human sits down at the end of the day to relax and get lost in the cinema experience.

The journey
—
1. Opens the app, lands on Home (/). Sees a sign-in button and a field to enter your email with a sign-up button.
    • First visit, no account, must sign-up first.
2. Enters email address and clicks Sign-Up.
    • Modal pops up with Email pre-filled, and an empty field to enter a password.
3. Arrives at the 'Make a Selection' screen, sees a screen full of options, a hamburger icon in the top-left where they can view search area, history, favorites, or choose a genre.
4. Chooses a genre, types in a title name into the search, sees a filtered list of options to choose from.
5. Clicks on an option, sees a modal pop-up with details, (title, description, runtime)
6. Clicks 'Play' button
    • Selection opens in cinema mode and begins.

Data rules
—
(At this time) No backend, no API. ALl data lives in React state in the Browser. Refreshing the page resets everything - This is expected.
Seed the app with 48 sample shows/movies, categorize them by Genre so that functionality can be tested.