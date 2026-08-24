import { VendorsWithSpecializations } from "../../../../types/extended.type";
import { MergeVendorValues } from "./mergeTypes";

interface MergeStepCompareProps {
  survivor: VendorsWithSpecializations;
  loser: VendorsWithSpecializations;
  values: MergeVendorValues;
  onChange: (values: MergeVendorValues) => void;
}

function ConflictRow({
  label,
  survivorDisplay,
  loserDisplay,
  selected,
  onSelectSurvivor,
  onSelectLoser,
}: {
  label: string;
  survivorDisplay: string;
  loserDisplay: string;
  selected: "survivor" | "loser";
  onSelectSurvivor: () => void;
  onSelectLoser: () => void;
}) {
  const identical = survivorDisplay === loserDisplay;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] gap-2 py-3 border-b last:border-b-0 items-start">
      <div className="text-sm font-medium text-gray-600">{label}</div>

      {identical ? (
        <div className="sm:col-span-2 text-sm text-gray-800">
          {survivorDisplay || <span className="text-gray-400">—</span>}
        </div>
      ) : (
        <>
          <label className="flex items-start gap-2 text-sm cursor-pointer rounded-lg border px-2 py-1.5">
            <input
              type="radio"
              className="mt-0.5"
              checked={selected === "survivor"}
              onChange={onSelectSurvivor}
            />
            <span>{survivorDisplay || <span className="text-gray-400">—</span>}</span>
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer rounded-lg border px-2 py-1.5">
            <input
              type="radio"
              className="mt-0.5"
              checked={selected === "loser"}
              onChange={onSelectLoser}
            />
            <span>{loserDisplay || <span className="text-gray-400">—</span>}</span>
          </label>
        </>
      )}
    </div>
  );
}

const MergeStepCompare = ({
  survivor,
  loser,
  values,
  onChange,
}: MergeStepCompareProps) => {
  const set = (patch: Partial<MergeVendorValues>) =>
    onChange({ ...values, ...patch });

  const simpleFields: {
    key: keyof Pick<
      MergeVendorValues,
      | "vendor_name"
      | "contact_name"
      | "email"
      | "phone_number"
      | "alt_phone_number"
      | "whatsapp_number"
      | "country"
      | "city"
      | "address"
    >;
    label: string;
  }[] = [
    { key: "vendor_name", label: "اسم المورد" },
    { key: "contact_name", label: "اسم المسؤول" },
    { key: "email", label: "البريد الإلكتروني" },
    { key: "phone_number", label: "رقم الهاتف" },
    { key: "alt_phone_number", label: "رقم هاتف بديل" },
    { key: "whatsapp_number", label: "رقم الواتساب" },
    { key: "country", label: "الدولة" },
    { key: "city", label: "المدينة" },
    { key: "address", label: "العنوان" },
  ];

  const bankSelected: "survivor" | "loser" =
    values.bank_id === loser.bank_id && loser.bank_id !== survivor.bank_id
      ? "loser"
      : "survivor";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-1">مقارنة البيانات</h2>
      <p className="text-sm text-gray-500 mb-4">
        عند اختلاف القيمة بين الموردين، اختر القيمة التي تريد الاحتفاظ بها.
        العمود الأيمن هو بيانات المورد الأساسي، والعمود الأيسر بيانات المورد
        الآخر.
      </p>

      <div>
        {simpleFields.map(({ key, label }) => (
          <ConflictRow
            key={key}
            label={label}
            survivorDisplay={survivor[key] ?? ""}
            loserDisplay={loser[key] ?? ""}
            selected={
              values[key] === loser[key] && loser[key] !== survivor[key]
                ? "loser"
                : "survivor"
            }
            onSelectSurvivor={() =>
              set({ [key]: survivor[key] } as Partial<MergeVendorValues>)
            }
            onSelectLoser={() =>
              set({ [key]: loser[key] } as Partial<MergeVendorValues>)
            }
          />
        ))}

        <ConflictRow
          label="التخصص"
          survivorDisplay={survivor.specializations?.name ?? ""}
          loserDisplay={loser.specializations?.name ?? ""}
          selected={
            values.specialization_id === loser.specialization_id &&
            loser.specialization_id !== survivor.specialization_id
              ? "loser"
              : "survivor"
          }
          onSelectSurvivor={() =>
            set({ specialization_id: survivor.specialization_id })
          }
          onSelectLoser={() => set({ specialization_id: loser.specialization_id })}
        />

        <ConflictRow
          label="معلومات البنك"
          survivorDisplay={
            survivor.bank_id
              ? `${survivor.bank_name ?? ""} — ${survivor.bank_number ?? ""} — ${survivor.bank_holder_name ?? ""}`
              : ""
          }
          loserDisplay={
            loser.bank_id
              ? `${loser.bank_name ?? ""} — ${loser.bank_number ?? ""} — ${loser.bank_holder_name ?? ""}`
              : ""
          }
          selected={bankSelected}
          onSelectSurvivor={() =>
            set({
              bank_id: survivor.bank_id,
              bank_number: survivor.bank_number,
              bank_holder_name: survivor.bank_holder_name,
            })
          }
          onSelectLoser={() =>
            set({
              bank_id: loser.bank_id,
              bank_number: loser.bank_number,
              bank_holder_name: loser.bank_holder_name,
            })
          }
        />
      </div>
    </div>
  );
};

export default MergeStepCompare;
