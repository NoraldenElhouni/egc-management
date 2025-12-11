import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  MapsDistributionSchema,
  MapsDistributionValues,
} from "../../../types/schema/MapsDistribution.schema";
import { useProjectWithAssignments } from "../../../hooks/useProjects";
import { formatCurrency } from "../../../utils/helpper";
import { usePayroll } from "../../../hooks/usePayroll";
import { SelectField } from "../../ui/inputs/SelectField";

const mockMapTypes = [
  { id: "a808f4db-b1ef-4964-b4c9-0f345f647fa3", name: "خرائط تنفيذية" },
  { id: "171fe56f-9646-4230-9d85-1d76672a6c53", name: "خرائط معمارية" },
  { id: "85a56167-06d5-41c0-b119-20fc916579b1", name: "خرائط إنشائية" },
  { id: "4b04c1f5-daa3-4807-ab51-e43a74770620", name: "خرائط كهربائية" },
];

interface ProjectMapsDistributionFormProps {
  projectId: string;
}
const MapsDistributionForm = ({
  projectId,
}: ProjectMapsDistributionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const { project } = useProjectWithAssignments(projectId);
  const { MapsDistribution } = usePayroll();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<MapsDistributionValues>({
    resolver: zodResolver(MapsDistributionSchema),
    defaultValues: {
      project_id: projectId,
      map: [],
    },
  });

  const {
    fields: mapFields,
    append: appendMap,
    remove: removeMap,
  } = useFieldArray({
    control,
    name: "map",
  });

  const watchMaps = watch("map");

  // Calculate map total when price or quantity changes
  useEffect(() => {
    watchMaps?.forEach((mapItem, mapIndex) => {
      const price = mapItem.price || 0;
      const quantity = mapItem.quantity || 0;
      const total = price * quantity;

      if (mapItem.total !== total) {
        setValue(`map.${mapIndex}.total`, total);
      }

      // Calculate employee amounts based on percentages
      mapItem.employee?.forEach((emp, empIndex) => {
        const percentage = emp.percentage || 0;
        const amount = (total * percentage) / 100;
        setValue(`map.${mapIndex}.employee.${empIndex}.amount`, amount);
      });

      // Calculate company amount
      const companyPercentage = mapItem.company?.percentage || 0;
      const companyAmount = (total * companyPercentage) / 100;
      setValue(`map.${mapIndex}.company.amount`, companyAmount);
    });
  }, [
    watchMaps
      ?.map(
        (m) =>
          `${m.price}-${m.quantity}-${m.description}-${m.employee
            ?.map((e) => e.percentage)
            .join("-")}-${m.company?.percentage}`
      )
      .join("|"),
    setValue,
  ]);

  const addNewMap = () => {
    const assignments = project?.project_assignments ?? [];
    appendMap({
      type_id: "",
      description: "",
      price: 0,
      quantity: 0,
      total: 0,
      employee: assignments.map((pa) => ({
        employee_id: pa.user_id,
        percentage: 0,
        amount: 0,
      })),
      company: {
        percentage: 0,
        amount: 0,
      },
    });
  };

  const getTotalPercentageForMap = (mapIndex: number) => {
    const mapItem = watchMaps?.[mapIndex];
    if (!mapItem) return 0;

    const employeeTotal =
      mapItem.employee?.reduce((sum, emp) => sum + (emp.percentage || 0), 0) ||
      0;
    const companyPercentage = mapItem.company?.percentage || 0;
    return employeeTotal + companyPercentage;
  };

  const getGrandTotal = () => {
    return watchMaps?.reduce((sum, map) => sum + (map.total || 0), 0) || 0;
  };

  const handleFormSubmit = handleSubmit(
    async (data: MapsDistributionValues) => {
      setLoading(true);
      try {
        console.log("Submitted data:", data);
        await MapsDistribution(data);
        setSuccess("تم حفظ توزيع الخرائط بنجاح!");
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 justify-between flex flex-col md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            توزيع نسب الخرائط
          </h1>
          <div className="text-lg text-gray-600 mb-4">
            <span className="font-semibold">{project?.name ?? "..."}</span>
            {project?.code && (
              <span className="text-sm mr-2">({project.code})</span>
            )}
          </div>
        </div>

        <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 font-medium mb-1">
            الإجمالي الكلي
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {formatCurrency(getGrandTotal())}
          </div>
        </div>

        <div>
          <SelectField
            id="payment_method"
            label="طريقة الدفع"
            options={[
              { value: "cash", label: "نقدًا" },
              { value: "bank", label: "بنكي" },
            ]}
            register={register("payment_method")}
            error={errors.payment_method}
          />
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-800 border border-green-300">
          ✓ {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Maps Section */}
        {mapFields.map((field, mapIndex) => {
          const mapItem = watchMaps?.[mapIndex];
          const totalPercentage = getTotalPercentageForMap(mapIndex);
          const remainingPercentage = 100 - totalPercentage;
          const isValidPercentage = totalPercentage === 100;

          return (
            <div key={field.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  خريطة {mapIndex + 1}
                </h2>
                <button
                  type="button"
                  onClick={() => removeMap(mapIndex)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  حذف
                </button>
              </div>

              {/* Map Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    نوع الخريطة
                  </label>
                  <select
                    {...register(`map.${mapIndex}.type_id`)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر النوع</option>
                    {mockMapTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.map?.[mapIndex]?.type_id && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.map[mapIndex]?.type_id?.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    وصف الخريطة
                  </label>
                  <input
                    type="text"
                    {...register(`map.${mapIndex}.description`)}
                    placeholder="أدخل وصفًا للخريطة..."
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.map?.[mapIndex]?.description && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.map[mapIndex]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    السعر
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`map.${mapIndex}.price`, {
                      valueAsNumber: true,
                    })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register(`map.${mapIndex}.quantity`, {
                      valueAsNumber: true,
                    })}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col md:col-span-4">
                  <label className="mb-1 text-sm font-medium text-gray-700">
                    الإجمالي
                  </label>
                  <div className="border border-gray-300 bg-gray-50 rounded-lg px-3 py-2 font-bold text-purple-900">
                    {formatCurrency(mapItem?.total || 0)}
                  </div>
                </div>
              </div>

              {/* Employees Distribution */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  توزيع الموظفين
                </h3>
                <div className="space-y-3">
                  {mapItem?.employee?.map((emp, empIndex) => {
                    const assignments = project?.project_assignments ?? [];
                    const assignment = assignments[empIndex];
                    const firstName =
                      assignment?.employees?.first_name ??
                      `الموظف ${empIndex + 1}`;
                    const lastName = assignment?.employees?.last_name ?? "";
                    return (
                      <div
                        key={empIndex}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-800">
                            {firstName} {lastName}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-gray-700">
                              النسبة المئوية (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...register(
                                `map.${mapIndex}.employee.${empIndex}.percentage`,
                                {
                                  valueAsNumber: true,
                                }
                              )}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="mb-1 text-sm font-medium text-gray-700">
                              المبلغ
                            </label>
                            <div className="border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 font-bold text-blue-900">
                              {formatCurrency(emp?.amount || 0)}
                            </div>
                          </div>
                        </div>
                        <input
                          type="hidden"
                          {...register(
                            `map.${mapIndex}.employee.${empIndex}.employee_id`
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Company Distribution */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  حصة الشركة
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">
                      النسبة المئوية (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`map.${mapIndex}.company.percentage`, {
                        valueAsNumber: true,
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">
                      المبلغ
                    </label>
                    <div className="border border-gray-300 bg-indigo-100 rounded-lg px-3 py-2 font-bold text-indigo-900">
                      {formatCurrency(mapItem?.company?.amount || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Percentage Status */}
              {!isValidPercentage && (
                <div className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-amber-800">
                        النسبة المستخدمة:
                      </span>
                      <span
                        className={`text-xl font-bold mr-2 ${
                          totalPercentage !== 100
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {totalPercentage.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-amber-800">المتبقي:</span>
                      <span
                        className={`text-xl font-bold mr-2 ${
                          remainingPercentage !== 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {remainingPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {!isValidPercentage && (
                    <div className="mt-2 text-sm text-red-600 font-medium">
                      {totalPercentage > 100
                        ? "⚠️ تحذير: النسبة الإجمالية تتجاوز 100%"
                        : "⚠️ تحذير: النسبة الإجمالية أقل من 100%"}
                    </div>
                  )}
                  {isValidPercentage && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      ✓ النسبة الإجمالية صحيحة (100%)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Map Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addNewMap}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            + إضافة خريطة جديدة
          </button>
        </div>

        {/* Submit Button */}
        <div className="space-y-3">
          {mapFields.some(
            (_, idx) => getTotalPercentageForMap(idx) !== 100
          ) && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-right">
              <div className="text-red-800 font-semibold mb-2">
                ⚠️ لا يمكن الحفظ - يجب أن تكون جميع النسب 100% بالضبط
              </div>
              <div className="text-red-700 text-sm">
                يرجى التحقق من توزيع النسب في جميع الخرائط
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleFormSubmit}
              disabled={
                loading ||
                mapFields.length === 0 ||
                mapFields.some(
                  (_, idx) => getTotalPercentageForMap(idx) !== 100
                )
              }
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg shadow-md"
            >
              {loading ? "جاري الحفظ..." : "حفظ التوزيع"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapsDistributionForm;
