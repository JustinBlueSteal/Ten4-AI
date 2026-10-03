# Lessons taught to the agent
Read at the start of every run. Add more with: node agent/teach.mjs "your rule"

- [2026-10-02] Everything must be free to run. No paid APIs, no paid SDKs, no paid accounts (Apple/Google paid accounts are deferred until Justin decides).
- [2026-10-02] Build real, working functionality. Never add mock data, demo shortcuts, dummy models or placeholder screens.
- [2026-10-02] Justin's PC has about 12GB RAM and no GPU. Never design anything that needs a big local model; heavy AI work goes through the Gemini free API.
- [2026-10-02] OpenMHz returns HTTP 403 to server-side requests. All OpenMHz calls stay in the mobile app; the backend only receives audio the phone hands it.
- [2026-10-02] Never scrape or bypass Broadcastify. Only the three legitimate phases in MILESTONES.md M7B are allowed.
- [2026-10-02] The project's name is "Ten4 Text". Use it consistently in user-facing text.
- [2026-10-02] Testing is a separate task before launch. Do not add test suites unless a duty explicitly asks for them.
