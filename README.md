# Ten4 Text

Emergency radio directory + live "closed captions" that translate 10-codes and jargon into plain
language, in your device's language. Free to run: OpenMHz audio, self-hosted Whisper, Gemini free-tier
(or local Ollama) for plain-language translation.

**New here? Open `START_HERE.md`.**

```
ten4-text/
  START_HERE.md        step-by-step setup (do this first)
  spec.md              what the app is (single source of truth, changed only by dated amendment)
  MILESTONES.md        the ledger: what's done, what's next, what evidence closes each one
  CONVENTIONS.md       rules every agent run must follow
  backend/             Node/Express: POST /caption = audio -> Whisper -> LLM -> plain-language caption
  mobile/              Expo / React Native app: Feeds, Listen, Codes (dictionary), Settings
  agent/               the self-developing loop: duties, lessons, runner, scheduler
  docs/                deployment status, system prompt, troubleshooting
  tools/               probe-openmhz.mjs (checks OpenMHz from a computer)
  docker-compose.yml   self-hosted Whisper
  .github/             free CI type-check, Dependabot, optional cloud agent
```

## How it works
The phone discovers and downloads call audio straight from OpenMHz (its servers answer HTTP 403 to
backend requests), plays it, and sends the same audio to your backend. The backend transcribes it with
Whisper, then asks an LLM to expand codes into plain language in the target language, using your edited
code dictionary. Captions come back colour-coded by urgency.

The web/Capacitor track (`dispatch-app`) is a separate track and is not part of this folder.

## Core Milestones Foundation (M1–M4)
- **M1 (Concept)**: Live emergency service radio directory (police, fire, EMS) with real-time plain-language closed captioning. Client-side audio requests prevent server HTTP 403 blocks.
- **M2 (Demo Scope)**: 4-screen Expo mobile application (`Feeds`, `Listen`, `Codes`, `Settings`) backed by Express, Docker Whisper ASR, and Gemini LLM.
- **M3 (Real Pipeline Only)**: No mock/demo data anywhere in working builds. Audio is downloaded by the mobile client and processed live by Whisper and Gemini.
- **M4 (Native Mobile Track)**: Expo SDK 57 / React Native 0.86 / React 19 targeting iOS and Android natively using `expo-audio` and `AsyncStorage`.

## Quick Start Guide

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure GEMINI_API_KEY
npm run dev
```

### 2. Mobile App Setup
```bash
cd mobile
npm install
npm run start
```

### 3. Pipeline Verification
Ensure Docker Whisper is running locally (`docker-compose up -d`) and test the backend health:
```bash
curl http://localhost:4000/health
```

