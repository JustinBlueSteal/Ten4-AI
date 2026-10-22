# Jules prompts for Ten4 Text

Paste each prompt into Jules as its own task. Order matters.

## Do these by hand first (Jules is not allowed to touch these files)

1. **Install the kit at the repo root.** In the repo folder: `git rm -r guardrail-kit guardrail-kit.zip`
   (and the stray root `AGENTIC_SETUP.md`), extract the new zip over the repo root, then
   `git add -A`, `git commit -m "Install guardrail and PM lane"`, `git push`.
   Repo -> Settings -> Secrets and variables -> Actions: confirm secret `GEMINI_API_KEY` (your new key).
2. **Model strings in protected files.** Change `gemini/gemini-2.5-flash` to
   `gemini/gemini-3.1-flash-lite` in `.aider.conf.yml` (line `model:`) and `agent/run.mjs` (line 13 default).
3. **CONVENTIONS.md rule 10.** It tells agents to add a Changelog line to `MILESTONES.md`, which the
   guardrail forbids for coding agents. Replace rule 10 with:
   `10. Do not edit MILESTONES.md or spec.md. Describe progress in the PR description; the project manager agent records it.`
4. Make the repo private if you do not want the code public (Settings -> General -> Danger Zone). Free either way.

## Prompt 1: cleanup (stale config and README)

```
Read AGENTS.md, spec.md and MILESTONES.md first and follow AGENTS.md exactly.
Milestone: M8 (the self-developing agent setup). Cleanup only, no new features.

Do these, nothing else:
1. Replace the stale model name "gemini-2.5-flash" with "gemini-3.1-flash-lite" in
   backend/.env.example, backend/src/config.ts (the geminiModel default) and docs/DEPLOYMENT.md.
   Search the whole repo with grep for any other "gemini-2.5-flash" or "gemini-3.8" and list
   in the PR any you did not change and why. Do not edit .aider.conf.yml or agent/run.mjs.
2. README.md: remove the stray "# Ten4-AI" heading at the end, make the project name
   "Ten4 Text" everywhere, and make the folder layout section match the real folders (check with ls).
3. Run `npx tsc --noEmit` in backend/ and mobile/ and report the results.

Put "Milestone: M8" on its own line in the PR description. List anything you could not finish.
```

## Prompt 2: async-storage check (run at the same time as Prompt 1, it touches different files)

```
Read AGENTS.md, spec.md and MILESTONES.md first and follow AGENTS.md exactly.
Milestone: M10 (dictionary persistence).

mobile/package.json has "@react-native-async-storage/async-storage": "3.1.1" from a Dependabot PR.
This project is Expo SDK 57 / React Native 0.86. Check whether that version is the one Expo SDK 57
expects: run `npx expo install --check` in mobile/ and read the output; also read the package's own
README/CHANGELOG under node_modules for breaking changes between the previously used version and 3.1.1.
Then find every import of async-storage in mobile/ and confirm each call still matches the 3.x API
by reading node_modules/@react-native-async-storage/async-storage types.
If Expo expects a different version, change package.json to the version `npx expo install` chooses
and fix any call sites. If 3.1.1 is correct, change nothing in code and say so.
Run `npx tsc --noEmit` in mobile/.

Put "Milestone: M10" on its own line in the PR description. State plainly that persistence still
needs Justin to verify on a phone (edit a code, close the app, reopen).
```

## Prompt 3: agent duties in order (after Prompts 1 and 2 are merged)

```
Read AGENTS.md, spec.md and MILESTONES.md first and follow AGENTS.md exactly.
Milestone: M8.

Look at agent/duties/*.md and agent/knowledge/lessons.md. Align the duty files with the real queue in
docs/LIMITS_AND_WORKFLOW.md so the order is: m9-caption-pipeline (captions show the spoken 10-code and
its meaning), a new m9-audio-filtering duty, a new m9-whisper-priming duty, m10-dictionary-persistence,
then typecheck-fix, check-rtl, docs-sync. m12-top-feeds and next-milestone stay but must say
"do not start until the earlier milestones are verified by Justin".
Each duty file must name its milestone, list the files it may touch, and say that nothing
may be mock data and that spec.md and MILESTONES.md are never edited.
Add one line to agent/knowledge/lessons.md: "Always use the model gemini/gemini-3.1-flash-lite;
gemini-2.5-flash is no longer available to new keys." Do not edit agent/run.mjs or .aider.conf.yml.

Put "Milestone: M8" on its own line in the PR description.
```

## Prompt 4: the project manager (Jules or the same text pasted into any agent)

Run it once after Prompts 1-3 are merged, then about once a week or after each batch of merged PRs.
Remember: the PR description must contain `Role: pm`. If Jules writes its own text, edit the
description on GitHub; the check re-runs when you save.

```
You are the project manager for Ten4 Text. Read agent/pm/PM_AGENT.md first and follow it exactly.
Then read spec.md, MILESTONES.md, README.md, docs/LIMITS_AND_WORKFLOW.md, the merged PR history
(git log) and the guardrail comments on recent PRs.

Task: bring the plan in line with reality, with the smallest doc edits that do it.
- Check each milestone's status against what exists on main. Do not mark anything verified or shipped.
- Fix stale facts in spec.md and README.md (model names, versions, folder layout), but never edit spec.md section 4.
- Rewrite vague acceptance criteria so a person can check them on a phone.
- Add the missing milestones the queue needs (audio filtering, Whisper priming) if they are not there.
- Add a dated Changelog line to every file you change.

Edit only spec.md, MILESTONES.md, README.md, START_HERE.md and docs/. No code.
In the PR description put "Role: pm" on its own line, then What changed, Why, "Decisions needed from Justin", Not verified.
```

## After each run
Read the guardrail comment, then the diff. The PM lane can change the plan but cannot mark
anything verified. You still decide, and you still test on a phone.
