# Ten4 Text — Emergency Radio Directory & Code Translator

**Status:** Active development
**Last amended:** 2026-10-02

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

## 3. Core features (in scope)

- **Feed discovery**: auto-detect the user's local feed(s) via device
  geolocation on open; manual location/city picker as an alternative.
- **Top feeds**: a curated shortlist of popular/high-traffic feeds
  (list itself TBD, tracked as a future milestone).
- **Playback**: tap a feed to play its live audio stream.
- **Real-time closed captions**: as the feed plays, spoken 10-codes are
  transcribed and translated into plain language captions, localized to the
  user's device language — functions like live closed captioning, not a
  static lookup.
- **Editable 10-code dictionary**: a starter set of 10-code → plain-language
  mappings, user-editable.
- **Self-developing workflow (amended 2026-10-02)**: a free, guarded agent
  system (`agent/`) that carries out duties Justin assigns and lessons he
  teaches, on reviewable branches, gated by the type-check.

## 4. Explicit non-goals (for now)

- No radio broadcasting or receiving hardware — audio is sourced entirely
  from existing public internet streams (OpenMHz), not physical radios.
- No Broadcastify integration — access was not obtainable; OpenMHz is the
  sole audio source.
- No paid transcription/translation APIs (OpenAI Whisper/GPT-4) while the
  project runs on a $0 budget. Speech-to-text is self-hosted Whisper.
  Interpretation/translation uses a free-tier or self-hosted LLM (see
  §6 and the 2026-10-02 amendment).
- No App Store / Google Play submission, billing, ads, or free/Pro tiers
  until the core experience is proven on a free-tier build. These are
  tracked as later milestones, explicitly gated behind $0-cost validation
  first.

## 5. Architecture

Two parallel tracks, not a replacement of one by the other:

- **Ten4 Text (web/Capacitor track)**: the original web app — OpenMHz
  feed picker (geolocation + manual search), real audio playback, editable
  10-code dictionary. Wrapped via Capacitor for iOS/Android packaging.
  (Not part of the 2026-10-02 fresh scaffold; kept as its own track.)
- **Ten4 Text (native track)**: React Native + Expo + TypeScript frontend;
  Node/Express backend; self-hosted transcription (Whisper) and an LLM for
  plain-language translation; audio discovered, polled and downloaded by the
  mobile client directly from OpenMHz (the backend hit HTTP 403 on
  server-side OpenMHz requests), then handed to the backend as bytes.

## 6. Tech stack (current, $0-cost)

- Frontend: React Native / Expo (SDK 57) / TypeScript
- Backend: Node / Express (REST, one `POST /caption` per call)
- Transcription: self-hosted Whisper (`whisper-asr-webservice`, Docker, `base` model)
- Interpretation/translation: LLM behind a provider switch —
  `gemini` (Google free tier, default) or `ollama` (fully local)
- Audio ingestion: OpenMHz public API, called from the mobile client
- Local dev: Docker (Whisper only)
- Agent/dev workflow: Aider + Gemini free API, driven by `agent/` duties;
  this chat for planning and review
- Build: Expo EAS free tier (development/preview profiles)
- Repo/CI: GitHub free tier (Actions type-check, Dependabot)

## 7. Known open issues

- **OpenMHz 403 block**: the backend's server-side requests to OpenMHz are
  blocked (HTTP 403) even with browser-matching headers. Decision: OpenMHz
  discovery/polling lives in the mobile client; the backend only transcribes
  and translates audio it is handed. **Not yet verified** — pending a
  real-device test (Settings tab > Run connection tests).
- **OpenMHz response shapes unverified**: the API is undocumented; the
  client parses it tolerantly, but the field names were written from
  knowledge, not from a live response. First real run confirms or corrects.
- **Feed coverage beyond OpenMHz**: Broadcastify's Live Audio Catalog API
  explicitly refuses licenses to apps that "wrap their live audio catalog
  into a competing listening experience." Scraping or bypassing this is not
  an option. **Decided (2026-09-27):** pursue three legitimate paths as
  phases — see `MILESTONES.md` M7B.
- **Free-tier limits**: Gemini's free API is rate-limited. The backend
  spaces calls out and the app skips captions when it falls behind rather
  than queueing forever.

## Changelog

- 2026-09-27: Spec formalized from prior conversation history into this
  document; no new decisions made, existing decisions consolidated.
- 2026-10-02: Fresh scaffold generated. **Amendments** (confirm or reverse):
  (1) §4/§6 — interpretation/translation LLM may be Google's free Gemini
  API instead of local Ollama, because a 7B local model froze the 12GB
  CPU-only dev PC; Ollama stays available via `LLM_PROVIDER=ollama`.
  LibreTranslate is dropped (the LLM translates in the same call).
  (2) §5/§6 — Socket.io dropped; with client-side polling, one HTTP request
  per call is simpler. (3) §3 — self-developing agent workflow added.
