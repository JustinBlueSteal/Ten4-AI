# Deployment notes

## Status of this build (2026-10-02)
**Verified in the build environment**
- `backend/` and `mobile/` pass `npx tsc --noEmit`.
- `mobile/` bundles with Metro for Android (614 modules).
- Backend request flow (`POST /caption`) exercised end to end against throwaway stand-in servers for
  Whisper and the LLM: JSON extraction from a fenced reply, urgency normalisation, language and
  dictionary passthrough, input validation.
- Agent runner exercised against a stand-in Aider that misbehaves on purpose: protected-file edits,
  fake "verified", banned dependency, type-check failure, rate limit, no-op, dirty tree, and
  back-to-back runs were all handled and left the repo clean. Aider 0.86.2's real CLI flags were
  checked against its `--help`.

**NOT verified (needs your machine)**
- A live run with real Whisper, the real Gemini API, and a real phone.
- OpenMHz: the endpoints and field names (`/systems`, `/{system}/calls`, `/{system}/calls/newer?time=`)
  were written from knowledge of an undocumented API and are unconfirmed. The client parses tolerantly;
  the first real run confirms or corrects them. The 403 question is milestone M7.
- Windows Task Scheduler registration and the GitHub Actions workflow.
- Real Aider output quality with Gemini free tier.

## Configuration (`backend/.env`)
| Variable | Default | Meaning |
|---|---|---|
| `PORT` | 4000 | Backend port |
| `WHISPER_ASR_URL` | http://localhost:9000 | Self-hosted Whisper |
| `LLM_PROVIDER` | gemini | `gemini` or `ollama` |
| `GEMINI_API_KEY` | (empty) | Free key from aistudio.google.com/apikey |
| `GEMINI_MODEL` | gemini-2.5-flash | |
| `OLLAMA_URL`, `OLLAMA_MODEL` | localhost:11434, llama3.1 | Only if `LLM_PROVIDER=ollama` |
| `LLM_MIN_INTERVAL_MS` | 7000 | Spacing between LLM calls to respect free-tier limits |

## Known gaps before a store release
- No user accounts or auth; the backend has no authentication (fine on your home network, not on the internet).
- Single Node process; no production process manager.
- Gemini's free tier has daily and per-minute caps, and Google may use free-tier inputs to improve its products;
  radio audio is public, but check Google's current terms before relying on it.
- Standalone store/preview builds (M11) block plain `http://` backends by default on Android 9+ and iOS; the backend will need HTTPS (or an explicit cleartext setting for testing). Expo Go is unaffected.
- No automated tests yet (by your choice: testing is a separate pre-launch task).
- App Store / Play Store accounts are deferred (M13).
