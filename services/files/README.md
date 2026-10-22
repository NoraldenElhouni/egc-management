# EGC files service

Keeps the **project drawing files** (Operations › الخرائط) on the EGC server instead of Supabase Storage.

The service holds **no Supabase admin key** and makes **no permission decisions** of its own:

- Every request carries the user's Supabase access token (`Authorization: Bearer …`).
- The service forwards that token to the `project_drawing_*` RPCs, so the database decides who may upload, download or delete.
- Every call also sends the `x-files-secret` header. The RPCs that register, reveal or delete a file only accept calls that carry it, which keeps users from registering a file path themselves.

Schema, RLS and RPCs live in `supabase/migrations/20261020120000_project_drawings.sql`.

## Endpoints

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | liveness check |
| POST | `/drawings/folders/:folderId/versions?notify=<id>,<id>` | multipart upload with one field, `file`. Creates the next version and marks the listed folders as "must comply". |
| GET | `/drawings/versions/:versionId/file` | download one version |
| DELETE | `/drawings/versions/:versionId` | delete one version and its file |
| DELETE | `/drawings/folders/:folderId` | delete a folder with all its versions and files |

- Errors come back as `{ "message": "<Arabic text>" }` with status 400, 401, 403, 404, 413 or 5xx.
- Files are stored at `<STORAGE_ROOT>/drawings/<project>/<folder>/<uuid>.<ext>`.

## Running locally (against the dev Supabase copy)

```bash
cd services/files
cp .env.example .env     # fill in the dev project URL + anon key + secret
npm install
npm run dev              # http://localhost:8002
```

The app finds the service through `VITE_FILES_API_URL` in the root `.env` (`http://localhost:8002` for dev).

**One-time setup per Supabase project.** Run this in the SQL editor, using the same value as `FILES_SERVICE_SECRET`:

```sql
select vault.create_secret('<FILES_SERVICE_SECRET>', 'files_service_secret');
```

## Production (EGC server, files.engroup.ly)

The layout mirrors `/opt/pdf-service`:

```
/opt/files-service/
  releases/<timestamp>/   # a copy of this folder
  current -> releases/<timestamp>
  shared/.env             # production values (prod Supabase URL + anon key + secret), mode 600
  shared/storage/         # the files (BACK THIS UP)
```

**Deploy:**

```bash
cd /opt/files-service/current
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
curl -fsS http://127.0.0.1:8002/health
```

**Nginx (aaPanel site `files.engroup.ly`):** reverse proxy to `http://127.0.0.1:8002` with Let's Encrypt, plus:

```
client_max_body_size 110m;
proxy_request_buffering off;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

The DNS A record `files.engroup.ly → 217.76.51.227` has to exist before the certificate can be issued.
