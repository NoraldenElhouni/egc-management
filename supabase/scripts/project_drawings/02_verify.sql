-- Project drawings: READ-ONLY checks to run AFTER the migration and the
-- Vault secret. Changes nothing. Every row must say ok = true.
with checks(check_name, ok, detail) as (
  values
  ('4 tables exist with RLS on',
   (select count(*) = 4 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
      and c.relname in ('project_drawing_folders', 'project_drawing_versions',
                        'project_drawing_notices', 'project_drawing_access')),
   'project_drawing_{folders,versions,notices,access}'),
  ('13 functions exist',
   (select count(*) = 13 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'project\_drawing\_%'),
   'helpers + RPCs'),
  ('5 policies exist',
   (select count(*) = 5 from pg_policies
    where schemaname = 'public' and tablename like 'project\_drawing\_%'),
   'select policies + folder insert'),
  ('anon cannot run any of them',
   not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'public' and p.proname like 'project\_drawing\_%'
                 and has_function_privilege('anon', p.oid, 'execute')),
   'no access without a login'),
  ('anon cannot read the tables',
   not has_table_privilege('anon', 'public.project_drawing_folders', 'select'),
   'no access without a login'),
  ('manage_project_maps is active and project-scoped',
   exists (select 1 from public.permission_catalog
           where name = 'manage_project_maps' and is_active and is_project_scoped),
   'inactive permissions are ignored by the resolver'),
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
