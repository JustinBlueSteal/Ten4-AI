# Ten4 Text: rules for every coding agent

This file is read by Jules, aider, and any other agent working in this repo.
`spec.md` and `MILESTONES.md` are the source of truth. Read both before writing code.

## How work is scoped

1. Work on exactly ONE milestone per task. Use the one the task names. If none is
   named, take the first milestone marked `in-progress` in `MILESTONES.md`.
2. Put `Milestone: M<id>` on its own line in the pull request description
   (example: `Milestone: M9`). The guardrail rejects PRs without it.
3. Meet that milestone's acceptance criteria with real, working code. Do not build
   anything you cannot trace to a line in `spec.md`.

## Hard rules (the guardrail checks these automatically)

- No mock, demo, dummy, or placeholder data in app code. Real data paths only.
  Testing is a separate task that Justin runs before launch.
- OpenMHz is called ONLY from `mobile/`. Never from `backend/` (server-side requests get HTTP 403).
- A caption must show the spoken 10-code AND its plain-language meaning
  ("10-4 — Acknowledged"). A paraphrase that drops the code is a defect.
- Never edit: `spec.md`, `MILESTONES.md`, `.env*`, `.github/**`, `agent/guardrail/**`.
  If one of them needs a change, say so in the PR description and stop.
- Never mark a milestone verified. Only Justin does that, with evidence from a real device.
- Never commit or log a secret or API key.
- Free tier only: no paid services, no paid keys. Add native modules only with
  `npx expo install <pkg>`, and nothing that needs a custom dev build.
- Expo SDK 57 / React Native 0.86 / React 19. Read an Expo module's types under
  `node_modules/<pkg>/build/*.d.ts` before using it instead of trusting memory.
- Before opening a PR, `npx tsc --noEmit` must pass in every package you touched.

## PR description format

```
Milestone: M<id>

What changed: (plain language, 2-4 sentences)
Acceptance criteria this meets: (quote them from MILESTONES.md)
Not done / needs Justin to verify on a real device: (be specific)
```

Say plainly what you did not finish. A PR that overstates its progress is worse than a small honest one.
