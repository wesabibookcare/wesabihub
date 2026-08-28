## 2026-08-28 - Inconsistent Auth Request Context Property Name (req.user vs req.authUser)
**Vulnerability:** Developer portal application management endpoints (`/api/v1/developer/applications/*`) protected by `requireAuth()` attempted to access `req.user.uid` instead of `req.authUser.uid`.
**Learning:** `requireAuth()` middleware attaches the decoded and verified Firebase user profile to `req.authUser`. Attempting to read `req.user.uid` caused runtime `TypeError` 500 exceptions and failed authorization checks.
**Prevention:** Standardize Express request type definitions and ensure all authenticated endpoints reference `req.authUser` for verified identity context.
