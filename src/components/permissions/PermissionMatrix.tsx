import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";
import type { PermissionCatalogRow } from "../../types/permissions.types";
import PermissionRow, { InheritedContext } from "./PermissionRow";
import {
  AREA_LABELS,
  AREA_ORDER,
  DraftMap,
  EMPTY_DRAFT,
  GrantDraft,
  ValidationProblem,
} from "./permissionModel";

// =====================================================================
// The shared three-state permission control.
// =====================================================================
// Used by all three Phase 3 screens (departments, roles, user
// overrides) and intended for Phase 6's two screens as well. It owns
// layout, grouping, search and the per-area summary; it owns no data
// fetching and no saving — the screen above it does that, which is what
// keeps it reusable.
// =====================================================================

interface PermissionMatrixProps {
  catalog: PermissionCatalogRow[];
  drafts: DraftMap;
  onChange: (permissionId: string, next: GrantDraft) => void;
  /** Screen 3: read-only "what they have and where it came from". */
  inheritedById?: Record<string, InheritedContext>;
  /** Screen 3: per-permission reason field. */
  showNotes?: boolean;
  problems?: ValidationProblem[];
  disabled?: boolean;
  /** False on Phase 6's two project layers — see PermissionRow. */
  showScope?: boolean;
}

export default function PermissionMatrix({
  catalog,
  drafts,
  onChange,
  inheritedById,
  showNotes = false,
  problems = [],
  disabled = false,
  showScope = true,
}: PermissionMatrixProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const problemById = useMemo(
    () => new Map(problems.map((p) => [p.permissionId, p.message])),
    [problems],
  );

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const match = (p: PermissionCatalogRow) =>
      term === "" ||
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term);

    return AREA_ORDER.map((area) => ({
      area,
      permissions: catalog
        .filter((p) => p.area === area && match(p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((group) => group.permissions.length > 0);
  }, [catalog, search]);

  const countFor = (permissions: PermissionCatalogRow[]) => {
    let allow = 0;
    let deny = 0;
    for (const p of permissions) {
      const state = (drafts[p.id] ?? EMPTY_DRAFT).state;
      if (state === "allow") allow += 1;
      if (state === "deny") deny += 1;
    }
    return { allow, deny };
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400"
        />
        <input
          type="text"
          dir="rtl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في الصلاحيات..."
          className="w-full border border-gray-200 rounded-lg py-2 pr-9 pl-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {grouped.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">
          لا توجد صلاحيات مطابقة للبحث.
        </p>
      )}

      {grouped.map(({ area, permissions }) => {
        const isCollapsed = collapsed[area] ?? false;
        const { allow, deny } = countFor(permissions);

        return (
          <div
            key={area}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white"
          >
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [area]: !isCollapsed }))
              }
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                {isCollapsed ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {AREA_LABELS[area]}
                <span className="text-xs font-normal text-gray-500">
                  ({permissions.length})
                </span>
              </span>
              <span className="flex items-center gap-2 text-[11px]">
                {allow > 0 && (
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">
                    {allow} مسموح
                  </span>
                )}
                {deny > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">
                    {deny} ممنوع
                  </span>
                )}
              </span>
            </button>

            {!isCollapsed && (
              <div className="p-3 space-y-2">
                {permissions.map((permission) => (
                  <PermissionRow
                    key={permission.id}
                    permission={permission}
                    draft={drafts[permission.id] ?? EMPTY_DRAFT}
                    onChange={(next) => onChange(permission.id, next)}
                    inherited={inheritedById?.[permission.id]}
                    showNote={showNotes}
                    errorMessage={problemById.get(permission.id)}
                    disabled={disabled}
                    showScope={showScope}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
