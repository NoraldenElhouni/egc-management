import { useState } from "react";
import { useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  useJobRole,
  useRoleHolders,
} from "../../../hooks/permissions/useJobRoles";
import { usePermissionCatalog } from "../../../hooks/permissions/usePermissionCatalog";
import { useGrants, useSaveGrants } from "../../../hooks/permissions/useGrants";
import {
  ImpactPreview,
  useRoleImpactPreview,
} from "../../../hooks/permissions/useRoleImpactPreview";
import PermissionEditor from "../../../components/permissions/PermissionEditor";
import RoleImpactPreview from "../../../components/permissions/RoleImpactPreview";
import BackButton from "../../../components/ui/BackButton";
import LoadingPage from "../../../components/ui/LoadingPage";
import ErrorPage from "../../../components/ui/errorPage";

// =====================================================================
// Screen 2, detail view — implementation guide section 4.2.
// Holders count + the same permissions editor the department screen
// uses, writing to role_permission_grants.
// =====================================================================

export default function RolePermissionsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roleId = id ?? "";
  const { user } = useAuth();

  const { data: role, isLoading, error } = useJobRole(roleId);
  const { data: holders } = useRoleHolders(roleId);
  const { data: catalog, isLoading: catalogLoading } = usePermissionCatalog();
  const { data: grants, isLoading: grantsLoading } = useGrants("role", roleId);
  const saveGrants = useSaveGrants();
  const impact = useRoleImpactPreview();

  const [preview, setPreview] = useState<ImpactPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  if (isLoading) return <LoadingPage label="جاري تحميل الدور..." />;
  if (error || !role)
    return (
      <ErrorPage
        error={error instanceof Error ? error.message : "الدور غير موجود"}
        label="خطأ في تحميل الدور"
      />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <BackButton />

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {role.name}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                الصلاحيات الأساسية لهذا الدور.
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Users size={15} />
              {role.holder_count} شخص
            </span>
          </div>

          <p className="text-[11px] text-gray-500 mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            صلاحيات الدور يجب أن تكون صحيحة لكل من يشغل هذه الوظيفة. إن كانت
            صحيحة لبعضهم فقط، استخدم قسماً أو استثناءً فردياً بدلاً من ذلك.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          {catalogLoading || grantsLoading ? (
            <LoadingPage label="جاري تحميل الصلاحيات..." />
          ) : (
            <PermissionEditor
              catalog={catalog ?? []}
              savedGrants={grants ?? []}
              subjectPhrase={`أي شخص يشغل دور ${role.name}`}
              saving={saveGrants.isPending}
              onConfirmOpen={(diff) => {
                // Computed when the dialog opens rather than on every
                // keystroke — it costs one effective_permissions() call
                // per holder, which is up to 34 round trips.
                setPreview(null);
                setPreviewError(null);
                impact
                  .mutateAsync({
                    catalog: catalog ?? [],
                    holders: holders ?? [],
                    diff,
                  })
                  .then(setPreview)
                  .catch((err: unknown) =>
                    setPreviewError(
                      err instanceof Error ? err.message : "خطأ غير معروف",
                    ),
                  );
              }}
              renderConfirmExtra={() => (
                <RoleImpactPreview
                  preview={preview}
                  loading={impact.isPending}
                  error={previewError}
                />
              )}
              onSave={async (diff) => {
                await saveGrants.mutateAsync({
                  layer: "role",
                  ownerId: roleId,
                  diff,
                  grantedBy: user?.id ?? null,
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
