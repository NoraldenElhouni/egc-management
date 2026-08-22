import { contractorWithSpecializations } from "../../../../types/extended.type";
import { SearchableSelectField } from "../../../ui/inputs/SearchableSelectField";
import { contractorLabel } from "./mergeTypes";

interface MergeStepSelectProps {
  contractors: contractorWithSpecializations[];
  loading: boolean;
  contractorAId: string;
  contractorBId: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  survivorId: string;
  onChangeSurvivor: (id: string) => void;
  contractorA: contractorWithSpecializations | undefined;
  contractorB: contractorWithSpecializations | undefined;
}

const MergeStepSelect = ({
  contractors,
  loading,
  contractorAId,
  contractorBId,
  onChangeA,
  onChangeB,
  survivorId,
  onChangeSurvivor,
  contractorA,
  contractorB,
}: MergeStepSelectProps) => {
  const optionsFor = (excludeId: string) =>
    contractors
      .filter((c) => c.id !== excludeId)
      .map((c) => ({ value: c.id, label: contractorLabel(c) }));

  const bothLinked = Boolean(contractorA?.user_id) && Boolean(contractorB?.user_id);
  const sameContractor =
    Boolean(contractorAId) && contractorAId === contractorBId;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">اختر المقاولين المراد دمجهما</h2>
      <p className="text-sm text-gray-500">
        سيتم دمج بيانات المقاولين في سجل واحد. المقاول الآخر لن يُحذف، سيتم
        فقط تعليمه كـ &quot;مدمج&quot; وربط جميع سجلاته (عقود، دفعات، مستخلصات
        ...) بالمقاول الأساسي.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelectField
          id="contractorA"
          label="المقاول الأول"
          placeholder="-- ابحث واختر مقاولاً --"
          options={optionsFor(contractorBId)}
          loading={loading}
          value={contractorAId}
          onChange={onChangeA}
        />
        <SearchableSelectField
          id="contractorB"
          label="المقاول الثاني"
          placeholder="-- ابحث واختر مقاولاً --"
          options={optionsFor(contractorAId)}
          loading={loading}
          value={contractorBId}
          onChange={onChangeB}
        />
      </div>

      {sameContractor && (
        <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          يرجى اختيار مقاولين مختلفين.
        </p>
      )}

      {bothLinked && (
        <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          كلا المقاولين لديه حساب دخول مرتبط. يرجى فصل حساب أحدهما أولاً قبل
          الدمج.
        </p>
      )}

      {contractorA && contractorB && !bothLinked && !sameContractor && (
        <div className="space-y-2">
          <label className="text-sm text-gray-700">
            المقاول الأساسي (الذي سيبقى نشطاً بعد الدمج)
          </label>
          <div className="flex flex-col gap-2">
            {[contractorA, contractorB].map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="survivor"
                  checked={survivorId === c.id}
                  onChange={() => onChangeSurvivor(c.id)}
                />
                <span>{contractorLabel(c)}</span>
                {c.user_id && (
                  <span className="text-xs text-gray-400">(لديه حساب دخول)</span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeStepSelect;
