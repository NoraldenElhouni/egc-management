# admin-users

The only place the desktop app's account management uses the service-role key
(create / delete / find a login, reset a password). The desktop sends the
signed-in person's own token; this function checks who they are and what they
may do (`can_i`), then acts. No key is shipped in the app any more.

| action | permission |
|---|---|
| `create_user` `kind: employee` | `create_employee` (any company role, not Contractor/Vendor/Client) |
| `create_user` `kind: contractor` / `vendor` / `client` | `manage_contractors` / `manage_vendors` / `manage_clients` (role and party type are forced here) |
| `delete_user` | `manage_contractors` or `manage_vendors` by the login's party type; only a login created in the last 15 minutes (the "linking failed, undo" paths) |
| `find_user` / `reset_password` | `reset_user_password` |

Environment: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are set by Supabase on every project; nothing to configure.

Deploy (JWT verification stays ON):

```bash
cd egc-management
supabase functions deploy admin-users --project-ref bhcprgzqhvnymthgtvtw
```

Called from the desktop through `src/lib/adminApi.ts`.
