import { useMemo, useState } from "react";
import InfoRow from "../../../../../../../components/ui/InfoRow";
import Separator from "../../../../../../../components/ui/separator";
import { formatCurrency } from "../../../../../../../utils/helpper";
import { StickyNote } from "lucide-react";

const initialItems = [
  {
    id: 1,
    name: "تمديد مواسير المياه",
    quantity: 20,
    unit: "متر",
    oldPrice: 120,
    newPrice: 120,
  },
  {
    id: 2,
    name: "تركيب خلاطات",
    quantity: 5,
    unit: "قطعة",
    oldPrice: 300,
    newPrice: 280,
  },
  {
    id: 3,
    name: "صرف أرضي",
    quantity: 8,
    unit: "قطعة",
    oldPrice: 150,
    newPrice: 150,
  },
];

const NewCounterOfferPage = () => {
  const [items, setItems] = useState(initialItems);
  const [daysNeeded, setDaysNeeded] = useState(29);
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  const handlePriceChange = (id: number, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              newPrice: Number(value),
            }
          : item,
      ),
    );
  };

  const summary = useMemo(() => {
    const originalTotal = items.reduce(
      (acc, item) => acc + item.oldPrice * item.quantity,
      0,
    );

    const calculatedTotal = items.reduce(
      (acc, item) => acc + item.newPrice * item.quantity,
      0,
    );

    const modifiedItems = items.filter(
      (item) => item.oldPrice !== item.newPrice,
    ).length;

    return {
      originalTotal,
      calculatedTotal,
      modifiedItems,
      unchangedItems: items.length - modifiedItems,
    };
  }, [items]);

  const finalTotal =
    manualTotal !== null ? manualTotal : summary.calculatedTotal;

  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">إرسال عرض مضاد</h1>

          <h4 className="text-sm text-gray-500 mt-1">
            BID-2025-042 · أعمال السباكة — فيلا النور · شركة الهادي
          </h4>
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT */}
        <div className="space-y-4">
          {/* contractor info */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <div className="flex gap-3 items-center mb-2">
              <h2 className="font-semibold text-gray-900">معلومات المقاول</h2>
            </div>

            <Separator />

            <div className="flex gap-3 items-center mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {"vsad".charAt(0)}
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  شركة الهادي للسباكة
                </h2>

                <p className="text-xs text-gray-400">
                  {"dsafga".slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <div>
                <h2>العرض الأصلي:</h2>
                <p>{formatCurrency(18000)}</p>
              </div>

              <div>
                <h2>المدة الأصلية:</h2>
                <p>28 يوم</p>
              </div>

              <div>
                <h2>البنود:</h2>
                <p>{items.length}</p>
              </div>
            </div>
          </div>

          {/* table */}
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">
              تعديل الأسعار بنداً بند
            </h2>

            <p className="text-xs text-gray-400">
              عدّل السعر مباشرة في الخلية — الإجمالي يحتسب تلقائياً
            </p>

            <Separator />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-right p-3">البند</th>
                    <th className="text-center p-3">الكمية</th>
                    <th className="text-center p-3">الوحدة</th>
                    <th className="text-center p-3">السعر القديم</th>
                    <th className="text-center p-3">السعر الجديد</th>
                    <th className="text-center p-3">الإجمالي</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const total = item.quantity * item.newPrice;

                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-3 font-medium">{item.name}</td>

                        <td className="text-center p-3">{item.quantity}</td>

                        <td className="text-center p-3">{item.unit}</td>

                        <td className="text-center p-3 text-gray-500">
                          {formatCurrency(item.oldPrice)}
                        </td>

                        <td className="text-center p-3">
                          <input
                            type="number"
                            value={item.newPrice}
                            onChange={(e) =>
                              handlePriceChange(item.id, e.target.value)
                            }
                            className="w-24 border rounded-md px-2 py-1 text-center"
                          />
                        </td>

                        <td className="text-center p-3 font-semibold">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* bottom controls */}
            <div className="my-6 border-t pt-4 flex items-end justify-between gap-4">
              <div className="flex gap-4">
                {/* total */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">
                    إجمالي العرض الجديد
                  </label>

                  <input
                    type="number"
                    value={finalTotal}
                    onChange={(e) => {
                      setManualTotal(Number(e.target.value));
                    }}
                    className="w-44 border rounded-md px-3 py-2"
                  />
                </div>

                {/* days */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-500">
                    المدة الجديدة (يوم)
                  </label>

                  <input
                    type="number"
                    value={daysNeeded}
                    onChange={(e) => setDaysNeeded(Number(e.target.value))}
                    className="w-32 border rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {/* submit */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">
                إرسال العرض المضاد
              </button>
            </div>
            <Separator />

            <div className="bg-white rounded-lg shadow-sm flex flex-col gap-4">
              <h2 className="font-semibold text-gray-900">ملاحظات المقاول</h2>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2 mb-3">
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-amber-800">
                    ملاحظة للمقاول
                  </h3>
                </div>
                <p className="text-sm leading-7 text-gray-700">
                  أسعار تركيب الحمامات وخط المياه أعلى من المعدل المرجعي لمشاريع
                  مماثلة. نرجو مراجعة هذه البنود.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col h-fit">
          <h2 className="font-semibold text-gray-900">ملخص التعديل</h2>
          <Separator />
          <InfoRow
            label="العرض الأصلي"
            value={formatCurrency(summary.originalTotal)}
          />
          <InfoRow label="عرضك المقترح" value={formatCurrency(finalTotal)} />
          <InfoRow
            label="بنود معدّلة"
            value={`${summary.modifiedItems}/${items.length}`}
          />
          <InfoRow
            label="بنود بدون تغيير"
            value={`${summary.unchangedItems}`}
          />
          <InfoRow label="المدة الأصلية" value="28 يوم" />
          <InfoRow
            label="مدتك المقترحة"
            value={`${daysNeeded} يوم`}
            bordered={false}
          />
        </div>
      </div>
    </div>
  );
};

export default NewCounterOfferPage;
