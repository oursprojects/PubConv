## Summary
- What changed and why.

## Branch Type
- [ ] `core` change (must be in `main`)
- [ ] `mobile` change (native-only, in `mobile`)

## Required Checks
- [ ] Shared behavior changed in `main` first (or this PR targets `main`)
- [ ] If this PR targets `mobile`, `main` was merged into `mobile` first
- [ ] No security-critical logic is client-only
- [ ] Offline flow tested (no forced login redirect while offline)
- [ ] Logout is disabled while offline

## Validation
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Android debug build passes (`mobile` branch changes only)

## Risk Notes
- Auth/API/RLS impact:
- Mobile native impact:
- Rollback plan:
