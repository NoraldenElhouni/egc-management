# Contracts Refactor — What Happened

## 1. Why
The old flow (work request → bid → accept → contract) was replaced with a new one you specified: **round → quotes → compare → award → milestones → payments**, built on the BOQ (types → zones → works → items) instead of a services catalog.

## 2. Steps taken

1. **Reviewed the existing code** under `operations/contracts` (hooks, pages, components, table columns) to see what existed and how it was wired.
2. **Got the new DB schema** from you (`contracts.*` tables: rounds, quotes, contracts, milestones, request_payments, etc.) and confirmed `contracts.payments`/`payments_penalties` were out of scope.
3. **Wrote a plan** mapping every old file to its new equivalent, and got your sign-off on 3 open questions:
   - Expense-linking on payments → skipped for now (`expense_id` stays null).
   - Quote comparison → lives on the round page, not a separate route.
   - Milestones → created at award time; only title/description/due-date editable after.
4. **Found a schema constraint mid-build**: Supabase can't join across schemas (e.g. `contracts.contracts` → `public.contractors`). Fixed by adding one helper (`fetchByIds`) that looks up names separately and merges them in — used everywhere instead of broken `.select("*, contractors(...)")` joins.
5. **Built the hooks myself** (the data layer — highest risk of bugs), then **split the UI work across two background agents** running in parallel:
   - Agent A: rounds, quotes, compare, award screens.
   - Agent B: contract detail, milestones, payments screens.
6. **Wired the routes** (`/requests/` → `/rounds/`, `/bids/` → `/quotes/`), deleted the old files, and ran a full grep for leftover references — none found.
7. **Ran a full TypeScript check.** Fixed 4 real type errors in the new code. The ~25 remaining errors are all in 10 files this refactor never touched (finance reports, permissions, etc.) — pre-existing, confirmed via `git status`.

## 3. What broke / needs a decision
- One **unrelated** contractor-profile page still links to the old `/requests/.../bids/...` routes, which no longer exist. It still compiles (kept its old types on purpose) but its links will 404. Not fixed — wasn't in scope.
- One `// TODO` left in `AwardQuoteDialog`: couldn't verify from here whether the `award_quote` RPC sets `rounds.status = 'awarded'` on its own.

## 4. What's left for you
No automated tests exist for this feature, so verify by hand: create a round → add BOQ items → add 2 quotes → compare → award → check the contract/milestones → raise a multi-milestone payment request.
