# START HERE — Ten4 Text

Do the parts in order. Every step says what you should see. If you don't see it, jump to
`docs/TROUBLESHOOTING.md`. Total time: about 45 minutes, plus a one-time Docker image download.

**Free check:** nothing here needs a credit card. The only account is a free Google AI Studio key.

---

## Part 0 — Put the folder in place (5 min)

1. Unzip `ten4-text.zip` to a **new** folder, e.g. `C:\Users\Justin\Desktop\10-4 CEAR\ten4-clear>`.
   Don't copy it over your old `10-4 CEAR\ten4-clear` folder; keep that as a backup.
2. Open PowerShell in that folder and run:
   ```
   git init -b main
   git add -A
   git commit -m "Fresh Ten4 Text scaffold"
   ```
   ✅ You should see a commit summary listing the files.
3. Get your free Gemini key: https://aistudio.google.com/apikey → *Create API key*. Copy it.

---

## Part 1 — Start the backend (15 min)

1. **Whisper (speech-to-text).** Make sure Docker Desktop is running, then in the project folder:
   ```
   docker compose up -d
   ```
   The first run downloads an image and a model (a few minutes).
   ✅ Check: open http://localhost:9000/docs in a browser. A page titled "Whisper ASR Webservice" appears.
2. **Backend settings.**
   ```
   cd backend
   copy .env.example .env
   notepad .env
   ```
   Paste your key after `GEMINI_API_KEY=`. Leave everything else as it is. Save and close.
3. **Install and run.**
   ```
   npm install
   npm run dev
   ```
   ✅ You should see: `Ten4 Text backend on :4000  (LLM: gemini)`. Leave this window open.
4. **Check it.** In a second PowerShell window: `curl.exe http://localhost:4000/health`
   ✅ Expect `"ok":true,"whisper":true,...,"llmConfigured":true`.
5. **Run the E2E pipeline test tool.**
   ```
   node tools/test-e2e-pipeline.mjs
   ```
   ✅ Tests health and sends real audio bytes to `/caption`, confirming transcription and 10-code interpretation structure.

Why Gemini and not Ollama for the AI step? Your PC froze running a 7B model locally. Gemini's free
tier runs on Google's servers instead. To go fully local later, set `LLM_PROVIDER=ollama` in `backend/.env`.

---

## Part 2 — Run the app on your phone (15 min)

1. **Find your PC's address.** In PowerShell run `ipconfig` and copy the *IPv4 Address* of your Wi-Fi
   adapter (like `192.168.1.23`). Your phone must be on the **same Wi-Fi**.
2. **Let your phone through the Windows firewall.** The first time Node starts you'll see a Windows
   prompt. Tick **Private networks** and click **Allow**. (If you missed it: Windows Security → Firewall →
   Allow an app → Node.js → Private.)
3. **Update Expo Go** on your phone from the App Store / Google Play (this project uses Expo SDK 57,
   and old Expo Go versions refuse to open it).
4. **Start the app.** In a new PowerShell window:
   ```
   cd mobile
   npm install
   npx expo start
   ```
   ✅ A QR code appears. Scan it (iPhone: Camera app; Android: inside Expo Go).
   If it can't connect, run `npx expo start --tunnel` instead.
5. **Tell the app where your backend is.** In the app: **Settings** tab → *Backend URL* →
   `http://YOUR_IP:4000` (for example `http://192.168.1.23:4000`).
6. **Run the M7 test.** Settings → **Run connection tests**.
   ✅ Best case you'll see `OpenMHz from this device: HTTP 200 (OK, M7 evidence)` and
   `Backend: reachable. Whisper up; LLM gemini configured`.
   **Whatever the OpenMHz line says, write it down. That is milestone M7's evidence, good or bad.**
7. **Try it.** Feeds tab → *Use my location* (or search your city) → tap a feed → Listen tab.
   Audio plays and captions appear a few seconds after each transmission. Open the **Codes** tab,
   edit a code, fully close the app, reopen it: your edit should still be there (that's M10).

---

## Part 3 — Turn on the self-developing agent (15 min)

The agent is Aider driven by small "duty" files. It works on its own git branch, refuses to touch
protected files, can never mark a milestone verified, and throws its work away if the type-check
fails. You review and merge. Details: `agent/README.md`.

1. In the project's root folder (not backend/): `copy .env.example .env`, open it, paste the same
   Gemini key after `GEMINI_API_KEY=`.
2. Health check: `node agent/run.mjs --doctor`
   ✅ Expect `OK` on all five lines. (If aider is missing, create and activate a Python virtual environment:
   `python3 -m venv venv` and `source venv/bin/activate` or `.\venv\Scripts\Activate.ps1`, then run `pip install aider-chat`.)
3. See your starting duties: `node agent/run.mjs --list`
4. Rehearse without spending anything: `node agent/run.mjs next-milestone --dry-run`
   Prints exactly what the agent would be told.
5. **First real run:** `node agent/run.mjs next-milestone`
   Takes a few minutes. Possible endings: `committed` (review it!), `no-changes`, `rejected`
   (it broke a rule and was undone), `failed-gate`, `rate-limited` (try tomorrow).
6. **Review the work.** The result is a branch named `agent/next-milestone-…`:
   ```
   git branch --list "agent/*"
   git diff main..agent/next-milestone-XXXX
   ```
   Happy? `git merge agent/next-milestone-XXXX`. Not happy? `git branch -D agent/next-milestone-XXXX`.
7. **Make it automatic (Windows).** Runs every night at 2:00 AM while your PC is on:
   ```
   powershell -ExecutionPolicy Bypass -File agent\schedule.ps1
   ```
   Remove it any time with `-Remove` on the end.
8. **Optional: run it in the cloud so your PC can stay off.** Create a free GitHub repo, push, add the
   secret `GEMINI_API_KEY` (repo Settings → Secrets and variables → Actions). Full steps are at the top of
   `.github/workflows/agent.yml`. It opens a pull request instead of a local branch.

### Teaching and assigning (your day-to-day controls)

- **Teach a rule** (applied to every future run):
  `node agent/teach.mjs "Captions must never be longer than three lines."`
- **Assign a duty** (a job in plain English):
  `node agent/assign.mjs --id check-rtl --schedule weekly "Make sure captions render correctly for right-to-left languages."`
  then `node agent/run.mjs check-rtl --dry-run`, then run it for real.
- **Stop a duty from running automatically:** open its file in `agent/duties/` and change `schedule:` to `manual`.

---

## Part 4 — Report back to me

Paste into the chat any of: the **Run connection tests** text from your phone, the backend window's
last 15 lines, or a failed agent branch's diff / log (`agent/logs/`). I'll work through it with you free.
When the M7 and M10 checks pass, tell me and I'll record them as verified in `MILESTONES.md`.

## What was and wasn't verified before you got this
See `docs/DEPLOYMENT.md` → "Status of this build". Short version: the code compiles and bundles, the
backend flow and the agent's safety rails were tested; a live run with real Whisper, real Gemini,
real OpenMHz and a real phone has not happened yet. That's Part 1–2 for you.
