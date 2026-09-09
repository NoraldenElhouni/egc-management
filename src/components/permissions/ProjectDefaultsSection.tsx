import { Users2 } from "lucide-react";
import type { PermissionCatalogRow } from "../../types/permissions.types";
import PermissionEditor from "./PermissionEditor";
import type { ExistingGrant, GrantDiff } from "./permissionModel";

// =====================================================================
// "Everyone on this project" — layer 2, project_permission_defaults
// =====================================================================
// Guide section 4.6, top section.
//
// The subtitle is not decoration. The single property that distinguishes
// this layer from configuring N people individually is that it applies
// to team members who do not exist yet, and an admin who does not
// realise that will reach for the wrong section every time.
// =====================================================================

interface Props {
  catalog: PermissionCatalogRow[];
  savedGrants: ExistingGrant[];
  teamSize: number;
  onSave: (diff: GrantDiff) => Promise<void>;
  saving: boolean;
}

export default function ProjectDefaultsSection({
  catalog,
  savedGrants,
  teamSize,
  onSave,
  saving,
}: Props) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="border-b border-gray-200 bg-blue-50/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users2 size={17} className="text-blue-600 shrink-0" />
          <h2 className="text-base font-semibold text-gray-900">
            كل من يعمل على هذا المشروع
          </h2>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          يسري على جميع أعضاء الفريق الحاليين{" "}
          <strong className="font-semibold">ومن يُضاف لاحقاً</strong> — تلقائياً
          ودون أي خطوة إضافية.
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          استخدمها للقواعد النابعة من طبيعة المشروع نفسه: اتفاقيات العميل،
          متطلبات جهة حكومية، السرّية. أما القواعد النابعة من وضع شخص بعينه
          فمكانها القسم الأسفل.
        </p>
        <p className="text-[11px] text-gray-400 mt-2">
          عدد أعضاء الفريق حالياً: {teamSize}. أي استثناء لشخص محدد في الأسفل
          يتغلّب على ما يُضبط هنا.
        </p>
      </header>

      <div className="p-4">
        <PermissionEditor
          catalog={catalog}
          savedGrants={savedGrants}
          subjectPhrase="أي شخص في فريق هذا المشروع"
          onSave={onSave}
          saving={saving}
          shape="scopeless"
        />
      </div>
    </section>
  );
}
