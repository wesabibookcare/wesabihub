# WeSabiHub Engineering Constitution

This Engineering Constitution governs ALL future development of WeSabiHub. These standards apply to all implementations by human developers, AI Studio, future AI assistants, and when adding new modules or modifying existing ones.

## CORE PRINCIPLE
WeSabiHub is an Enterprise Platform. Every implementation must prioritize:
- Reliability
- Security
- Correctness
- Maintainability
- Scalability
NOT simply adding features.

## RULE 1
BACKENDS MUST WORK PERFECTLY WITH FRONTENDS. No frontend feature is considered complete until Frontend -> Engine -> Repository -> Firestore/Storage/Functions/External -> Audit -> Notification -> Frontend Response works correctly end-to-end.

## RULE 2
Inspect existing implementation before making changes. Never create duplicate Engines, repositories, services, Firestore collections, business logic, API handlers, or Cloud Functions. Always extend existing architecture.

## RULE 3
Business logic NEVER belongs inside Pages, Components, Layouts, Widgets, or Frontend utilities. Business logic belongs only inside the appropriate Engine.

## RULE 4
Repositories are responsible only for data persistence. Repositories must never contain business rules.

## RULE 5
Every Engine owns exactly one business domain. No overlapping ownership.

## RULE 6
Every CRUD operation must be Validated, Authorized, Audited, Permission checked, Error handled, and Returned with standardized responses.

## RULE 7
Every payment operation must pass through Payment Engine, generate audit records, generate transaction history, support future refunds, support dispute workflows, and respect settlement rules.

## RULE 8
Every parcel operation must pass through Parcel Engine, record custody, record tracking, generate notifications, and generate audit logs.

## RULE 9
Every legal acceptance must pass through Compliance Engine.

## RULE 10
Every permission check must use the existing role and authorization architecture. No page should independently decide permissions.

## RULE 11
Every configuration must come from Configuration Engine. No hardcoded fees, limits, country rules, legal text, feature flags, API settings, commission settings, or withdrawal settings.

## RULE 12
Every upload must pass through Storage Engine.

## RULE 13
Every invitation must pass through Invitation Engine.

## RULE 14
Every external integration must pass through API & Integration Engine.

## RULE 15
Every important action must generate an Audit record.

## RULE 16
Every notification must pass through Notification Engine.

## RULE 17
Every frontend page must support Loading state, Empty state, Error state, Retry state, Permission denied state, and Offline handling where appropriate.

## RULE 18
Every button, icon, dropdown, modal, upload, toggle and action must work correctly, persist changes, update UI, update backend, and display success/error feedback.

## RULE 19
No placeholder or mock implementation may exist in production code unless explicitly marked as testing data.

## RULE 20
No implementation is considered complete until frontend, backend, Engines, repositories, Firestore, Storage, Cloud Functions, permissions, notifications, audit logs and business rules have been verified together.
