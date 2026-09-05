# Roy Games

A mobile-first scorekeeper for family tournaments. Roy Games is the generic name on
purpose — the tournament/table/player scaffolding (`src/domain/`, outside the
per-game subfolders) is game-agnostic, which is what let a second game
(bowling) get added without touching the data model's shape or the Firestore rules.

Three games are supported today:

- **Bondis** (Bondebridge) — bid-and-trick card game scoring, group stage →
  winners table, configurable tie-break rules. Rules live in
  `src/domain/bondebridge/`.
- **Bowling** — much simpler: one raw score per player per round. The organizer
  picks how lanes reshuffle between rounds: **re-seed every round** (always
  exactly one round, then rank everyone globally and regroup lanes by
  rank — nobody's eliminated, the strongest players just increasingly end up on
  the same lane) or **group stage then final lane** (same shape as Bondis:
  fixed lanes, but no preset round count — each note taker plays as many rounds
  as they want and taps "Ferdig med denne banen" whenever they're done; once
  every lane in the stage is finished, top finishers advance into one final
  lane). Bowling-specific logic (just a score-range check) lives in
  `src/domain/bowling/`.
- **Boccia** — simplest of the three: up to 4 players *or* up to 4 teams of at
  most 2 (a team's name defaults to its members' names, e.g. "Martin og
  Cecilie", editable if the organizer wants something else), playing
  first-to-N-points (organizer sets N up front) all against each other
  directly — no groups, no lanes, no advancement, and no fixed round count: the
  table auto-completes the moment someone's total reaches the target. Each
  round the note taker records who was closest to the jack (+1, or +2 if that
  participant had *both* their balls closer than everyone else's) and, per
  participant, how many of their balls hit the jack directly (0–2 — a two-player
  team can each land one, a solo player can land both of their own — +1 each,
  stacking with the closest-ball point). A "team" is modelled as a synthetic
  participant id folded into the same `playerNames` map every other game uses,
  so standings/podium code needed no changes at all; team membership itself is
  recorded separately (`teamRosters` on the tournament) so history shows who
  was actually on each
  team. Scoring logic lives in `src/domain/boccia/`.

## Why frontend-only (no backend)

This app talks directly to Firebase from the browser. There is no Spring Boot / Node
/ Express service anywhere, and that's a deliberate choice, not a shortcut:

- **Realtime is the actual requirement.** Three note takers write to the same
  tournament simultaneously while everyone else watches the standings live on their
  own phone. That's a realtime sync problem, and Firestore's `onSnapshot` solves it
  directly from the browser, for free — no WebSocket server to write and run.
- **A free-tier backend would make the game worse to play.** A Spring Boot service
  on Render's free tier sleeps after ~15 minutes of inactivity and takes 30–60
  seconds to wake up. Mid-game — someone's about to record a round — that's not a
  performance nitpick, it's the app failing at the one moment it matters.
- **Offline resilience matters at the kitchen table.** Firestore's offline
  persistence (enabled in `src/data/firebase.ts`) means the app keeps working if a
  phone loses reception mid-round and syncs automatically once it's back.

**The trade-off, stated plainly:** all game logic (scoring, standings, tie-breaks,
advancement) runs on the client, and Firestore security rules (`firestore.rules`)
are the *only* enforcement layer — there's no server to double-check a client's
arithmetic. For a private family scorekeeper, where the worst case is "someone's
phone reports the wrong score and the family notices," this is an acceptable trade.
It would not be an acceptable trade for anything with real stakes attached.

Because there's no backend, there's also no monorepo-vs-split-repo question — this
is one repository, one deployable.

## Tech stack

Vite + React 18 + TypeScript (`strict: true`) + React Router + Tailwind CSS +
Firebase (Firestore + Anonymous Auth) + Vitest. No state management library — React
state plus Firestore subscriptions are sufficient at this scale.

## Project layout

```
src/
  domain/                  Pure game logic, zero Firebase imports, fully unit-tested
    bondebridge/            Bondebridge-specific rules: scoring, card/round math
    *.ts                     Game-agnostic: group sizing, standings, tie-breaks, advancement
  data/                    All Firestore/Auth access lives here
  hooks/                   React hooks wrapping data/ subscriptions
  components/              Reusable UI pieces
  pages/                   One file per route (see App.tsx for the route list)
firestore.rules           Security rules (see PRIVACY.md §10 for what they enforce)
tests/firestore-rules.test.ts   Emulator-backed tests for the rules above
PRIVACY.md                 GDPR / privacy review and the mitigations built from it
```

## Local setup

1. Install dependencies:

   ```
   npm install
   ```

2. Copy the environment template:

   ```
   cp .env.example .env.local
   ```

3. Fill in `.env.local` with your Firebase project's config (see the next section) —
   **or** skip that entirely and develop against the local Firebase emulators
   instead (recommended for local development, since it needs no real project and
   the seed data / rules behave identically). For the emulator path, use these
   placeholder values instead of real Firebase config:

   ```
   VITE_FIREBASE_API_KEY=demo-key
   VITE_FIREBASE_AUTH_DOMAIN=roy-games-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=roy-games-dev
   VITE_FIREBASE_STORAGE_BUCKET=roy-games-dev.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
   VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
   VITE_USE_FIREBASE_EMULATORS=true
   ```

4. If using the emulators, start them in one terminal (needs the
   [Firebase CLI](https://firebase.google.com/docs/cli) — `npm install -g
   firebase-tools` if you don't have it):

   ```
   npm run emulators
   ```

   This starts Firestore on `localhost:8080`, Auth on `localhost:9099`, and an
   inspection UI at `localhost:4000` — open that in a browser to see the data your
   dev session writes.

5. In another terminal, start the dev server:

   ```
   npm run dev
   ```

   Open the printed `localhost` URL. The player name bank seeds itself
   automatically the first time you open the "Spillere" tab against an empty
   database.

## Firebase project setup (for a real deployment)

You only need this for an actual family deployment — local development can run
entirely against the emulators (previous section) with no real Firebase project at
all.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   sign in with a Google account.
2. Click **Add project**. Give it a name (e.g. "roy-games"). You can disable Google
   Analytics for this project when asked — it isn't used.
3. Once the project is created, in the left sidebar click **Build → Firestore
   Database**.
4. Click **Create database**.
   - **Location**: this is the important one and **cannot be changed later**.
     Choose **`eur3 (europe-west)`** from the dropdown (see `PRIVACY.md` §8 for
     why). Do not accept a US default.
   - Choose **Start in production mode** (the app ships its own `firestore.rules`,
     so you don't need test mode).
   - Click **Create**.
5. Deploy the security rules from this repo: with the Firebase CLI installed and
   logged in (`firebase login`), run from the project root:
   ```
   firebase use --add
   ```
   and select the Firebase project you just created when prompted (this writes/
   updates `.firebaserc` — replace the placeholder `roy-games-dev` project id there
   with your real one). Then:
   ```
   firebase deploy --only firestore:rules
   ```
6. In the left sidebar, click **Build → Authentication**.
7. Click **Get started**. Under the **Sign-in method** tab, click **Anonymous** in
   the provider list, toggle it **Enable**, and click **Save**.
8. Register a web app so you get a config object: in the project overview page
   (click the gear icon → **Project settings** if you're not there already), scroll
   to **Your apps**, click the **</>** (web) icon.
   - Give the app a nickname (e.g. "roy-games-web"). You don't need Firebase
     Hosting — this app deploys to Vercel instead.
   - Click **Register app**. Firebase shows you a `firebaseConfig` object — you
     need the values from it in the next step.
9. Copy `.env.example` to `.env.local` (or set the same variables in Vercel, see
   below) and fill in each `VITE_FIREBASE_*` value from the config object you just
   saw:

   | `.env` variable | comes from `firebaseConfig` field |
   |---|---|
   | `VITE_FIREBASE_API_KEY` | `apiKey` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |

   Leave `VITE_USE_FIREBASE_EMULATORS=false` for a real deployment.

## Admin access

Everyone else in the family uses anonymous auth — no sign-up, no password. But
deleting a tournament's history is restricted to a single admin account, enforced
in `firestore.rules` (not just hidden in the UI), so it needs a real, permanent
login. Setup is a one-time, manual process — there's no self-registration flow on
purpose, so nobody can grant themselves admin access.

1. In the Firebase Console, go to **Build → Authentication → Sign-in method** and
   enable the **Email/Password** provider (in addition to Anonymous, which should
   already be on from the setup above).
2. Go to the **Users** tab and click **Add user**. Enter your own email and a
   password. Click **Add user**.
3. Click into the user you just created and copy its **User UID** (a long string
   like `a1B2c3D4...`).
4. Open `firestore.rules` in this repo and replace `'REPLACE_WITH_ADMIN_UID'`
   inside the `isAdmin()` function with that UID (keep the quotes). Deploy it:
   ```
   firebase deploy --only firestore:rules
   ```
5. Add the same UID as `VITE_ADMIN_UID` in your `.env.local` (for local dev) and
   in Vercel's environment variables (for the deployed site) — see `.env.example`.
6. Open the app and go to `/admin` (linked in small text at the bottom of the
   Personvern page) and log in with the email/password from step 2. That device
   is now recognized as admin — delete buttons ("Slett turnering" on a
   tournament's page, and a trash icon on each entry in Historikk) appear
   wherever they didn't before, regardless of who actually organized that
   tournament. Everyone else still can't delete anything.

For local development against the emulators, skip the real Firebase Console steps
and instead add the user directly in the Auth emulator's UI (`localhost:4000` while
`npm run emulators` is running) — same idea, no real project needed.

## Environment variables

See `.env.example` for the full list. All are `VITE_`-prefixed (required by Vite to
expose them to client code) and none are secret in the traditional sense — a
Firebase web API key is meant to be public; it identifies the project, and access
control is enforced by `firestore.rules`, not by hiding this key.

## Running tests

```
npm test              # domain layer unit tests (fast, no emulator needed)
npm run test:watch    # same, in watch mode
npm run test:rules    # firestore.rules tests — starts the emulator automatically
npm run test:all      # both of the above, one after another
```

The domain suite covers every worked example from the spec: the 7-row Bondebridge
scoring table, `maxCards` for 5/6/7-player tables, all four round-sequence modes,
16 players → 3 groups of 6/5/5, all three tie-break rules (including the case where
`HIGHEST_SUCCESSFUL_BID` leaves two players still tied), and the "16 players → 6
winners + 5/5 remaining, not 6/5" advancement arithmetic.

## Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
3. Click **Add New… → Project**, and import the repository you just pushed.
4. Vercel auto-detects Vite — leave the build settings as detected (**Build
   Command**: `npm run build` / `vite build`, **Output Directory**: `dist`).
5. Before deploying, expand **Environment Variables** and add every variable from
   `.env.example` with your real Firebase project's values (same table as the
   Firebase setup section above). Set `VITE_USE_FIREBASE_EMULATORS` to `false`.
6. Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL — that's the
   link your family uses.
7. Any time you push to your main branch afterwards, Vercel redeploys
   automatically.

`vercel.json` in this repo rewrites every path to `index.html`, which React
Router then handles client-side. Without it, opening a link directly (e.g.
`/personvern`, or refreshing on any non-home page) would 404 — Vercel would try
to find a matching file/route on its own server instead of letting the
single-page app's router take over.

## Deviations from a literal reading of the spec

A few implementation choices that aren't spelled out verbatim in the original brief
— noted here rather than left implicit:

- **No accounts, so no server-side "my tournaments" list.** Home/History show
  tournaments *this device* has visited, tracked in `localStorage`
  (`src/data/localHistory.ts`). It's a convenience shortcut, not an access
  boundary — anyone with a join code can always open a tournament regardless of
  this list.
- **Player deletion is a real delete**, safe because every tournament snapshots
  `playerNames` at creation time — see `PRIVACY.md` §6 for the full reasoning.
- **Manual tie-break choices aren't a separately persisted entity.** They're
  resolved inline at the moment of advancement and baked directly into the next
  stage's table assignments — there's nothing else to look up later.
- **Running totals are never stored**, only ever computed by summing a table's
  `rounds` subcollection. Editing a past round "recomputing subsequent totals" is
  true by construction, not a special code path.
- **`cardsPerRound` is resolved and frozen onto each table at creation time**, so
  the round sequence can't drift mid-tournament.
- **Every bowling reshuffle is a clean slate.** Both reshuffle modes create a new
  stage and score it from zero — a player's total from a previous round/stage
  never carries into the next one. Reshuffling ranks players by whichever
  round/stage just finished, then that ranking (not cumulative points) decides
  who ends up on the top lane vs. the bottom lane next. This matches
  Bondebridge, which also always resets at each new stage.
- **Deleting a tournament is admin-only, not organizer-self-service.** Whoever
  creates a tournament can still configure and run it, but can no longer delete
  it themselves — only the one admin account can. This is enforced in
  `firestore.rules`, not just hidden in the UI. See "Admin access" above.

## Known limitations (by design, for this scale)

- Read access to a tournament is gated only by knowledge of its join code — see
  `PRIVACY.md` §7 for why that's an accepted trade-off here, and what a stricter
  option would look like if it's ever needed.
- All game logic runs client-side; Firestore rules stop *unauthorized writers*, not
  a well-meaning note taker's typo. That's fine for a family scorekeeper (see "Why
  frontend-only" above).
- Cross-tournament statistics and an all-time leaderboard are explicitly out of
  scope for this round — the data model supports them (every round is stored with
  full bid/trick/score detail, forever), but no UI is built for it yet.
