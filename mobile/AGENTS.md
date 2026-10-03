# Mobile conventions (for coding agents)

- Expo SDK 57 / React Native 0.86 / React 19. Expo APIs change between SDKs: before using an
  Expo module, read its types under `node_modules/<pkg>/build/*.d.ts` instead of trusting memory.
- Add native-module dependencies ONLY with `npx expo install <pkg>` (pins SDK-compatible versions).
  Never add anything that needs a paid key or a custom dev build unless Justin approves.
- Navigation is plain state in `App.tsx` (no router library). Don't introduce one unprompted.
- OpenMHz is called ONLY from this app (server-side requests get HTTP 403). Never move that to the backend.
- Gate before declaring done: `npx tsc --noEmit` must pass.
