# Free agentic coder + guardrail for Ten4 Text

## How it fits together

```
 Coder (free)                     Guardrail (free)                  You
 ─────────────                    ────────────────                  ───
 Jules (Google's hosted      ->   opens a pull request  ->   guardrail.yml runs:
 coding agent), or the repo's     on GitHub                  1. rule checks (cannot be argued with)
 own agent/ system on GitHub                                 2. tsc typecheck, mobile + backend
 Actions                                                     3. independent Gemini review vs spec.md
                                                             4. posts PASS / CONCERNS / FAIL comment
                                                                         |
                                                                         v
                                                    you read it, read the diff, merge or close
                                                    only YOU mark a milestone "verified"
```

Why not the Google Cloud console: hosting an agent there needs a billing account with a
card on file, and a runaway job costs real money. GitHub Actions and Jules need no card.
Why not Gemini CLI: Google ended its free tier on 2026-06-18 (it was replaced by Antigravity CLI).

## Step 0: safety checks before anything leaves your PC (5 min)

In PowerShell, inside `C:\Users\Justin\Desktop\10-4 CEAR\ten4-clear`:

```
git ls-files | Select-String "\.env"
```
Expected: only `.env.example` lines (root and backend). If `backend/.env` or `.env` shows up, stop and tell me.

```
Get-Content .gitignore
```
Expected: `.env` is listed. If not, add a line `.env` and `backend/.env`.

Also confirm you revoked the old Gemini key (the one that was pasted into chat) at
https://aistudio.google.com/apikey and made a new one. Never paste a key into chat.

## Step 1: drop the kit into the repo (3 min)

```
Expand-Archive "$env:USERPROFILE\Downloads\guardrail-kit.zip" -DestinationPath "$env:TEMP\gk" -Force
Copy-Item "$env:TEMP\gk\*" . -Recurse -Force
git status
```
`git status` should show exactly four new files: `AGENTS.md`, `.github/workflows/guardrail.yml`,
`agent/guardrail/review.mjs`, `docs/AGENTIC_SETUP.md`. Then:
```
git add -A
git commit -m "Add guardrail kit and agent rules"
```

## Step 2: put the repo on GitHub, private (5 min)

1. github.com -> New repository -> name `ten4-text` -> **Private** -> do not add a README -> Create.
2. Copy the two lines GitHub shows under "push an existing repository", or run (use your username):
```
git remote add origin https://github.com/YOURNAME/ten4-text.git
git push -u origin main
```
A browser window may ask you to sign in once.

## Step 3: give the reviewer its key (2 min)

Repo -> Settings -> Secrets and variables -> Actions -> New repository secret.
Name: `GEMINI_API_KEY`. Value: your NEW key. This is the only place the key goes.
If the secret is missing the guardrail still runs its rules, and the model review shows "Skipped".

## Step 4: connect Jules, the free Google coder (5 min)

1. Go to jules.google.com, sign in with your Google account.
2. Connect GitHub when asked and pick the `ten4-text` repo.
3. Free tier as of Sept 2026: 15 tasks per rolling 24 hours, 3 at once, Gemini 3 Flash. Check the page for current limits.

Jules works in a Google cloud VM on a copy of your repo and opens a pull request when done.
It should read `AGENTS.md` automatically. If its plan ignores a rule, paste that rule into the task.

### Task template (copy, fill the goal, paste into Jules)

```
Read AGENTS.md, spec.md and MILESTONES.md first and follow AGENTS.md exactly.
Work on milestone M9 only.
Goal: make the live captions show the spoken 10-code together with its plain-language
meaning (spec.md section 3), for example "10-4 — Acknowledged". Use the real pipeline in
backend/src/pipeline and the real dictionary; no mock data.
Do not edit spec.md or MILESTONES.md. Put "Milestone: M9" on its own line in the PR description
and list anything you could not finish or verify.
```

Good first tasks are small and about one thing. Big vague tasks produce PRs the guardrail will flag as too large.

## Step 5: the daily loop

1. A pull request appears (from Jules, or from the repo's own `agent/` workflow).
2. Within a few minutes the guardrail comments on it: **PASS**, **CONCERNS**, or **FAIL**.
3. FAIL: close the PR or comment what to fix. CONCERNS: read the issues, then the diff, then decide. PASS: still read the diff.
4. Merge on GitHub. Then, on your PC: `git pull`.
5. You, not the agent, edit `MILESTONES.md` to mark a milestone verified, only after you tested it on your phone (M7, M9, M10 need your real-device evidence).

## What it checks, and what it cannot

Rules that fail a PR automatically: editing `spec.md`, `MILESTONES.md`, `.env*`, `.github/`, or the guardrail itself;
an API key in the diff; OpenMHz referenced from `backend/`; no `Milestone: M#` line (or an unknown id);
`tsc --noEmit` failing in `mobile/` or `backend/`.
Warnings: mock-looking code, new dependencies, huge PRs, work on an already-verified milestone.
Model review: scope vs the milestone, fake or stubbed behavior, dropped 10-codes in captions, claims the diff doesn't support.

Honest limits:
- The reviewer is a Gemini model and the coder is also a Gemini model, so they can share blind spots. The rule checks and your own read of the diff are the real backstop.
- If the free API is rate-limited or the key is missing, the model review is skipped and the PR shows CONCERNS, never PASS.
- It cannot test the app on a phone, listen to audio, or judge caption quality. Only you can.
- As far as I know, GitHub Free does not let you force required checks on a private repo. So the rule is simple: you only merge PRs whose comment you've read. (Check Settings -> Branches in your repo; if it offers protection, require the `guardrail` check.)
- On Gemini's free API tier, Google's terms (as I understand them) allow using your prompts to improve its products. The code in PRs is sent to the reviewer. If that matters for this app, check the current terms.
- Free quotas: Jules 15 tasks/day, Gemini API free-tier request caps, and roughly 2,000 GitHub Actions minutes a month for private repos. Each guardrail run takes a few minutes.

## Changing the rules later

Edit the policy block at the top of `agent/guardrail/review.mjs` (protected files, size limits, secret patterns),
or the rules in `AGENTS.md`. Both are protected from agents, so only you change them, in your own PR or commit.
