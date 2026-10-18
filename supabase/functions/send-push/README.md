# send-push

Source of the deployed `send-push` Edge Function (project `bhcprgzqhvnymthgtvtw`).
Before 2026-10-18 the source lived only in Supabase.

Deploy from `egc-management/` with JWT verification on:

```bash
supabase functions deploy send-push
```

Phase 0 hardening and its reasons: `plans/notification-system/decisions.md` §2.1.
It is replaced by `notify-push` in notification Phase 2.
