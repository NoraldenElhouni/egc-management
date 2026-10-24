-- Project drawings: READ-ONLY checks to run AFTER the migration and the
-- Vault secret. Changes nothing. Every row must say ok = true.
with checks(check_name, ok, detail) as (
  values
  ('4 tables exist with RLS on',
   (select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'drawings' and c.relkind = 'r' and c.relrowsecurity
      and c.relname in ('folders', 'versions', 'notices', 'access')),
   'drawings.{folders,versions,notices,access}'),
  ('13 functions exist',
   (select count(*) = 13 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'drawings'),
   'helpers + RPCs in schema drawings'),
  ('5 policies exist',
   (select count(*) = 5 from pg_policies
    where schemaname = 'drawings'),
   'select policies + folder insert'),
  ('anon cannot run any of them',
   not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'drawings'
                 and has_function_privilege('anon', p.oid, 'execute')),
   'no access without a login'),
  ('anon cannot use the schema',
   not has_schema_privilege('anon', 'drawings', 'usage'),
   'no access without a login'),
  ('authenticated can use the schema',
   has_schema_privilege('authenticated', 'drawings', 'usage'),
   'the app and the files service act as authenticated'),
  ('manage_project_maps is active and project-scoped',
   exists (select 1 from public.permission_catalog
           where name = 'manage_project_maps' and is_active and is_project_scoped),
   'inactive permissions are ignored by the resolver'),
  ('no leftover public.project_drawing_* tables',
   to_regclass('public.project_drawing_folders') is null,
   'the early dev-only layout must be gone'),
  ('files_service_secret exists in Vault',
   exists (select 1 from vault.secrets where name = 'files_service_secret'),
   'without it every upload/download/delete is refused')
)
select check_name, ok, detail from checks
union all
select 'info: who holds manage_project_maps',
       true,
       coalesce((select string_agg(r.name || ' (' || g.scope || ')', ', ')
                 from public.role_permission_grants g
                 join public.roles r on r.id = g.role_id
                 join public.permission_catalog p on p.id = g.permission_id
                 where p.name = 'manage_project_maps' and g.allowed),
                'no role yet - assign it in Settings > Permissions');
