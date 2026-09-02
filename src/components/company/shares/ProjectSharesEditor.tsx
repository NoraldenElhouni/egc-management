import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Landmark, Trash2, UserRound } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  DistributionShare,
  ProjectShareSummary,
  useDistributionCandidates,
  useRemoveProjectShare,
  useSetProjectHouseShares,
  useSetProjectShare,
} from "../../../hooks/company/useProjectDistributions";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import Button from "../../ui/Button";

// =====================================================================
// The distribution editor — implementation guide section 4.5.
// =====================================================================
// NEW component. The existing editor (EmployeeDistributionEditForm) is
// untouched and still reachable through the distribute wizard.
//
// WHAT IS DELIBERATELY ABSENT
//   - No project role field. A share is project + person + percentage.
//   - No team membership anywhere: not shown, not required, not implied.
//   - No link to the Team screen. The guide is explicit (section 4.5):
//     do not put "…and add them to the team" on this screen, just as the
//     Team screen must not offer "…and set their percentage".
//
// WHAT IS DELIBERATELY PRESENT
//   - All THREE parts of the equation. Showing only the people rows and
//     a total of 65% would look broken when it is correct.
//   - A soft warning when the parts do not sum to 100. Never a block —
//     ten live projects sum to 95 in what looks like a deliberate
//     pattern, and blocking would make them uneditable.
// =====================================================================

interface Props {
  summary: ProjectShareSummary;
  shares: DistributionShare[];
}

const TOLERANCE = 0.01;

export default function ProjectSharesEditor({ summary, shares }: Props) {
  const { user } = useAuth();
  const { data: candidates } = useDistributionCandidates();
  const setShare = useSetProjectShare();
  const removeShare = useRemoveProjectShare();
  const setHouse = useSetProjectHouseShares();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [bankDraft, setBankDraft] = useState(String(summary.bankPercentage));
  const [companyDraft, setCompanyDraft] = useState(
    String(summary.companyPercentage),
  );
  const [newPersonId, setNewPersonId] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setBankDraft(String(summary.bankPercentage));
    setCompanyDraft(String(summary.companyPercentage));
    setDrafts({});
  }, [summary.bankPercentage, summary.companyPercentage, summary.projectId]);

  // Live total, using whatever is currently typed rather than what is
  // saved, so the admin sees the consequence before committing.
  const liveTotal = useMemo(() => {
    const bank = Number(bankDraft) || 0;
    const company = Number(companyDraft) || 0;
    const people = shares.reduce((sum, share) => {
      const draft = drafts[share.personId];
      const value = draft === undefined ? share.percentage : Number(draft) || 0;
      return sum + value;
    }, 0);
    const pending = Number(newPercentage) || 0;
    return {
      bank,
      company,
      people: people + pending,
      grand: bank + company + people + pending,
    };
  }, [bankDraft, companyDraft, shares, drafts, newPercentage]);

  const balances = Math.abs(liveTotal.grand - 100) <= TOLERANCE;

  const alreadyHasShare = useMemo(
    () => new Set(shares.map((s) => s.personId)),
    [shares],
  );

  const candidateOptions = useMemo(
    () =>
      (candidates ?? [])
        .filter((c) => !alreadyHasShare.has(c.id))
        .map((c) => ({ label: c.fullName, value: c.id })),
    [candidates, alreadyHasShare],
  );

  const run = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ التغيير");
    } finally {
      setBusyId(null);
    }
  };

  const saveShare = (share: DistributionShare) => {
    const raw = drafts[share.personId];
    if (raw === undefined) return;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setError("النسبة يجب أن تكون رقماً بين 0 و 100.");
      return;
    }
    return run(share.personId, async () => {
      await setShare.mutateAsync({
        projectId: summary.projectId,
        personId: share.personId,
        percentage: value,
        updatedBy: user?.id ?? null,
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[share.personId];
        return next;
      });
    });
  };

  const addShare = () => {
    const value = Number(newPercentage);
    if (!newPersonId) {
      setError("اختر شخصاً أولاً.");
      return;
    }
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setError("النسبة يجب أن تكون رقماً بين 0 و 100.");
      return;
    }
    return run("new", async () => {
      await setShare.mutateAsync({
        projectId: summary.projectId,
        personId: newPersonId,
        percentage: value,
        updatedBy: user?.id ?? null,
      });
      setNewPersonId("");
      setNewPercentage("");
    });
  };

  const saveHouse = () =>
    run("house", () =>
      setHouse.mutateAsync({
        projectId: summary.projectId,
        bankPercentage: Number(bankDraft) || 0,
        companyPercentage: Number(companyDraft) || 0,
      }),
    );

  const houseDirty =
    Number(bankDraft) !== summary.bankPercentage ||
    Number(companyDraft) !== summary.companyPercentage;

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ---- The equation, all three parts ---- */}
      <div
        className={`rounded-xl border p-4 ${
          balances
            ? "border-gray-200 bg-white"
            : "border-amber-300 bg-amber-50"
        }`}
      >
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          مجموع نسب المشروع
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Landmark size={13} className="text-gray-400" />
              البنك / الاحتياطي
            </span>
            <input
              type="number"
              step="0.01"
              dir="ltr"
              value={bankDraft}
              onChange={(e) => setBankDraft(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <Building2 size={13} className="text-gray-400" />
              الشركة
            </span>
            <input
              type="number"
              step="0.01"
              dir="ltr"
              value={companyDraft}
              onChange={(e) => setCompanyDraft(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">
              مجموع الأشخاص ({shares.length})
            </span>
            <span className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md" dir="ltr">
              {liveTotal.people.toFixed(2)}%
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600">المجموع الكلي</span>
            <span
              className={`px-2 py-1.5 text-sm font-semibold rounded-md border ${
                balances
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-amber-100 border-amber-300 text-amber-800"
              }`}
              dir="ltr"
            >
              {liveTotal.grand.toFixed(2)}%
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mt-2">
          البنك + الشركة + مجموع الأشخاص = 100%. نسب الأشخاص وحدها لا تساوي
          100% — هذا صحيح وليس خطأ.
        </p>

        {!balances && (
          <p className="flex items-start gap-1.5 text-xs text-amber-800 mt-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            المجموع {liveTotal.grand.toFixed(2)}% وليس 100%. يمكنك الحفظ على أي
            حال — بعض المشاريع مضبوطة على هذا النحو عن قصد.
          </p>
        )}

        {houseDirty && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="primary"
              size="xs"
              loading={busyId === "house"}
              onClick={saveHouse}
            >
              حفظ نسب البنك والشركة
            </Button>
          </div>
        )}
      </div>

      {/* ---- People ---- */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800">
            نسب الأشخاص
          </h3>
        </div>

        {shares.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            لا توجد نسب مسجّلة لهذا المشروع.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shares.map((share) => {
              const draft = drafts[share.personId];
              const dirty =
                draft !== undefined && Number(draft) !== share.percentage;
              return (
                <li
                  key={share.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="flex items-center gap-3 min-w-[200px]">
                    <span className="bg-gray-100 rounded-full p-2">
                      <UserRound size={15} className="text-gray-500" />
                    </span>
                    <span>
                      <span className="block text-sm text-gray-900">
                        {share.fullName}
                      </span>
                      <span
                        className="block text-[11px] text-gray-400"
                        dir="ltr"
                      >
                        {share.email}
                      </span>
                      {share.legacyRowCount === 0 && (
                        <span className="block text-[11px] text-amber-700 mt-0.5">
                          لا يوجد سجل مقابل في الجدول القديم — قد لا تظهر هذه
                          النسبة في شاشات التوزيع القديمة.
                        </span>
                      )}
                      {share.legacyRowCount > 1 && (
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          لهذا الشخص {share.legacyRowCount} أدوار في المشروع؛
                          تُكتب النسبة كاملة على سجل واحد والباقي صفر.
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      dir="ltr"
                      value={draft ?? String(share.percentage)}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [share.personId]: e.target.value,
                        }))
                      }
                      className="border border-gray-200 rounded-md px-2 py-1.5 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-gray-400">%</span>

                    {dirty && (
                      <Button
                        variant="primary"
                        size="xs"
                        loading={busyId === share.personId}
                        onClick={() => saveShare(share)}
                      >
                        حفظ
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="xs"
                      loading={busyId === share.personId && !dirty}
                      onClick={() =>
                        run(share.personId, () =>
                          removeShare.mutateAsync({
                            projectId: summary.projectId,
                            personId: share.personId,
                          }),
                        )
                      }
                    >
                      <Trash2 size={13} className="ml-1" />
                      إزالة
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---- Add ---- */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">إضافة نسبة</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchableSelectField
            id="share-person"
            label="الشخص"
            value={newPersonId}
            onChange={setNewPersonId}
            options={candidateOptions}
            placeholder="-- ابحث في كل الموظفين --"
          />

          <div className="flex flex-col">
            <label htmlFor="share-pct" className="mb-1 text-sm text-foreground">
              النسبة (%)
            </label>
            <input
              id="share-pct"
              type="number"
              step="0.01"
              dir="ltr"
              value={newPercentage}
              onChange={(e) => setNewPercentage(e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="button"
            className="self-end"
            loading={busyId === "new"}
            onClick={addShare}
          >
            إضافة
          </Button>
        </div>

        <p className="text-[11px] text-gray-500">
          البحث يشمل كل حسابات الشركة، وليس أعضاء فريق المشروع فقط. يمكن لشخص
          أن يأخذ نسبة في مشروع دون أن يكون ضمن فريقه — النسبة لا تمنح أي
          صلاحية أو وصول من أي نوع.
        </p>
      </div>
    </div>
  );
}
