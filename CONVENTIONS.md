# Conventions (the "constitution"). Read by every agent run.

Source of truth: spec.md (what the app is) and MILESTONES.md (what is done / next).

## Hard rules
1. Work on ONE milestone or duty per run. Keep the change small enough to review in five minutes.
2. NEVER mark a milestone `verified` or `shipped`. Only Justin does that, with evidence. Use `in-progress`
   and write what he must check.
3. Skip anything that needs a physical phone, a paid account, or manual testing (M7, M11, M13).
4. No paid APIs or SDKs, no dependencies that need a paid key. Free tiers only (spec.md section 4).
5. Never scrape or bypass Broadcastify (spec.md section 7).
6. OpenMHz is called ONLY from the mobile app. The backend never calls OpenMHz.
7. Real working code only: no mock data, no placeholder screens, no fake models.
8. `npx tsc --noEmit` must pass in backend/ and mobile/ before you finish.
9. Do not edit: spec.md, CONVENTIONS.md, anything under agent/ or .github/, or any .env file.
10. Finish by adding one dated line to the Changelog at the bottom of MILESTONES.md.

## Style
- TypeScript strict. No `any` unless parsing an external API response, and then narrow it immediately.
- Mobile: add native packages only with `npx expo install <pkg>`. Read a module's types in node_modules
  before using it; Expo APIs change between SDK versions.
- Keep files small and named for what they do. Follow the existing folder layout.
- When unsure, change nothing and explain what you need in your final message.
