# MILESTONES — Ten4 Text
NOTE FROM JUSTIN: This is a team built working document that can fully be modified to achieve the end result we are looking for in our mission. It does not matter how we get there, if we get there. you may invent, modify, add, remove, update, regress; anything you see fit to reach our final destination. 

We seek to translate emergency radio and internet streams that use 10-4 among other code that is not easy for the common public to understand. We will provide acurate live feeds for local emergency streams for our users on their devices and we will also allow the browsing of existing other locations. we will help the public understand what they are hearing in a potentially critical emergency scenario. It can also be used for personal entertainment and informational research as well. 

DO NOT REMOVE ANYTHING ABOVE THIS SENTENCE. YOU MUST NOT MODIFIY A SINGLE CHARACTER AVOVE HERE! 
You may modify and make your improvements below. be sure you add a note with your username or login information when you make the update. 
#
#
#
#
MILESTONES - You can modify. 

Each milestone closes with evidence (a passing test, a working build, a note from jules or from justin) — not just a claim that it's
done. 

Status values: `planned`, `in-progress`, `verified`, `shipped`.

**2026-09-30 note:** the project moved from the `ten4-clear` folder to a new,
more complete `ten4-text` scaffold (Docker Whisper, Gemini backend, built-in
self-developing agent system). Early decisions below (M1–M6, M7B) carry
forward unchanged (but can be changed or updated or removed or added) since they're decisions, not code. 
Implementation

milestones (M7, M9, M10, M11, M12) are re-scoped against the new scaffold,
since its own docs state the live end-to-end path hasn't been run yet.

---

### M1 — Concept agreed: emergency radio directory
**Status:** verified
**Goal:** Define the product vision for a live emergency service radio directory (fire, police, EMS across US cities) paired with real-time closed captioning and 10-code translation into plain language in the device's native language.
**Acceptance criteria:** Documented constraints and vision in `spec.md` §1–2. Direct client-side polling of OpenMHz feeds established as the primary audio source to prevent server HTTP 403 blocks.
**Evidence:** Concept and architecture constraints confirmed and captured in `spec.md` §1–2.

### M2 — Demo scope approved
**Status:** verified
**Goal:** Establish the foundational multi-screen mobile experience and backend pipeline architecture required for a working prototype.
**Scope:**
- Mobile App: 4 core screens (`FeedsScreen`, `ListenScreen`, `DictionaryScreen`, `SettingsScreen`) built with React Native / Expo SDK 57.
- Backend Pipeline: Node/Express service interfacing with Dockerized Whisper ASR for transcription and Gemini API free-tier for plain-language translation.
**Evidence:** App layout, screen navigation in `App.tsx`, and pipeline contract in `backend/src/pipeline` implemented and reviewed.

### M3 — Decision: build real pipeline 
**Status:** verified
**Goal:** Eliminate placeholder/mock models and synthetic transcriptions in favor of end-to-end integration with real Whisper ASR audio processing and Gemini LLM interpretation.
**Acceptance criteria:** Standing project constraint enforced across all modules: no mock data, fake streams, or dummy captions in working builds (see `spec.md` §4).
**Evidence:** `backend/src/index.ts` processes real `audioBase64` payloads from OpenMHz streams directly through `transcribe.ts` and `interpret.ts`.

### M4 — Native mobile scope adopted + website (iOS/Android)
**Status:** verified
**Goal:** Target cross-platform mobile devices (iOS and Android) using React Native and Expo SDK 57 for audio playback and caption display.
**Acceptance criteria:** Client downloads call audio directly using Expo APIs, plays audio via `expo-audio`, and posts base64 audio buffers to backend for real-time captions.
**Evidence:** `mobile/src/screens/ListenScreen.tsx` and `mobile/src/api/openmhz.ts` implemented and compiled clean without web/desktop framework dependencies.

### M5 — Ten4 Text (native track) spec resolved
**Status:** verified
**Evidence:** OpenMHz as primary for client-side audio source; Broadcastify will be considered as well if we are able to scrape it with a successful return.
AGAIN, BROADCAST IS NOT excluded from direct integration, nor is other locally hosted and published broadcast feeds from local emergency organizations.

### M6 — Local dev stack running in parallel to GitHub repo which should ideally be used as the source of truth for all code work. (ten4-clear - copy folder)
**Status:** verified (superseded by the new scaffold's own stack, see M9)

### M7 — Verify OpenMHz reachability from the mobile client
**Status:** in-progress
**Goal:** Confirm the mobile app can reach OpenMHz for feed discovery
without the HTTP 403 that blocks server-side requests.
**Acceptance criteria:** In the new scaffold's Settings → "Run connection
tests," the line `OpenMHz from this device: HTTP 200 (OK, M7 evidence)`
appears on a real device over real Wi-Fi.
**Next action:** Jules to update the steps in documentation for QA agent perform.
The QA Agent action will be to run Part 1–2 of `docs/GETTING_STARTED.md` in a valid test environment possibly a virtual moch phone and report back whatever that line actually says — pass or fail + notes ideally.

### M7B — Feed coverage strategy beyond OpenMHz (combo/phased)
**Status:** planned
**Decision (unchanged):** pursue three phases rather than one bet —
(1) deep-link to Broadcastify's listen page + on-device audio capture for
captions, (2) user-contributed independent stream URLs, (3) parallel honest
application to Broadcastify for a scoped license. Phase 1 is the next real
implementation work once M7 is verified.

### M8 — Self-developing agent workflow in place
**Status:** in-progress
**Goal:** The new scaffold ships its own agent system (`agent/run.mjs`,
duty files, branch-based review, protected-file rules) — a significant
upgrade over the earlier manual aider setup from the `ten4-clear` folder.
**Acceptance criteria:** `node agent/run.mjs --doctor` reports OK on all
five lines; `node agent/run.mjs next-milestone --dry-run` prints a sane
plan; one real `node agent/run.mjs next-milestone` run completes and
produces a reviewable branch.
**Next action:** QA Agent to run the doctor check and the dry run, then one
real run, and report what each prints.
**Note:** The earlier aider+Gemini setup (confirmed working against the old
`ten4-clear` repo) proved the free-tool approach is viable on this
hardware — this milestone carries that proof forward into the new,
more capable agent system rather than repeating it from scratch.

### M9 — Real transcription + translation pipeline (self-hosted + Gemini)
**Status:** in-progress
**Goal:** Live audio → Dockerized Whisper transcription → Gemini
plain-language translation → captions rendered in the app, localized to
device language.
**Acceptance criteria:** Backend health check
(`curl http://localhost:4000/health`) reports
`"whisper":true,...,"llmConfigured":true`, and a real feed produces a
real caption within a few seconds on-device.
**Next action:** Justin to complete Part 1 of `docs/GETTING_STARTED.md`
(Docker Whisper up, `.env` configured with a freshly-rotated Gemini key,
backend running) and report the health check output.

### M10 — Editable 10-code dictionary, persists across restarts
**Status:** in-progress
**Acceptance criteria:** Edit a code in the Codes tab, fully close the app,
reopen it — the edit is still there.
**Next action:** Justin to verify this as part of Part 2, step 7.

### M11 — Installable preview build (EAS free tier)
**Status:** planned
**Goal:** First installable `.apk` (Android) and ad-hoc/TestFlight `.ipa`
(iOS) via EAS free tier.
**Acceptance criteria:** Justin installs and runs the app outside of Expo
Go on his own device.

### M12 — Top feeds curated list
**Status:** planned

### M13 — Paid shipping gates (deferred until justified)
**Status:** planned
**Note:** Deliberately last. Apple Developer ($99/yr), Google Play
Console ($25 one-time), billing/ads/tiers — not started until the free-tier
build has proven the core experience works.

### M14 — Rotate the exposed Gemini API key
**Status:** planned (urgent)
**Goal:** A Gemini API key was pasted into a shared document and exposed in
this conversation. It must be revoked at
https://aistudio.google.com/apikey and a new one issued, placed only in
`.env` via a local editor — never in chat, a document, or anything shared.
**Acceptance criteria:** Old key shows revoked in Google AI Studio; new key
confirmed working via the M9 backend health check.
**Next action:** Justin to confirm this is done.

---

## Changelog
- 2026-10-21: Expanded M1–M4 milestones with explicit goals, scope, acceptance criteria, and evidence.
- 2026-09-30: Rewrote against the new `ten4-text` scaffold. M7, M9, M10
  re-scoped to the new codebase's real verification paths (connection
  tests, health check, restart check) instead of generic acceptance
  criteria. Added M8 (self-developing agent) and M14 (key rotation,
  urgent). M6 marked verified-but-superseded.
- 2026-09-27: M7B combo/phased decision recorded.
