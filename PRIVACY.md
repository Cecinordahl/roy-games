# Privacy & GDPR review

This is not legal advice. It's an honest assessment of where Roy Games sits under
GDPR/Norwegian law, and the concrete mitigations built into the app as a result.
Written for a private family project, not a commercial product.

## 1. Does the app process personal data?

Yes. It stores real first names of identifiable people, linked over time to a
permanent record of their behaviour (bids, tricks, scores, who played with whom,
who won). Under GDPR Art. 4(1), "personal data" is any information relating to an
identified or identifiable natural person — a first name tied to a specific family's
game night, repeated across years of history, is identifiable *within that family's
context* even without a surname. The fact that the same ~16 first names recur across
many tournaments makes re-identification easier over time, not harder, since patterns
of who plays with whom accumulate. This strengthens rather than weakens the
identifiability argument.

**Conclusion: yes, this is personal data processing.**

## 2. Does the household exemption apply? (GDPR Art. 2(2)(c))

The "purely personal or household activity" exemption is the obvious first thing to
reach for — this is a family scorekeeping app, not a product. But the exemption is
about the *nature of the activity*, not who built the tool, and courts (notably the
CJEU's *Lindqvist* and *Ryneš* cases) have read it narrowly once data is exposed
beyond the household itself.

Two things push against a clean exemption here:

- **A publicly reachable Vercel deployment** is, by construction, reachable by
  anyone on the internet who has (or guesses) the URL — the household's use of it is
  private, but the deployment surface is not.
- **Open join-by-code access** means anyone with a 6-character code — not just
  household members — can read live tournament data. If a code leaked or was
  guessed, a stranger could watch (though not edit) a family's game.

Given that, the honest position is: **the activity itself (a family keeping its own
game scores) is squarely household use, but the deployment doesn't get a free pass
just by being described that way.** The mitigations below are what keep this on the
right side of the line in practice, not the label alone:

- No public marketing, listing, or search-engine indexing of the app or any
  tournament (see `robots.txt`/no-index recommendation in the README).
  Concretely: don't submit the Vercel URL anywhere public, and treat the URL itself
  as something only shared with family.
- Join codes are only ever shared directly (verbally, in a family chat) — never
  posted anywhere public.
- The data collected is minimal and game-specific (see §4) — there's no profiling,
  no cross-referencing with other data sources, nothing that turns this into
  something other than "who won last Christmas's Bondebridge tournament."

If the family ever wants to open this up beyond the household (e.g. a wider circle
of friends, or genuinely public use), the exemption argument gets materially
weaker and a real legal basis (§3) plus a proper privacy notice become load-bearing,
not just good practice.

## 3. Legal basis, if the exemption doesn't (fully) apply

**Consent** (Art. 6(1)(a)) is the realistic basis for a family app: each player (or
their parent/guardian, see §8) agrees to their name and game results being recorded
for the tournament history. In practice, for a family game night, this is
reasonably satisfied by:

- Everyone present knowing the app is used for this purpose (it's not hidden —
  it's the shared scoreboard everyone is looking at during play).
- The in-app privacy notice (§4) being available to anyone who wants to read it,
  linked from the home screen.
- A working deletion path (§6) so consent can be withdrawn in practice, not just in
  theory.

This is a lightweight, practical basis appropriate to the stakes involved (a card
game's score history), not a substitute for a real consent flow if the app's scope
ever grows.

## 4. Privacy notice

A short, plain-Norwegian notice is wired into the UI at `/personvern`
(`src/pages/PersonvernPage.tsx`), linked from a dismissible banner on the home
screen the first time the app is opened on a device. It says, in short: what's
stored (names + game results, nothing else), who can see it (anyone with the join
code), and how to ask for something to be deleted. No wall of boilerplate — four
short paragraphs.

## 5. Data minimisation

Confirmed: the only data stored is player names and game results (bids, tricks,
scores, table/group assignments, tournament names, join codes). Specifically absent,
by design:

- No analytics, telemetry, or error-reporting SDKs of any kind.
- No IP address logging beyond whatever Firebase/Vercel retain at the
  infrastructure level for abuse prevention (outside this app's control, not used by
  the app itself).
- No player photos or avatars (explicitly out of scope, see the main spec).
- No device/browser fingerprinting beyond the anonymous Firebase Auth UID, which
  exists solely to gate write access (§7) and is not linked to any profile.

## 6. Deletion

Two deletion paths are implemented, both reachable from the UI:

- **Delete a player from the name bank** — `deletePlayer()` in
  `src/data/playersRepo.ts`, exposed via a "Slett" button on the Players page. This
  is a real delete, not a soft-disable flag.
- **Delete a tournament and all its history** — `deleteTournament()` in
  `src/data/tournamentsRepo.ts`, which walks and deletes every stage, table, and
  round beneath it.

**What happens to a deleted player's name inside past tournaments?** Nothing —
by design. Every tournament document snapshots `playerNames: { [playerId]: name }`
at creation time (see the data model in the main spec / README). Historical
tournaments read that snapshot, never the live `players` collection, so deleting
someone from today's name bank does not corrupt or blank out any past tournament's
record of who played. This was a deliberate modelling choice specifically to make
deletion safe: removing a name from the shared bank going forward doesn't force a
choice between "keep a dead player record forever" and "silently rewrite history."

If a family member wants their name scrubbed from *past* tournaments too (a stronger
ask than just "stop using my name in new ones"), that requires editing or deleting
those specific tournament documents — there is no bulk "erase this name everywhere"
tool in the MVP, since it would mean rewriting historical records the family may
want to keep intact for everyone else who played that day. This trade-off (individual
erasure vs. shared historical record) should be a conversation the family has
explicitly if it ever comes up, not something the software silently decides.

## 7. Access control

The join code is the **only** barrier to reading a tournament's live data — anyone
who has it (or successfully guesses one of the ~30^6 ≈ 700 billion combinations,
which is not realistically guessable, but *is* trivially shareable by whoever holds
it) can watch every table. This is security through obscurity, and it is a conscious
trade-off for this MVP: building real per-user access control would mean real
accounts, which the spec explicitly rules out for a family scorekeeper.

**Is this sufficient here?** For the stated use case — a private family tournament,
codes shared verbally or in a private family chat, never posted publicly — yes. The
blast radius of a leaked code is read-only visibility into one evening's card game
scores, not financial or sensitive-category data.

**A stricter option worth offering, if the family wants it later:** a per-tournament
"lock" the organizer can flip once the tournament is complete, which would stop
`findTournamentByJoinCode` from resolving old codes at all (effectively expiring
them once the history is safely archived). Not built in this MVP — it adds a
control surface for a benefit (reducing exposure of *already-played* game results)
that's marginal next to the core risk already accepted above — but noted here as
the natural next step if the household exemption argument (§2) ever needs
strengthening.

## 8. Firestore data location

**Recommendation: `eur3` (Europe West, Belgium) multi-region, or `europe-west1`
single-region if multi-region isn't needed.**

Why: keeping the data at rest in the EU avoids the app itself creating a
cross-border transfer question, since GDPR compliance is materially simpler when
storage location matches the family's own jurisdiction. There's no latency reason
to pick otherwise for a Norwegian family.

**Exact console setting:** when creating the Firestore database (Firebase Console →
Build → Firestore Database → Create database), the **Location** dropdown must be
set before the first database is created — it cannot be changed afterwards without
recreating the project's database. Select **`eur3 (europe-west)`** (multi-region) or
**`europe-west1 (Belgium)`** (single-region, cheaper, still fully in-EU). Do not
accept the default if it suggests a US region.

## 9. Children's data

The seed name bank (Marianne, Cecilie, Maxime, Hanna, Herman, Anne-Ki, Kissa, Lotte,
Martin, Tobias, Rolf-Erik, Randi, Trine-Lise, Tommie, Ingeborg, Sigurd) plausibly
includes minors, and any real family's roster likely will too.

**Does this change the analysis?** Under Norwegian implementation of GDPR, the age
of consent for information-society services is 13 (Norway opted for the lower end
of the 13–16 range GDPR allows). Below that age, a holder of parental responsibility
must consent on the child's behalf.

**What follows:**

- For any player under 13, the *parent/organizer* is the one giving consent (§3) on
  the child's behalf — in practice, this is already how it works, since a parent is
  typically the one adding the child's name to the bank and running the tournament.
- No additional technical mitigation is added for this MVP beyond what's already
  in place (minimal data, no profiling, easy deletion) — those protections apply
  equally regardless of age, and are arguably *more* important for a minor's data,
  which is exactly why data minimisation (§5) and working deletion (§6) aren't
  optional niceties here.
- If the app's scope ever grows beyond one family's private use, this is the first
  place to revisit — a wider user base changes who's realistically able to give
  meaningful consent on a child's behalf.

## 10. Firestore security rules

Delivered in `firestore.rules`, enforcing (not just documenting) the access model:

- A tournament's `organizerUid` is fixed at creation (whoever creates it) and only
  that device can reconfigure the tournament or add/edit stages.
- A table's `noteTakerUid` is the only device that can write that table's rounds.
- Anyone signed in (anonymously) can take over note-taking for a table by changing
  `noteTakerUid` alone — a deliberate soft lock (see main README), not a security
  hole: it only ever grants *write* access to game data, never read access beyond
  what the join code already exposes.
- Reads require anonymous auth (`request.auth != null`) but are otherwise open —
  the join code, not Firestore rules, is what gates who finds a given tournament
  (see §7).

These rules are tested against the Firestore emulator in
`tests/firestore-rules.test.ts` (run via `npm run test:rules`), covering: organizer-
only tournament/stage writes, note-taker-only round writes, the take-over flow
(including that it can't be used to sneak in other field changes), and that an
unauthenticated request is rejected outright. They are not permissive placeholders —
every rule has a test asserting both the allowed and the rejected case.
