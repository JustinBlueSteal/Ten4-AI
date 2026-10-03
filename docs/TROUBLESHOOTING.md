# Troubleshooting (find your symptom)

| Symptom | Fix |
|---|---|
| `docker compose up` fails: "Cannot connect to the Docker daemon" | Open Docker Desktop and wait until it says running. |
| Port 9000 already in use | Change `"9000:9000"` to `"9100:9000"` in `docker-compose.yml`, and set `WHISPER_ASR_URL=http://localhost:9100` in `backend/.env`. |
| `/health` says `"whisper":false` | Whisper is still loading its model (give it a minute) or the container stopped: `docker compose logs whisper`. |
| `/health` says `"llmConfigured":false` | `GEMINI_API_KEY` is empty in `backend/.env`. Restart `npm run dev` after saving. |
| Phone: "Could not connect to development server" | Same Wi-Fi? No VPN? Allow Node through Windows Firewall (Private). Or run `npx expo start --tunnel`. |
| Phone: Expo Go says the project needs a newer/older version | Update Expo Go from the store (this project is Expo SDK 57). |
| Settings test: backend unreachable | The Backend URL must be your PC's LAN IP (`http://192.168.x.x:4000`), never `localhost`. |
| Settings test: OpenMHz **403** from the phone | That is a real M7 result: report it and we'll go to the M7B plan. |
| Feeds list empty or "No feeds matched your location" | Use the search box; the location match is by state/county/city text and can miss. |
| Audio plays but no captions | Check the backend window for `[caption] failed:`. Whisper down, key missing, or rate limit. |
| Captions say "Skipped (captions were behind)" | Normal on the free tier when a feed is very busy; the app drops the oldest rather than lagging forever. |
| Backend log: `LLM HTTP 429` | Gemini free-tier limit. It recovers on its own; raise `LLM_MIN_INTERVAL_MS` to space calls out more. |
| `node agent/run.mjs --doctor` shows FAIL for aider | `pip install aider-chat`, then reopen PowerShell. |
| Agent says "working tree has uncommitted changes" | `git add -A; git commit -m "wip"` (or `git stash`), then rerun. |
| Agent status `rate-limited` | Gemini's daily free quota is used up; it retries on the next scheduled run. |
| Agent status `rejected` / `failed-gate` | The safety rails undid the work. Read `agent/logs/*.log`; the attempted diff is in the matching `.patch`. Paste either here for help. |
| Task Scheduler job never ran | PC was asleep/off or you weren't logged in. Test with `Start-ScheduledTask -TaskName Ten4Text-Agent-nightly`. |
