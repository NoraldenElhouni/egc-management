# `operations/contracts` — Architecture & Code Review

Scope: everything under `src/hooks/operations/contracts/`, `src/components/operations/contracts/`, `src/pages/operations/contracts/`, and `src/components/tables/columns/operations/contracts/` (28 files), plus the shared infra they depend on (`GenericTable`, `formatDate`/`formatCurrency`, RHF+zod forms).

---

## 1. Domain model & flow

The feature implements a construction/procurement pipeline:

```
Project
  └─ Work Request (work_requests)
       ├─ items (work_request_items)          — catalog services or custom line items
       ├─ request_milestones                  — proposed % split, defined at request time
       ├─ attachments
       └─ Bids (contractor_bids)               — submitted by contractors, mode: open|direct
            └─ accept → Contract (contracts)   — created transactionally in AcceptBidDialog
                 ├─ contract_milestones        — copied from request_milestones (equal-split $, see §6.2)
                 │    └─ milestone_reports     — progress reports against a milestone
                 └─ payment_requests           — draws against milestones
```

Route hierarchy (note: the routes directory itself is `src/components/pages/operateions/contracts/*` — misspelled `operateions`, unlike every other correctly-spelled folder in this slice):

- `ContractsRoutes` → `ContractsPage` (project list) → `ContractsProjectPage` (`project/:projectId`) → `ContractDetailsPage` (`project/:projectId/:contractId`) → `ContractDetailRoutes` (milestones/payments)
- `RequestsRoutes` (`project/:projectId/requests/*`) → New/Edit/Details → `BidsListPage` → `BidDetailPage`

---

## 2. Hook architecture

All four hook files (`useContracts.ts`, `useMilestone.ts`, `requests/useRequests.ts`, `requests/bids/useBids.ts`) hand-roll `useState` + `useEffect` (no React Query/SWR, no caching layer). The shape is consistent, but ownership and correctness diverge:

- **`requests/bids/useBids.ts` is a completely empty file.** The hooks actually used by `BidsListPage.tsx` / `BidDetailPage.tsx` — `useBidsByRequest`, `useBidDetail` — live in `requests/useRequests.ts:235` and `:424` instead. The whole `bids/` subfolder is dead scaffolding.
- **Work-request CRUD is split across two files with no single owner.** `useCreateRequest` (create/publish/stop/cancel) lives in `useContracts.ts:207-575`; `useEditRequest`/`useRequest` (edit/fetch) live in `requests/useRequests.ts:84-201`. `useContracts.ts` also carries unrelated catalog/lookup hooks (`Service`, `useServicesBySpecialization`, `useContractors`, `useSpecializations`, lines 11-205), diluting what the file is "about."
- **Missing dependency bug**: `useContracts` (`useContracts.ts:82-104`) reads `projectId` inside its effect but the dependency array is `[]` — contracts never refetch when `projectId` changes without a full remount. The sibling `useWorkRequests` (`requests/useRequests.ts:208-230`) gets this right, depending on `[projectId]` (with a `// ✅ re-runs when projectId changes` comment) — same file-group, two different conventions, one broken.
- **`useRequest` fires its fetch from a `useState` lazy initializer** (`requests/useRequests.ts:125-127`, `useState(() => { if (requestId) fetch(); })`) instead of `useEffect`. It runs once and will not re-run if `requestId` changes on re-render — every other fetch hook in the slice correctly uses `useEffect(..., [id])`.
- **Duplicated push-notification logic**: `useCreateRequest.createRequest` inlines ~75 lines of contractor/token lookup + push-send (`useContracts.ts:346-419`) that is nearly byte-identical to the standalone `notifyRequestUsers` used by `publishRequest` (`useContracts.ts:426-506`) — the same logic exists twice in the same file.
- **Hardcoded magic UUID**: `useSpecializations` filters `role_id === "20606a44-1f4b-4e0a-af58-abc553b70bc0"` (`useContracts.ts:121`) with no named constant.
- **No transactional integrity for multi-step writes.** `useCreateRequest.createRequest` (`useContracts.ts:267-424`) does 3 sequential inserts (request → items → milestones) with no rollback on partial failure — orphan `work_requests` rows are possible. Worse in `AcceptBidDialog.tsx` (used via `bidsColumns.tsx`/`BidDetailPage.tsx`): an 11-step sequential write (percentage lookup → counter increment → expense insert → balance update → bid accept/reject → contract insert → milestone insert), no DB transaction/RPC — a failure past step 4 leaves inconsistent expenses/counters/contracts.

**What's solid**: `useContractDetails` (`useContracts.ts:577-654`) and `useMilestone` (`useMilestone.ts:43-82`) both derive stats via `useMemo`, guard on empty id with an early `return` inside the effect, and share the same `{data, loading, error}` shape. Reuse this template for future detail hooks.

---

## 3. Page / form patterns

- **Rules-of-Hooks violation**: `ContractsProjectPage.tsx:12-28` calls `useParams`, then `if (!projectId) return (...)` at line 15, and only *after that* calls `useContracts(projectId)` / `useWorkRequests(projectId)` at lines 23-28. If this component re-renders with `projectId` becoming undefined without remounting, hook call count changes between renders. Compare with `ContractDetailsPage.tsx:37-60` and `NewPaymentRequestPage.tsx:40` (which has an explicit `// ── all hooks before any early returns ──` comment) — the correct convention exists elsewhere in the same slice.
- **Two ~950-line near-duplicate forms**: `NewWorkRequestForm.tsx` and `EditWorkRequestForm.tsx` are ~95% identical — same `ServicePickerDialog` sub-component duplicated verbatim, same items/milestones/attachments/footer JSX. Both correctly use `react-hook-form` + `zodResolver`, but ~700+ shared lines mean every markup change has to be made twice. `EditWorkRequestForm.tsx:41-45` also redeclares a local `AttachmentDraft` type identical to the shared one in `src/types/global.type.ts:134-138` (already imported correctly by `NewWorkRequestForm.tsx:2-5`).
- **Silent data loss in edit flow**: `useEditRequest.editRequest` (`requests/useRequests.ts:137-198`) updates the request header and replaces `work_request_items`, but **never touches `request_milestones`**. `EditWorkRequestForm.tsx` fully renders a milestones editor (lines 651-782) and submits `values.milestones`, but those edits are silently discarded on save.
- **Form-pattern split within the same feature**: `NewWorkRequestForm`/`EditWorkRequestForm` use `react-hook-form` + `zod` (good). `NewMilestonePage.tsx:24-30`, `NewPaymentRequestPage.tsx:32-38`, `MilestoneReportsPage.tsx:28-36` instead use raw `useState` per field with manual `if (!title || amount <= 0) return` validation and call `supabase.from(...).insert(...)` directly from the page component rather than through a hook.
- **`window.location.reload()` / `navigate(0)` used as a refetch mechanism** — `MilestoneReportsPage.tsx:84`, `ContractRequestDetailsPage.tsx:129,167,245`, `BidsListPage.tsx:32`, `BidDetailPage.tsx:36,216` — instead of calling a proper `refetch`. `useRequest` already exposes one (`requests/useRequests.ts:129`), so the pattern is known but not applied consistently.
- **Unimplemented stubs routed as real pages**: `EditMilestonePage.tsx` (`return <div>EditMilestonePage</div>`) and `ContractPaymentLogPage.tsx` (`return <div>ContractPaymentLogPage</div>`) are wired into `ContractDetailRoutes.tsx:13-22`. Editing a milestone or viewing the payment log currently renders a placeholder div.
- **Dead/orphaned page**: `ContractRequestBidDetailsPage.tsx` is never imported by any route — `RequestsRoutes.tsx:5-15` routes `:requestId/bids/:bidId` to `BidDetailPage`, not this file. It's a leftover stub (`<div>can</div>`) and a candidate for deletion.
- **Buttons with no `onClick`, visually functional but dead**: "إلغاء العقد" (`ContractDetailsPage.tsx:124-127`), "طباعة فاتورة" / "تأكيد الإنجاز" (`MilestonePage.tsx:79-88`), "إغلاق الطلب" (`BidsListPage.tsx:57`).
- **Broken confirmation dialog**: `BidDetailPage.tsx:26-37` `handleDecline` calls `alert("هل أنت متأكد من رفض هذا العرض؟")` then unconditionally proceeds to decline regardless of what's "confirmed" (`alert()` has no return gate). `BidActionsCell.tsx:17-25` implements the same decline action with *zero* confirmation — two different, both-wrong versions of the same action in two files.

---

## 4. Table columns

- Most files export a plain `ColumnDef<T>[]` (`ContractsColumns`, `WorkRequestsColumns`, `MilestonesColumns`, `MilestoneReportsColumns`, `RequestMilestonesColumns`, `WorkRequestItemsColumns`, `PaymentRequestsColumns`) — consistent shape, Arabic headers, `#`/select leading column. Solid convention.
- `bidsColumns.tsx` reasonably breaks the pattern with a factory `getBidsColumns(onRefresh)` (lines 21-113) since it needs an actions callback — but its select-column boilerplate (lines 26-50) is copy-pasted verbatim in `ContractsColumns.tsx:34-60` and `WorkRequestsColumns.tsx:44-69`. Good candidate for a shared `SelectColumn` helper.
- **Inconsistent date formatting**: `ContractsColumns.tsx:116-159` and `WorkRequestsColumns.tsx:132-165` hand-roll `new Date(x).toLocaleDateString("ar-LY")` in three places each, while `milestonesColumns.tsx:58-64` and `milestoneReportsColumns.tsx:48-54` use the shared `formatDate` helper (`src/utils/helpper.ts:37-52`), which also guards against null/invalid dates. The hand-rolled versions duplicate logic that already exists and lose null-safety.
- **Confirmed dead duplicate file**: `requestsMilestonesColumna.tsx` (typo: "Columna") exports `requestsMilestonesColumns: ColumnDef<PaymentRequest>[]` — an exact duplicate of `paymentRequestsColumns.tsx`'s `PaymentRequestsColumns` (same type, same 6 columns, same helpers). Not imported anywhere (confirmed by full-repo grep). Its own header comment even references a *different* "correct" filename (`requestsMilestonesColumns.tsx`), confirming an accidental rename/typo was left behind. Despite the "Milestones" name, it operates on `PaymentRequest`, not milestones — misleading independent of the typo. **Safe to delete.**
- **Misplaced file**: `bidItemsColumns.tsx` (used by `BidDetailPage.tsx:13`) lives one directory above the `contracts/` subfolder that houses every other contracts column file — should move into `columns/operations/contracts/`.

---

## 5. Naming inconsistencies

- `requestsMilestonesColumna.tsx` vs `RequestMilestonesColumns.tsx` — typo + casing + near-duplicate collision (see §4).
- **Casing split** across columns files: PascalCase (`ContractsColumns.tsx`, `RequestMilestonesColumns.tsx`, `WorkRequestsColumns.tsx`) vs camelCase (`bidsColumns.tsx`, `milestoneReportsColumns.tsx`, `milestonesColumns.tsx`, `paymentRequestsColumns.tsx`, `workRequestItemsColumns.tsx`, `requestsMilestonesColumna.tsx`) — no rule governing which gets which.
- **Directory typo**: `src/components/pages/operateions/contracts/*` (should be `operations`) — the routing layer sits under a misspelled folder while `src/pages/operations/contracts/*` and `src/hooks/operations/contracts/*` are spelled correctly.
- **Type casing outlier**: `contractorWithSpecializations` (`src/types/extended.type.ts:108`) starts lowercase, unlike every sibling interface in the same file (`MilestoneReportsWithEmployee`, `ContractDetail`, `RequestBids`, `BidDetail`, all PascalCase).
- **No single home for "request" logic**: `useRequests.ts` (plural) contains both singular (`useRequest`, `useEditRequest`) and plural work-request hooks (`useWorkRequests`, `useWorkRequest`), while `useCreateRequest` — arguably the most central request mutation — lives in `useContracts.ts` instead.

---

## 6. Bugs / correctness issues

1. **Dead/missing status-badge branches** — `ContractDetailsPage.tsx:19-32` handles `"cancelled"`/`"suspended"`, but `ContractDetail.status` (`useContracts.ts:55`) is typed `"active" | "completed" | "on_hold" | "terminated"`. The two statuses that can actually occur — `"on_hold"`, `"terminated"` — have no case and fall to `default: return null`, so contracts in those real states render **no status badge at all**.
2. **Milestone split ignores percentage on accept** — `AcceptBidDialog.tsx:204-223` (used via this slice's bid flow): the UI *displays* each milestone's percentage-weighted amount (`(bid.total_price * m.percentage) / 100`, lines 344-347) but the actual insert uses `bid.total_price / milestones.length` (line 206) — a naive equal split that ignores `percentage`, contradicting what the user reviewed and confirmed before accepting.
3. **`useBids.ts` empty file** — dead scaffolding (§2).
4. **Rules-of-Hooks violation** in `ContractsProjectPage.tsx:12-28` (§3).
5. **Missing `[projectId]` dep in `useContracts`** — stale lists on navigation (§2).
6. **`useEditRequest` silently drops milestone edits** (§3).
7. **Fake confirmation via bare `alert()`** in `BidDetailPage.tsx:26-37` (§3).
8. **Non-functional buttons**: `ContractDetailsPage.tsx:124-127`, `MilestonePage.tsx:79-88` (×2), `BidsListPage.tsx:57`.
9. **`any` escapes**: `err: any` in `NewMilestonePage.tsx:69`, `NewPaymentRequestPage.tsx:149`, `MilestoneReportsPage.tsx:85`; `paymentMethod as any` cast in `NewPaymentRequestPage.tsx:143` instead of typing the field as the real enum union.
10. **Unresolved TODO shipped**: `MilestoneReportsPage.tsx:73` — `entityType: "milestone_report", // ← fix this`.
11. **Mutations bypassing the hook layer**: `NewMilestonePage.tsx:58-67`, `NewPaymentRequestPage.tsx:146-147`, `MilestoneReportsPage.tsx:60-68`, `BidDetailPage.tsx:31-34`, `BidActionsCell.tsx:19-22`, and all of `AcceptBidDialog.tsx` call Supabase directly from components. Only the work-request flow (`useCreateRequest`/`useEditRequest`) centralizes mutations in hooks — milestones/payments/bids don't follow that pattern.
12. **No transaction/rollback for multi-step writes** — `useCreateRequest.createRequest` and `AcceptBidDialog.handleAccept` (§2) — both do 3-11 sequential dependent writes client-side with no atomicity.
13. **Duplicate decline-bid logic**, two different flawed confirmation flows: `BidDetailPage.tsx:26-37` and `BidActionsCell.tsx:17-25`.
14. **Duplicate `AttachmentDraft` type**: `EditWorkRequestForm.tsx:41-45` redefines what `src/types/global.type.ts:134-138` already exports (and what `NewWorkRequestForm.tsx` correctly imports).

---

## 7. What's working well (reuse these patterns)

- **`GenericTable` (`src/components/tables/table.tsx`)** — a solid reusable TanStack Table wrapper with custom `dateRangeFilter`/`numberRangeFilter` (lines 28-56), sorting/filtering/global-filter toggles. Every columns file in this slice plugs into it cleanly — the strongest shared infrastructure the feature relies on.
- **`formatCurrency`/`formatDate` (`src/utils/helpper.ts`)** — null/invalid-safe, locale-aware (LYD, `ar-LY`), used consistently by most pages/columns (just not all, see §4).
- **`useContractDetails` / `useMilestone`** — clean "single detail fetch + derived `useMemo` stats" pattern (`totalPaid`, `totalRemaining`, `completedMilestones`, `daysRemaining`). Good template for future detail hooks.
- **zod + react-hook-form** in `contracts.schema.ts` + `NewWorkRequestForm`/`EditWorkRequestForm` — idiomatic RHF setup (`useFieldArray` for items/milestones, `Controller` for custom selects, `superRefine` for cross-field checks like the 100%-milestone-sum validation). This is the pattern to extend to `NewMilestonePage`/`NewPaymentRequestPage`/`MilestoneReportsPage`, which currently use raw `useState` forms instead.
- **Route composition** (`ContractsRoutes` → `RequestsRoutes`/`ContractDetailRoutes`) cleanly nests React Router routes per sub-domain, keeping each routes file small and focused.

---

## Suggested priority order

1. **Fix the silent milestone-edit data loss** (`useEditRequest`, §3.3) and **the percentage-ignoring accept split** (`AcceptBidDialog`, §6.2) — both are silent-corruption bugs a user could hit today without any error.
2. **Fix the Rules-of-Hooks violation** in `ContractsProjectPage.tsx` and the missing `[projectId]` dependency in `useContracts` — cheap, mechanical fixes.
3. **Delete dead code**: `requestsMilestonesColumna.tsx`, `ContractRequestBidDetailsPage.tsx`, the empty `useBids.ts` (or actually populate it and move `useBidsByRequest`/`useBidDetail` there).
4. **Wire the two stub pages** (`EditMilestonePage`, `ContractPaymentLogPage`) or remove their routes if not yet in scope.
5. **Consolidate the raw-`useState` mutation flows** (milestones/payments/reports) onto the RHF+zod+hook pattern already proven in the work-request forms — this is the biggest structural inconsistency in the slice and the root cause of most of the "bypasses the hook layer" findings.
