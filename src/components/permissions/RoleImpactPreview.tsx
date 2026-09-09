import { AlertTriangle, Users } from "lucide-react";
import type { ImpactPreview } from "../../hooks/permissions/useRoleImpactPreview";

// =====================================================================
// The impact preview shown inside the role screen's confirm dialog.
// Implementation guide section 4.2 step 5.
// =====================================================================

interface Props {
  preview: ImpactPreview | null;
  loading: boolean;
  error: string | null;
}

const EFFECT_LABELS: Record<string, string> = {
  grant: "منح",
  deny: "منع صريح",
  clear: "إزالة القاعدة",
};

export default function RoleImpactPreview({ preview, loading, error }: Props) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
        جاري حساب أثر التغيير...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm text-red-700">
        تعذر حساب أثر التغيير: {error}
      </div>
    );
  }

  if (!preview || preview.perPermission.length === 0) return null;

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-medium text-blue-900">
        <Users size={15} />
        هذا التغيير يخص {preview.holderCount} شخصاً يشغلون هذا الدور.
      </p>

      <ul className="space-y-1.5">
        {preview.perPermission.map((impact) => (
          <li
            key={impact.permissionId}
            className="text-xs text-blue-900 bg-white/70 border border-blue-100 rounded px-2 py-1.5"
          >
            <span className="font-medium">
              {EFFECT_LABELS[impact.effect]}: {impact.permissionLabel}
            </span>
            <span className="block mt-0.5 text-blue-800">
              {impact.willGain > 0 && <>{impact.willGain} سيحصلون عليها. </>}
              {impact.willLose > 0 && <>{impact.willLose} سيفقدونها. </>}
              {impact.alreadyMatching > 0 && (
                <>{impact.alreadyMatching} لن يتغير وضعهم. </>
              )}
              {impact.unaffectedBySpecificRule > 0 && (
                <>
                  {impact.unaffectedBySpecificRule} لديهم قاعدة أكثر تحديداً
                  (استثناء فردي أو قسم) ولن يتأثروا.
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      {preview.hasProjectScoped && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            بعض هذه الصلاحيات مرتبطة بمشروع. النتيجة الفعلية تعتمد أيضاً على
            نطاق التطبيق وعلى المشاريع التي يكون كل شخص عضواً في فريقها، وقد
            تُلغى على مستوى مشروع بعينه لاحقاً. الأرقام أعلاه دقيقة للصلاحيات
            العامة، وحد أقصى تقريبي للصلاحيات المرتبطة بمشروع.
          </span>
        </p>
      )}
    </div>
  );
}
