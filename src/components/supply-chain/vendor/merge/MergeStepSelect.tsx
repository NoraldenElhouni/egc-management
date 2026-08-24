import { VendorsWithSpecializations } from "../../../../types/extended.type";
import { SearchableSelectField } from "../../../ui/inputs/SearchableSelectField";
import { vendorLabel } from "./mergeTypes";

interface MergeStepSelectProps {
  vendors: VendorsWithSpecializations[];
  loading: boolean;
  vendorAId: string;
  vendorBId: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  survivorId: string;
  onChangeSurvivor: (id: string) => void;
  vendorA: VendorsWithSpecializations | undefined;
  vendorB: VendorsWithSpecializations | undefined;
}

const MergeStepSelect = ({
  vendors,
  loading,
  vendorAId,
  vendorBId,
  onChangeA,
  onChangeB,
  survivorId,
  onChangeSurvivor,
  vendorA,
  vendorB,
}: MergeStepSelectProps) => {
  const optionsFor = (excludeId: string) =>
    vendors
      .filter((v) => v.id !== excludeId)
      .map((v) => ({ value: v.id, label: vendorLabel(v) }));

  const bothLinked = Boolean(vendorA?.user_id) && Boolean(vendorB?.user_id);
  const sameVendor = Boolean(vendorAId) && vendorAId === vendorBId;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">اختر الموردين المراد دمجهما</h2>
      <p className="text-sm text-gray-500">
        سيتم دمج بيانات الموردين في سجل واحد. المورد الآخر لن يُحذف، سيتم فقط
        تعليمه كـ &quot;مدمج&quot; وربط جميع سجلاته (مستخلصات، طلبات شراء
        ...) بالمورد الأساسي.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelectField
          id="vendorA"
          label="المورد الأول"
          placeholder="-- ابحث واختر موردًا --"
          options={optionsFor(vendorBId)}
          loading={loading}
          value={vendorAId}
          onChange={onChangeA}
        />
        <SearchableSelectField
          id="vendorB"
          label="المورد الثاني"
          placeholder="-- ابحث واختر موردًا --"
          options={optionsFor(vendorAId)}
          loading={loading}
          value={vendorBId}
          onChange={onChangeB}
        />
      </div>

      {sameVendor && (
        <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          يرجى اختيار موردين مختلفين.
        </p>
      )}

      {bothLinked && (
        <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          كلا الموردين لديه حساب دخول مرتبط. يرجى فصل حساب أحدهما أولاً قبل
          الدمج.
        </p>
      )}

      {vendorA && vendorB && !bothLinked && !sameVendor && (
        <div className="space-y-2">
          <label className="text-sm text-gray-700">
            المورد الأساسي (الذي سيبقى نشطاً بعد الدمج)
          </label>
          <div className="flex flex-col gap-2">
            {[vendorA, vendorB].map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="survivor"
                  checked={survivorId === v.id}
                  onChange={() => onChangeSurvivor(v.id)}
                />
                <span>{vendorLabel(v)}</span>
                {v.user_id && (
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
