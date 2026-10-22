-- Project drawings: UNDO the migration. Only for backing out the feature.
-- !! This deletes every drawing folder, version record, notice and access
-- !! row. It touches nothing that existed before the migration. Files on
-- !! the EGC server are NOT deleted; remove them separately if wanted.
-- Take a backup first.
begin;

drop function if exists public.project_drawing_delete_folder(uuid);
drop function if exists public.project_drawing_delete_version(uuid);
drop function if exists public.project_drawing_file_for_download(uuid);
drop function if exists public.project_drawing_add_version(uuid, text, text, text, bigint, uuid[]);
drop function if exists public.project_drawing_set_access(uuid, jsonb);
drop function if exists public.project_drawing_mark_complied(uuid);
drop function if exists public.project_drawing_set_status(uuid, text, text);
drop function if exists public.project_drawing_my_caps(uuid);

drop table if exists public.project_drawing_access;
drop table if exists public.project_drawing_notices;
drop table if exists public.project_drawing_versions;
drop table if exists public.project_drawing_folders;

drop function if exists public.project_drawing_assert_files_service();
drop function if exists public.project_drawing_is_participant(uuid);
drop function if exists public.project_drawing_can(uuid, text);
drop function if exists public.project_drawing_on_team(uuid);
drop function if exists public.project_drawing_is_manager(uuid);

-- Put the catalog entry back the way it was before (inactive).
update public.permission_catalog set is_active = false where name = 'manage_project_maps';

-- Vault secret (optional):
-- delete from vault.secrets where name = 'files_service_secret';

commit;
