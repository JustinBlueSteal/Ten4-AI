# agent/ — the self-developing loop

```
agent/
  run.mjs            the runner (one duty = one gated branch)
  teach.mjs          add a taught rule to knowledge/lessons.md
  assign.mjs         create a new duty from plain English
  schedule.ps1       register the Windows nightly/weekly job
  duties/            one .md file per duty (edit these freely)
  knowledge/lessons.md   rules the agent re-reads on every run
  logs/              per-run logs and saved patches (git-ignored)
```

## How a run works
1. Refuses to start if you have uncommitted changes (it never works on top of unsaved edits).
2. Creates branch `agent/<duty>-<time>`, gives Aider (Gemini free API) the duty + `spec.md`,
   `MILESTONES.md`, `CONVENTIONS.md`, and `knowledge/lessons.md`.
3. Checks the result. It is **thrown away** (patch saved in `logs/`) if it:
   - touched `spec.md`, `CONVENTIONS.md`, `agent/`, `.github/`, `.env*`, `.gitignore`, `.aider*`
   - marked any milestone `verified` or `shipped`
   - added `openai` or `@anthropic-ai/sdk` (paid APIs)
   - fails `npx tsc --noEmit` in the duty's `gate` folders
4. If it passes: commits on the branch (and pushes / opens a PR with `--push` / `--pr`).
   You review and merge.
5. If Gemini's free tier runs out (`rate-limited`), it stops for the day and retries next run.

## Commands
```
node agent/run.mjs --list                   # show duties
node agent/run.mjs --doctor                 # check git, node, aider, key
node agent/run.mjs <duty> --dry-run         # print the prompt, spend nothing
node agent/run.mjs <duty> [--push] [--pr]   # run one duty
node agent/run.mjs --schedule nightly       # run every duty whose schedule is nightly
```

## Duty file format
```
---
id: my-duty
title: Short title
schedule: manual        # manual | nightly | weekly
gate: backend,mobile    # folders that must pass tsc, or "none"
files: a.ts, b.ts       # optional: files the agent edits (otherwise it decides)
run_if: gate-fails      # optional: skip unless the type-check is currently failing
---
Plain-English instructions go here.
