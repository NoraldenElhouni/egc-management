# Project drawings: production rollout

The feature needs three things in this order:

1. The DB migration.
2. The Vault secret.
3. The files service on the EGC server.

After those, release the app version that contains the feature.

**The migration only adds:**
- 4 new tables
- 13 functions
- their RLS policies

**It deletes, drops or rewrites nothing that already exists.** The single change to existing data is switching on the `manage_project_maps` row in `permission_catalog` (`is_active = true`). It runs as one transaction, so it either applies fully or not at all. It is idempotent, so running it twice is harmless.

**It grants `manage_project_maps` to nobody.** After the rollout, assign it in the app under Settings › Permissions (to a role, a department, a user or a project member). Until then:
- nobody can add map types to a project;
- only people given folder access by a manager see any drawings.

| File | What it does | Changes data? |
|---|---|---|
| `supabase/migrations/20261020120000_project_drawings.sql` | the migration | adds only |
| `01_preflight.sql` | checks the DB has everything the migration needs | no (read-only) |
| `02_verify.sql` | checks the result | no (read-only) |
| `03_rollback.sql` | removes the feature's objects again | deletes drawings data only |

## Where to run it

Supabase dashboard → the **production** project (`bhcprgzqhvnymthgtvtw`) → **SQL Editor** → New query. Paste the whole file and click **Run**.

Each step below is one paste.

## When

- **Before** shipping an app build that contains the drawings page. Older app versions ignore the new tables, so the DB can safely go first.
- Preferably at a quiet time. The migration takes a second or two. While it adds its foreign keys, it briefly blocks writes to `projects`, `map_types` and `users`; reads are never blocked.

## Steps

### 0. Backup

Supabase dashboard → Database → Backups. Confirm there is a recent daily backup, or create a manual dump. Nothing in this migration should need it.

### 1. Pre-check (read-only)

Run `01_preflight.sql`.
- Every row must show `ok = true`.
- The `info:` rows tell you whether it already ran and whether the secret exists.
- If any check is `false`, **stop**: production differs from what the migration expects.

### 2. Migration

Run `supabase/migrations/20261020120000_project_drawings.sql`. It should finish with "Success. No rows returned".

### 3. Vault secret (once per environment)

Generate a long random value on your machine:

```bash
openssl rand -hex 32
```

Then run this in the SQL editor with that value:

```sql
select vault.create_secret('<the value>', 'files_service_secret');
```

- Keep the value. It goes into the files service's `.env` as `FILES_SERVICE_SECRET` (see the [files-service-egc](https://github.com/Nick-800/files-service-egc) README).
- Use a **different** value from the dev one.
- Don't paste it in chats or commit it.

### 4. Verify (read-only)

Run `02_verify.sql`. Every row must show `ok = true`. The last row lists who holds `manage_project_maps` (nobody yet).

### 5. Files service

The service is its own repo, [files-service-egc](https://github.com/Nick-800/files-service-egc). It deploys itself through GitHub Actions; its README has the one-time server setup. Deploy it to the EGC server, behind `files.engroup.ly`. Its `.env` needs:
- the prod Supabase URL
- the prod anon key
- the secret from step 3

The app uses `https://files.engroup.ly` by default. Set `VITE_FILES_API_URL` at build time only if you use a different address.

### 6. Permissions

In the app (Settings › Permissions), grant `manage_project_maps` to whoever should manage project drawings.

## Rolling back

Take a backup first, then run `03_rollback.sql`.
- It drops only the drawings tables and functions, and switches `manage_project_maps` back off.
- It deletes the drawings records. The files on the EGC server stay until you remove them yourself.
- Everything else in the database is untouched.

## Tested on dev (`efldlwxgttlqkydvkfzt`)

- The pre-check passes.
- The migration applies and re-applies cleanly.
- The post-check passes.
- The rollback was dry-run inside a rolled-back transaction: it removed exactly the new objects and left the rest in place.
