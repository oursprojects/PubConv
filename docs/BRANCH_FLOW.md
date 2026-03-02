# Branch Flow: `main` and `mobile`

## Source of truth
- `main` is the source of truth for shared product behavior, including API handling, auth logic, RLS assumptions, server actions, shared UI, and chat behavior.

## Mobile branch role
- `mobile` must always contain everything in `main`.
- `mobile` may add native/mobile-only changes on top, such as `android/**`, `capacitor.config.ts`, native providers, and Android UX enhancements.

## Required workflow
1. Build shared features/fixes in `main`.
2. Merge/pull `main` into `mobile` immediately after shared changes are ready.
3. Add native-only changes in `mobile`.
4. Keep commits scoped with `core:` for shared changes and `mobile:` for native-only changes.

## Public chat app guardrails
- Never rely on client-only checks for security decisions.
- Keep critical enforcement server-side/DB-side (auth, moderation, rate limits).
- Offline mode must not force login redirects for active sessions.
- Logout must remain disabled while offline.

## Quick sync commands
```bash
git checkout main
git pull origin main

git checkout mobile
git pull origin mobile
git merge main
git push origin mobile
```
