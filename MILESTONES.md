# MILESTONES — Ten4 Text

Each milestone closes with evidence (a passing test, a working build, or an
explicit manual verification note from Justin) — not just a claim that it's
done. Status values: `planned`, `in-progress`, `verified`, `shipped`.
Only Justin sets `verified` or `shipped`.

---

### M1 — Concept agreed: emergency radio directory
**Status:** verified
**Goal:** Define the base concept — an app/website linking users to fire/police/EMS radio feeds by city.
**Evidence:** Concept and constraints confirmed in conversation; captured in `spec.md` §1–2.

### M2 — Demo scope approved
**Status:** verified
**Goal:** A demo with a real OpenMHz-based feed picker and real audio playback, editable 10-code dictionary.
**Evidence:** Explicitly approved.

### M3 — Decision: skip mock captions, build real pipeline directly
**Status:** verified
**Goal:** Avoid building captions twice.
**Evidence:** Explicit decision recorded.

### M4 — Native mobile scope adopted (iOS/Android)
**Status:** verified
**Goal:** Expand project mission to include a native mobile version.
**Evidence:** Scope expansion confirmed.

### M5 — Ten4 Text (native track) spec resolved
**Status:** verified
**Goal:** Reconcile the React Native/Expo + Node spec with the no-Broadcastify constraint.
**Evidence:** OpenMHz replaces Broadcastify; native track runs alongside the web/Capacitor track.

### M6 — Local dev stack running
**Status:** verified
**Goal:** Local stack running on Windows.
**Evidence:** Stack set up and running locally.

### M7 — Resolve the OpenMHz 403 block (client-side discovery)
**Status:** in-progress
**Goal:** Confirm the mobile client can reach OpenMHz for feed discovery/polling without the HTTP 403 that blocks server-side requests.
**Acceptance criteria:** On a real device (Expo Go or dev build), the app successfully lists live OpenMHz feeds for at least one test city.
**Next action (Justin):** Open the app > Settings > "Run connection tests" and note the OpenMHz line; then open Feeds and search a city. Report the result.

### M7B — Feed coverage strategy beyond OpenMHz (combo/phased)
**Status:** planned
**Goal:** Broadcastify does not license apps that wrap their live audio catalog into a competing listening experience. Pursue three legitimate paths, phased:
  - **Phase 1 (near-term, in-app):** deep-link each Broadcastify feed to its official listen page/app; generate captions by capturing the device's own audio output while it plays, not by ingesting their stream.
  - **Phase 2 (ongoing, community):** let users submit and curate independent stream URLs from agencies that broadcast outside Broadcastify.
  - **Phase 3 (parallel, outreach):** keep OpenMHz as the primary directly-integrated source; separately submit an application to Broadcastify in case a scoped license is ever granted.
**Acceptance criteria:** Phase 1 shipped and usable end-to-end before Phase 2 tooling starts.
**Next action:** Scope Phase 1 once M7 is verified.

### M8 — Free coding-agent workflow in place
**Status:** verified
**Goal:** A $0-cost agentic dev tool reading `spec.md` and this file.
**Evidence:** Justin has aider v0.86.2 running against the Gemini free API (`gemini/gemini-2.5-flash`) in a real git repo.

### M8B — Self-developing agent loop (duties, lessons, schedule)
**Status:** in-progress
**Goal:** `agent/` runs assigned duties on gated branches, on a schedule, for free.
**Acceptance criteria:** One full unattended run (scheduled or manual) produces a branch that passes the type-check gate and that Justin reviews and merges.
**Next action (Justin):** Follow START_HERE.md part 3, then `node agent/run.mjs typecheck-fix --dry-run`, then a real run of `next-milestone`.

### M9 — Real transcription + translation pipeline
**Status:** in-progress
**Goal:** Live audio → Whisper transcription → LLM plain-language translation → captions in the app, localized to device language.
**Built:** `backend/` (`POST /caption`), Whisper via `docker-compose.yml`, Gemini/Ollama provider switch; the mobile Listen screen captions each call.
**Acceptance criteria:** A real feed's transmission containing a 10-code produces a correct plain-language caption within a few seconds of the audio, with no paid API calls.
**Next action (Justin):** Complete START_HERE.md parts 1–2, open a busy feed, and report what captions appear.

### M10 — Editable 10-code dictionary shipped in-app
**Status:** in-progress
**Goal:** Starter 10-code dictionary, user-editable, persisted locally.
**Built:** "Codes" tab; persisted with AsyncStorage; edits are sent with every caption request.
**Acceptance criteria:** Edit and save a mapping, fully close and reopen the app, and see it persist.
**Next action (Justin):** Do exactly that on your phone.

### M11 — Installable preview build (EAS free tier)
**Status:** planned
**Goal:** First installable `.apk` / ad-hoc iOS build via EAS free tier, outside Expo Go.
**Acceptance criteria:** Justin installs and runs the app on his own device outside of Expo Go.

### M12 — Top feeds curated list
**Status:** planned
**Goal:** Define and ship a curated "top feeds" shortlist.
**Acceptance criteria:** List defined (criteria TBD) and selectable from the app.

### M13 — Paid shipping gates (deferred until justified)
**Status:** planned
**Goal:** Apple Developer account ($99/yr), Google Play Console ($25 one-time), store listings, billing/ads/tier implementation.
**Note:** Deliberately last.

---

## Changelog
- 2026-09-27: Ledger created, M1–M6 backfilled as verified from prior decisions, M7 marked in-progress, M8–M13 queued.
- 2026-10-02: Fresh scaffold generated. M8 recorded as verified (aider + Gemini free API working). M8B added. M9 and M10 moved to in-progress (code exists, unverified on a device). M7 gained an in-app test button.
