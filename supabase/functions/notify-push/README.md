# notify-push

Delivers the database's queued pushes to Expo. Called only by the database
(`notify.wake_push()` after a save, and the every-minute `notify-push-sweep`
cron job) with the shared secret in `x-notify-secret`.

Secrets (Edge Function secrets in the Supabase dashboard):

| Secret | Required | What |
|---|---|---|
| `NOTIFY_PUSH_SECRET` | yes | the same value as the Vault secret `notify_push_secret` |
| `EXPO_ACCESS_TOKEN` | no | sent to Expo; required once "Enhanced push security" is on |
| `EXPO_ACCESS_TOKEN_COMPANY_RN` / `_CLIENT_RN` | no | per-app token if the Expo projects are under different accounts |

Deploy with JWT verification **off** (the caller is the database):

```bash
supabase functions deploy notify-push --no-verify-jwt
```

Design: `plans/notification-system/architecture.md`, `decisions.md` §2.1, C22.
