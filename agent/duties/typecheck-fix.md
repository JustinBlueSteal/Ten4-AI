---
id: typecheck-fix
title: Fix TypeScript errors
schedule: nightly
gate: backend,mobile
run_if: gate-fails
---
The TypeScript type-check currently fails (the exact errors are appended below this assignment when the
runner starts you). Fix the errors with the smallest correct change. Do not delete features, loosen
`strict`, or sprinkle `any` / `@ts-ignore` just to silence errors. Fix the real cause.
