import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { RoundItemRow } from "../../../../hooks/operations/contracts/rounds/useRounds";
import { QuoteItemInput } from "../../../../hooks/operations/contracts/rounds/useQuotes";
import { formatCurrency } from "../../../../utils/helpper";
import Separator from "../../../ui/separator";

interface ExtraLineDraft {
  tempId: string;
  name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  note: string;
}

interface InitialExtra {
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  note: string | null;
}

interface QuotePriceEntryFormProps {
  roundItems: RoundItemRow[];
  initialPrices?: Record<string, number>;
  initialExtras?: InitialExtra[];
  initialDaysNeeded?: number | null;
  initialNotes?: string | null;
  submitLabel: string;
  loading: boolean;
  onSubmit: (input: {
    items: QuoteItemInput[];
    days_needed: number | null;
    notes: string | null;
  }) => void;
  onCancel: () => void;
}

const QuotePriceEntryForm = ({
  roundItems,
  initialPrices = {},
  initialExtras = [],
  initialDaysNeeded = null,
  initialNotes = "",
  submitLabel,
  loading,
  onSubmit,
  onCancel,
}: QuotePriceEntryFormProps) => {
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(initialPrices).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [extras, setExtras] = useState<ExtraLineDraft[]>(
    initialExtras.map((e) => ({
      tempId: crypto.randomUUID(),
      name: e.name,
      unit: e.unit,
      quantity: String(e.quantity),
      unit_price: String(e.unit_price),
      note: e.note ?? "",
    })),
  );
  const [daysNeeded, setDaysNeeded] = useState<string>(
    initialDaysNeeded != null ? String(initialDaysNeeded) : "",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");

  const setPrice = (itemId: string, value: string) => {
    setPrices((prev) => ({ ...prev, [itemId]: value }));
  };

  const addExtra = () => {
    setExtras((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        name: "",
        unit: "",
        quantity: "1",
        unit_price: "0",
        note: "",
      },
    ]);
  };
  const removeExtra = (tempId: string) => {
    setExtras((prev) => prev.filter((e) => e.tempId !== tempId));
  };
  const updateExtra = (tempId: string, patch: Partial<ExtraLineDraft>) => {
    setExtras((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, ...patch } : e)),
    );
  };

  const roundItemsTotal = roundItems.reduce((sum, item) => {
    const price = Number(prices[item.id]) || 0;
    return sum + price * item.quantity;
  }, 0);
  const extrasTotal = extras.reduce((sum, e) => {
    const price = Number(e.unit_price) || 0;
    const qty = Number(e.quantity) || 0;
    return sum + price * qty;
  }, 0);
  const grandTotal = roundItemsTotal + extrasTotal;

  const validExtras = extras.filter(
    (e) => e.name.trim() && e.unit.trim() && Number(e.quantity) > 0,
  );
  const canSubmit =
    roundItems.some((item) => (Number(prices[item.id]) || 0) > 0) ||
    validExtras.length > 0;

  const handleSubmit = () => {
    const items: QuoteItemInput[] = [];
    roundItems.forEach((item) => {
      const price = Number(prices[item.id]) || 0;
      if (price > 0) {
        items.push({
          round_item_id: item.id,
          work_id: item.work_id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: price,
          note: null,
        });
      }
    });
    validExtras.forEach((e) => {
      items.push({
        round_item_id: null,
        work_id: null,
        name: e.name,
        unit: e.unit,
        quantity: Number(e.quantity) || 0,
        unit_price: Number(e.unit_price) || 0,
        note: e.note || null,
      });
    });
    onSubmit({
      items,
      days_needed: daysNeeded === "" ? null : Number(daysNeeded),
      notes: notes || null,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3">
          أسعار بنود الجولة
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
            <span className="col-span-5">البند</span>
            <span className="col-span-2">الوحدة</span>
            <span className="col-span-2">الكمية</span>
            <span className="col-span-3">سعر الوحدة</span>
          </div>
          {roundItems.map((item) => {
            const price = Number(prices[item.id]) || 0;
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-0"
              >
                <div className="col-span-5">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {item.unit}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {item.quantity}
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={prices[item.id] ?? ""}
                    onChange={(e) => setPrice(item.id, e.target.value)}
                    placeholder="0.00"
                    className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {price > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatCurrency(price * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-500">بنود إضافية</p>
          <button
            type="button"
            onClick={addExtra}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-600 text-sm hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة بند
          </button>
        </div>
        {extras.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-400 text-sm">
            لا توجد بنود إضافية
          </div>
        ) : (
          <div className="space-y-3">
            {extras.map((e) => (
              <div
                key={e.tempId}
                className="border rounded-xl p-3 space-y-2 bg-gray-50"
              >
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="اسم البند"
                    value={e.name}
                    onChange={(ev) =>
                      updateExtra(e.tempId, { name: ev.target.value })
                    }
                    className="col-span-4 border rounded px-2 py-1.5 text-sm bg-white"
                  />
                  <input
                    type="text"
                    placeholder="الوحدة"
                    value={e.unit}
                    onChange={(ev) =>
                      updateExtra(e.tempId, { unit: ev.target.value })
                    }
                    className="col-span-2 border rounded px-2 py-1.5 text-sm bg-white"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="الكمية"
                    value={e.quantity}
                    onChange={(ev) =>
                      updateExtra(e.tempId, { quantity: ev.target.value })
                    }
                    className="col-span-2 border rounded px-2 py-1.5 text-sm bg-white"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="سعر الوحدة"
                    value={e.unit_price}
                    onChange={(ev) =>
                      updateExtra(e.tempId, { unit_price: ev.target.value })
                    }
                    className="col-span-3 border rounded px-2 py-1.5 text-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeExtra(e.tempId)}
                    className="col-span-1 flex justify-center text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="ملاحظة (اختياري)"
                  value={e.note}
                  onChange={(ev) =>
                    updateExtra(e.tempId, { note: ev.target.value })
                  }
                  className="w-full border rounded px-2 py-1.5 text-sm bg-white"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-gray-700">
            المدة المطلوبة (أيام)
          </label>
          <input
            type="number"
            min={0}
            value={daysNeeded}
            onChange={(e) => setDaysNeeded(e.target.value)}
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-700">ملاحظات</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">الإجمالي</p>
          <p className="font-bold text-2xl mt-1">
            {formatCurrency(grandTotal)}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border text-sm hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={loading || !canSubmit}
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "جاري الحفظ..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotePriceEntryForm;
