import React from "react";
import Separator from "../../../../../../components/ui/separator";
import InfoRow from "../../../../../../components/ui/InfoRow";
import { formatCurrency } from "../../../../../../utils/helpper";
import { Info } from "lucide-react";

const NewMilestonePage = () => {
  return (
    <div className="p-6 space-y-4">
      {/* header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">إضافة مرحلة جديدة</h1>
          <h4 className="text-sm text-gray-500 mt-1">
            أعمال السباكة · شركة الهادي · فيلا النور
          </h4>
        </div>
      </div>

      {/* body */}
      <div className="grid grid-cols-2 gap-4">
        {/* left */}
        <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <h2 className="font-semibold text-gray-900">بيانات المرحلة</h2>
          <Separator />

          <form className="space-y-2">
            <div className="flex flex-col space-y-2">
              <label htmlFor="title">عنوان المرحلة *</label>
              <input type="text" className="border" />
            </div>

            <Separator />

            <div className="flex flex-col space-y-2">
              <label htmlFor="description">الوصف</label>
              <textarea className="border" />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="amount">المبلغ</label>
                <input
                  id="amount"
                  type="number"
                  placeholder="أدخل المبلغ"
                  className="border"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="dueDate">تاريخ الاستحقاق</label>
                <input id="dueDate" type="date" className="border" />
              </div>
            </div>

            <Separator />

            {/* radio group */}
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <label key={num} className="flex items-center gap-1">
                  <input type="radio" name="rating" value={num} />
                  {num}
                </label>
              ))}
              <label className="flex items-center gap-1">
                <input type="radio" name="rating" value="other" />
                اخرى
              </label>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                الترتيب يحدد متى تظهر هذه المرحلة في القائمة
              </p>
            </div>

            <div className="flex gap-4">
              <button className="border">حفظ المرحلة</button>
              <button className="border">إلغاء</button>
            </div>
          </form>
        </div>

        {/* right */}
        <div className="space-y-2">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <h2 className="font-semibold text-gray-900">توزيع ميزانية العقد</h2>
            <Separator />

            <InfoRow label="إجمالي العقد" value={formatCurrency(300)} />
            <InfoRow
              label="موزّع على مراحل سابقة"
              value={formatCurrency(200)}
            />
            <InfoRow label="هذه المرحلة" value={formatCurrency(0)} />
            <InfoRow label="المتبقي بعد الإضافة" value={formatCurrency(100)} />

            <div>progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex gap-2">
            <Info />
            <p>مجموع المراحل يجب أن يساوي إجمالي العقد تماماً</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMilestonePage;
