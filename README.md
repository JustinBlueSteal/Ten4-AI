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
# Ten4-AI

