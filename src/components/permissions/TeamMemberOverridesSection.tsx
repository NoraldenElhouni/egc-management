import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  Trash2,
  UserCog,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import type { PermissionCatalogRow } from "../../types/permissions.types";
import type { TeamMember } from "../../hooks/team/useTeamAssignments";
import {
  useDeleteOrphanedTeamGrants,
  useProjectTeamGrantCounts,
  useSaveTeamMemberGrants,
  useTeamMemberGrants,
} from "../../hooks/permissions/useProjectGrants";
import {
  INHERITED_LAYER_LABELS,
  useProjectInheritedGrants,
} from "../../hooks/permissions/useProjectInheritedGrants";
import PermissionEditor from "./PermissionEditor";
import { InheritedContext } from "./PermissionRow";
import type { GrantDiff } from "./permissionModel";

// =====================================================================
// "Specific people on this project" — layer 1
// =====================================================================
// Guide section 4.6, bottom section. One collapsed row per person, each
// expanding into the same three-state control with the same
// "where it came from" column as the Phase 3 user-override screen.
//
// The distinction the header has to carry: a rule set here goes with the
// PERSON. Someone joining next month does not inherit it. That is the
// whole difference from the section above.
// =====================================================================

interface Props {
  projectId: string;
  catalog: PermissionCatalogRow[];
  team: TeamMember[];
}

/** Distinct people, since someone holding two project roles appears twice. */
interface RosterPerson {
  personId: string;
  fullName: string;
  roleNames: string[];
}

export default function TeamMemberOverridesSection({
  projectId,
  catalog,
  team,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: counts } = useProjectTeamGrantCounts(projectId);
  const deleteOrphans = useDeleteOrphanedTeamGrants();

  const roster = useMemo<RosterPerson[]>(() => {
    const byPerson = new Map<string, RosterPerson>();
    for (const member of team) {
      const entry = byPerson.get(member.personId) ?? {
        personId: member.personId,
        fullName: member.fullName,
        roleNames: [],
      };
      entry.roleNames.push(member.projectRoleName);
      byPerson.set(member.personId, entry);
    }
    return Array.from(byPerson.values()).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "ar"),
    );
  }, [team]);

  // People with overrides on this project who are NOT on its team any
  // more. The resolver already treats these as inert (DECISION 4), so
  // they cannot grant anything — but a stale row that looks like
  // configuration and silently does nothing is worse than no row, so
  // they are surfaced rather than hidden.
  const onTeam = useMemo(
    () => new Set(roster.map((p) => p.personId)),
    [roster],
  );
  const orphans = useMemo(
    () => Object.values(counts ?? {}).filter((c) => !onTeam.has(c.userId)),
    [counts, onTeam],
  );

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="border-b border-gray-200 bg-purple-50/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <UserCog size={17} className="text-purple-600 shrink-0" />
          <h2 className="text-base font-semibold text-gray-900">
            أشخاص محدّدون في هذا المشروع
          </h2>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          يسري على شخص واحد، في هذا المشروع فقط.{" "}
          <strong className="font-semibold">
            ويتغلّب على القاعدة العامة في الأعلى.
          </strong>
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          القاعدة هنا مرتبطة بالشخص لا بالمشروع: من ينضم للفريق لاحقاً لا يرثها.
        </p>
      </header>

      {orphans.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">
                {orphans.length} استثناء لأشخاص لم يعودوا ضمن فريق هذا المشروع.
              </p>
              <p className="text-xs mt-0.5">
                هذه الاستثناءات <strong>لا تمنح أي شيء</strong> — النظام يتجاهل
                أي استثناء لشخص خارج الفريق. تركها لا يشكّل خطراً أمنياً لكنه
                مُربك. احذفها إن كان الشخص لن يعود، أو أعِد إضافته للفريق لتعمل
                من جديد.
              </p>
            </div>
          </div>
          <ul className="space-y-1">
            {orphans.map((orphan) => (
              <li
                key={orphan.userId}
                className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2"
              >
                <span className="text-xs text-gray-700">
                  <span className="font-mono text-[11px] text-gray-500">
                    {orphan.userId.slice(0, 8)}
                  </span>
                  {" — "}
                  {orphan.allow} مسموح، {orphan.deny} ممنوع
                </span>
                <button
                  type="button"
                  disabled={deleteOrphans.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        "حذف كل استثناءات هذا الشخص على هذا المشروع؟ لا يمكن التراجع.",
                      )
                    ) {
                      deleteOrphans.mutate({
                        projectId,
                        userId: orphan.userId,
                      });
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                >
                  <Trash2 size={13} /> حذف
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-3">
        {roster.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            لا يوجد أعضاء في فريق هذا المشروع. أضف أعضاء من تبويب «الفريق» أولاً
            — الاستثناء الفردي يحتاج شخصاً على الفريق ليكون له أثر.
          </p>
        ) : (
          <ul className="space-y-2">
            {roster.map((person) => {
              const isOpen = expanded === person.personId;
              const count = counts?.[person.personId];
              return (
                <li
                  key={person.personId}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : person.personId)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 transition-colors text-right"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {isOpen ? (
                        <ChevronDown size={15} className="text-gray-400" />
                      ) : (
                        <ChevronLeft size={15} className="text-gray-400" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900 truncate">
                          {person.fullName}
                        </span>
                        <span className="block text-[11px] text-gray-500 truncate">
                          {person.roleNames.join("، ")}
                        </span>
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5 shrink-0">
                      {count && count.allow > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                          {count.allow} مسموح
                        </span>
                      )}
                      {count && count.deny > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          {count.deny} ممنوع
                        </span>
                      )}
                      {!count && (
                        <span className="text-[11px] text-gray-400">
                          لا استثناءات
                        </span>
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200 bg-gray-50/50 p-3">
                      <PersonEditor
                        projectId={projectId}
                        person={person}
                        catalog={catalog}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// One expanded person
// ---------------------------------------------------------------------
// Split out so its two queries only run when the row is actually open.
// Fourteen people on a project would otherwise mean twenty-eight
// requests on page load for data nobody is looking at.

function PersonEditor({
  projectId,
  person,
  catalog,
}: {
  projectId: string;
  person: RosterPerson;
  catalog: PermissionCatalogRow[];
}) {
  const { user } = useAuth();
  const { data: grants, isLoading } = useTeamMemberGrants(
    projectId,
    person.personId,
  );
  const { data: inherited } = useProjectInheritedGrants(
    projectId,
    person.personId,
  );
  const saveGrants = useSaveTeamMemberGrants();

  // "What they'd have without an override", per guide 4.6 step 2.
  const inheritedById = useMemo<Record<string, InheritedContext>>(() => {
    const map: Record<string, InheritedContext> = {};
    for (const permission of catalog) {
      const entry = inherited?.[permission.id];
      if (!entry) {
        map[permission.id] = {
          label: "غير ممنوحة",
          sourceLabel: "لا توجد قاعدة في أي مستوى أعلى",
          tone: "none",
        };
        continue;
      }
      map[permission.id] = {
        label: entry.allowed ? "مسموح" : "ممنوع",
        sourceLabel: `${INHERITED_LAYER_LABELS[entry.layer]} (${entry.ownerName})`,
        tone: entry.allowed ? "granted" : "denied",
      };
    }
    return map;
  }, [catalog, inherited]);

  if (isLoading) {
    return (
      <p className="text-xs text-gray-500 py-4 text-center">
        جاري تحميل الاستثناءات...
      </p>
    );
  }

  const handleSave = async (diff: GrantDiff) => {
    await saveGrants.mutateAsync({
      projectId,
      userId: person.personId,
      diff,
      grantedBy: user?.id ?? null,
    });
  };

  return (
    <PermissionEditor
      catalog={catalog}
      savedGrants={grants ?? []}
      subjectPhrase={person.fullName}
      onSave={handleSave}
      saving={saveGrants.isPending}
      inheritedById={inheritedById}
      showNotes
      shape="scopeless"
    />
  );
}
