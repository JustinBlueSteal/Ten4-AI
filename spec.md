# Ten4 Text — Emergency Radio Directory & Code Translator

**Status:** Active development — new scaffold adopted, pre-live-verification
**Last amended:** 2026-09-30

This is the single source of truth for what this app is. Nothing gets built
that isn't traceable to a line below. Changes are made by dated amendment in
the Changelog section — never a silent rewrite of earlier decisions.

---

## 1. Purpose

A directory + listening app that connects users to live public emergency
service radio (fire/police/EMS) feeds across US cities, with real-time
closed-caption translation of 10-code radio jargon into plain language as
it's spoken.

## 2. Target users

Members of the public who want to listen to and understand local emergency
radio traffic without needing to already know 10-code terminology.

## 3. Core features

- **Feed discovery**: auto-detect the user's local feed(s) via device
  geolocation on open; manual search as an alternative.
- **Playback**: tap a feed to play its live audio stream.
- **Real-time closed captions**: audio is transcribed to text, 10-codes in
  that text are recognized, and the caption shown to the user includes
  BOTH the spoken code and its plain-language meaning (e.g. "10-4 —
  Acknowledged"), localized to the device's language. A caption that only
  shows a paraphrase and drops the code does not meet this requirement —
  the code itself must be visible, not just its meaning.
- **Editable 10-code dictionary**: starter set of mappings, user-editable,
  persists across app restarts (M10).
- **Settings-based diagnostics**: a built-in "Run connection tests" check
  (Settings tab) that reports OpenMHz reachability from the device itself
  and backend health (Whisper + LLM) — this is the live instrument for
  M7's evidence, not a one-off manual test.

## 4. Explicit non-goals (for now)

- No radio broadcasting/receiving hardware — audio is sourced entirely from
  existing public internet streams (OpenMHz), not physical radios.
- No server-side OpenMHz calls — confirmed hard constraint (HTTP 403 on
  server-side requests). Enforced at the code level via `AGENTS.md`: "OpenMHz
  is called ONLY from this app. Never move that to the backend."
- No paid transcription/translation APIs while on a $0 budget — self-hosted
  Whisper (Docker) for transcription; Gemini's free tier (Google AI Studio)
  for translation/plain-language rendering, not local Ollama (see §8).
- No mock/demo/test data in the working build. Testing is a separate task
  run before launch, not baked into development — every milestone's
  acceptance criteria requires a real, working path, not a simulated one.
- No App Store / Google Play submission, billing, ads, or free/Pro tiers
  until the core experience is proven on a free-tier build (see M13).

## 5. Architecture

- **Mobile** (`mobile/`): Expo SDK 57 / React Native 0.86.3 / React 19.2.3 /
  TypeScript 6.0.3 — confirmed current stable as of this amendment (SDK 58
  exists only as a beta; see §8). Plain `useState`-based navigation in
  `App.tsx`, no router library. OpenMHz calls live exclusively here.
- **Backend** (`backend/`): Node service exposing `:4000`, talks to a local
  Dockerized Whisper ASR service (`:9000`) for transcription and Gemini for
  translation. Never calls OpenMHz directly.
- **Agent system** (`agent/`): a self-developing coding agent (aider,
  Gemini-backed) driven by small "duty" files, working on its own git
  branch, with guardrails — it cannot touch protected files, cannot mark a
  milestone verified itself, and discards its work if the type-check gate
  fails. A human (Justin) reviews and merges every branch. See
  `agent/README.md` for mechanics. This supersedes the plain manual aider
  loop used earlier in the project.

## 6. Tech stack (confirmed current, $0-cost, as of 2026-09-30)

| Layer | Choice | Note |
|---|---|---|
| Mobile framework | Expo SDK 57 (RN 0.86.3, React 19.2.3, TS 6.0.3) | Current stable; SDK 58 is beta-only, skip until it ships stable *and* the App Store/Play Store Expo Go builds support it |
| Dev client | Expo Go, latest | Now requires logging into the **same Expo account** in both the CLI and the phone app to run a dev project — new requirement, wasn't true earlier in 2026 |
| Transcription | Self-hosted Whisper ASR (Docker) | Free, local, no API cost |
| Translation / plain-language | Gemini API free tier (`gemini-2.5-flash` or current free-tier flash model) | Runs on Google's servers — chosen specifically because local Ollama inference froze Justin's machine (12GB RAM, CPU-only) |
| Coding agent | Aider + Gemini (via `agent/` duty-file system) | Free tier, same reasoning as above — do not switch back to local Ollama for this machine |
| Audio source | OpenMHz, client-side only | Server-side calls return HTTP 403; Broadcastify explicitly disallows apps that wrap their catalog (see §7) |
| Repo/CI | GitHub free tier | Optional: `agent/schedule.ps1` for nightly local runs, or `.github/workflows/agent.yml` for cloud runs |

## 7. Known open issues

- **Feed coverage beyond OpenMHz (M7B)**: Broadcastify's Live Audio Catalog
  API explicitly refuses licenses to apps — AI-built ones included — that
  "wrap their live audio catalog into a competing listening experience."
  Decision: phased approach — (1) deep-link to Broadcastify's own listen
  page with on-device audio capture for captions, (2) user-contributed
  independent stream URLs, (3) parallel honest application to Broadcastify
  for a scoped license. Not yet started.
- **Live, end-to-end verification not yet done**: the mobile and backend
  code compiles/bundles and the agent's safety rails have been tested, but
  a live run with real Whisper, real Gemini, real OpenMHz, and a real phone
  has not happened yet. That is the immediate next step (Part 1–2 of
  `docs/GETTING_STARTED.md`), and is what resolves M7, M9, and M10.

## 8. Operational notes / lessons learned

- **Never paste API keys into chat, documents, or anything that leaves your
  machine.** A Gemini key was exposed this way once; it must be revoked at
  https://aistudio.google.com/apikey and replaced, and keys from here on
  only ever go into `.env` files via a local editor, never into a message
  or a shared document.
- **`.env` files are never committed to git.** Use `.env.example` as the
  template; real `.env` files stay in `.gitignore`.
- **`node_modules/` is never committed to git** — regenerate with
  `npm install`.
- **Don't run large local models on this machine.** 12GB RAM, CPU-only;
  a 7B model froze the whole system. Cloud free tiers (Gemini) are the
  right call here, not a smaller local model as a workaround — speed and
  stability both favor cloud for this hardware.
- **Expo SDK 58 is in beta as of this writing (RN 0.88 RC)** — do not
  upgrade to it for this project until it's stable and the App Store/Play
  Store Expo Go builds confirm support, to avoid being stuck mid-migration
  before launch.

## Changelog

- 2026-09-30: Consolidated spec after adopting the new `ten4-text` scaffold
  (supersedes the earlier `ten4-clear` folder). Verified current stack
  (Expo SDK 57 confirmed current stable, SDK 58 beta-only) via live search
  rather than assumption. Logged the Expo Go login requirement, the
  exposed-API-key incident, and the no-mock-data standing rule.
- 2026-09-27: Spec formalized from prior conversation history; Broadcastify
  constraint and phased M7B decision recorded.
