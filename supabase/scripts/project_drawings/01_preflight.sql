-- Project drawings: READ-ONLY checks to run on an environment BEFORE
-- applying supabase/migrations/20261020120000_project_drawings.sql.
-- Changes nothing. Every row must say ok = true before you continue.
with checks(check_name, ok, detail) as (
  values
  ('projects.id exists',
   exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'projects' and column_name = 'id'),
   'folders reference projects(id)'),
  ('map_types.id exists',
   exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'map_types' and column_name = 'id'),
   'folders reference map_types(id)'),
  ('users.id exists',
   exists (select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'users' and column_name = 'id'),
   'uploader/status/access columns reference users(id)'),
  ('team_assignments(project_id, person_id) exist',
   (select count(*) = 2 from information_schema.columns
    where table_schema = 'public' and table_name = 'team_assignments'
      and column_name in ('project_id', 'person_id')),
   'folder access only counts while the member is on the project team'),
  ('permission_catalog columns exist',
   (select count(*) = 5 from information_schema.columns
    where table_schema = 'public' and table_name = 'permission_catalog'
      and column_name in ('name', 'area', 'description', 'is_project_scoped', 'is_active')),
   'the migration inserts/activates manage_project_maps'),
  ('permission_catalog accepts area ''Project''',
   exists (select 1 from public.permission_catalog where area = 'Project'),
   'manage_project_maps is created in area Project if missing'),
  ('can_i(text, uuid) exists',
   to_regprocedure('public.can_i(text,uuid)') is not null,
   'managers are resolved through can_i'),
  ('vault is installed',
   to_regclass('vault.decrypted_secrets') is not null,
   'the files service secret is stored in Vault'),
  ('roles anon / authenticated exist',
   (select count(*) = 2 from pg_roles where rolname in ('anon', 'authenticated')),
   'grants and revokes target these roles'),
  ('no clashing objects from elsewhere',
   not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname like 'project\_drawing\_%'
                 and to_regclass('public.project_drawing_folders') is null),
   'project_drawing_* functions should only exist if this migration ran before')
)
select check_name, ok, detail from checks
union all
select 'info: migration already applied?',
       true,
       case when to_regclass('public.project_drawing_folders') is null
            then 'no - first run' else 'yes - re-running is safe (idempotent)' end
union all
select 'info: manage_project_maps',
       true,
       coalesce((select 'exists, is_active = ' || is_active::text
                 from public.permission_catalog where name = 'manage_project_maps'),
                'missing - the migration will create it')
union all
select 'info: files_service_secret in Vault',
       true,
       case when exists (select 1 from vault.secrets where name = 'files_service_secret')
            then 'already created' else 'not created yet - see README step 3' end;
