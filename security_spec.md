# Security Specification — ANDMoz M&A (Plataforma NutriFamily +)

## 1. Data Invariants
1. **Strict Ownership**: Every document in `/goals`, `/families`, `/multipliers`, and `/activities` MUST carry an immutable `ownerId` equal to the creator's `request.auth.uid`.
2. **Verified Identity**: All writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Path & Key Integrity**: Every document ID must match `^[a-zA-Z0-9_\-]+$` (max 128 chars). Every `create` validates exact required and allowed keys (`hasAll` + `hasOnly`). Every `update` explicitly checks `affectedKeys().hasOnly(...)` inside named action branches.
4. **Temporal Integrity**: `createdAt` is immutable and must equal `request.time` on creation; `updatedAt` must equal `request.time` on creation and update.
5. **Terminal State Locking**: Once an `Activity` reaches `status == 'Validado'` or a `Goal` reaches `status == 'Concluída'`, non-admin updates are blocked unless overridden by `isAdmin()`.
6. **Zero Blanket List Queries**: `allow list` on all domain collections explicitly enforces `resource.data.ownerId == request.auth.uid`.
7. **PII Isolation**: User workspace metadata in `/users/{userId}` does not store email addresses and is only readable/writable by `request.auth.uid == userId`. Family and multiplier records containing beneficiary/contact details are strictly scoped to `resource.data.ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated List**: `list('/families')` with `auth = null`.
2. **Cross-Tenant Read**: `get('/families/fam_1')` where `ownerId = 'user_A'` as `user_B`.
3. **Identity Spoofing on Create**: `create('/goals/goal_1', { ownerId: 'user_A', ... })` authenticated as `user_B`.
4. **Ghost Field / Shadow Update**: `create('/families/fam_1', { ..., isAdminOverride: true })` or `update` adding an unknown field.
5. **Unverified Email Bypass**: `create('/activities/act_1', ...)` with `token.email_verified = false`.
6. **ID Poisoning**: `create('/goals/' + 'a'.repeat(500), ...)` exceeding 128 characters or containing `$`/spaces.
7. **Owner Reassignment**: `update('/multipliers/mult_1', { ownerId: 'user_B', updatedAt: serverTimestamp() })`.
8. **Client Timestamp Forgery**: `create('/goals/goal_1', { ..., createdAt: new Date('2020-01-01') })`.
9. **Value Poisoning**: `update('/families/fam_1', { membersCount: -5, updatedAt: serverTimestamp() })` or `headOfHousehold` > 120 chars.
10. **Terminal State Tampering**: `update('/activities/act_1', { summary: 'Altered', updatedAt: serverTimestamp() })` when `existing.status == 'Validado'`.
11. **Invalid Enum Injection**: `create('/goals/goal_1', { ..., pillar: 'InvalidPillar' })`.
12. **Cross-Tenant List Scraping**: `list('/activities')` queried without `where('ownerId', '==', auth.uid)`.
