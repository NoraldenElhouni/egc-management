import React, { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator } from "lucide-react";
import {
  MapsDistributionSchema,
  MapsDistributionValues,
} from "../../../types/schema/MapsDistribution.schema";
// Assuming you have these hooks available based on your context
import { useProject } from "../../../hooks/useProjects";
import { useEmployees } from "../../../hooks/useEmployees";
import { NumberField } from "../../ui/inputs/NumberField";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { TextField } from "../../ui/inputs/TextField";
// Import your provided components

interface ProjectMapsDistributionFormProps {
  projectId: string;
}

const ProjectMapsDistributionForm = ({
  projectId,
}: ProjectMapsDistributionFormProps) => {
  const { project } = useProject(projectId);
  const { employees, loading: loadingEmployees } = useEmployees();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MapsDistributionValues>({
    resolver: zodResolver(MapsDistributionSchema),
    defaultValues: {
      project_id: projectId,
      description: "",
      map: [{ price: 0, quantity: 1, total: 0 }], // Start with one empty map row
      company: { percentage: 0, amount: 0 },
      employee: [],
    },
  });

  // Manage Dynamic Arrays
  const {
    fields: mapFields,
    append: appendMap,
    remove: removeMap,
  } = useFieldArray({
    control,
    name: "map",
  });

  const {
    fields: employeeFields,
    append: appendEmployee,
    remove: removeEmployee,
  } = useFieldArray({
    control,
    name: "employee",
  });

  // --- Calculations Logic ---
  const watchedMaps = watch("map");
  const watchedEmployees = watch("employee");
  const watchedCompanyPercent = watch("company.percentage");

  // Calculate Grand Total of all Maps
  const grandTotal = watchedMaps.reduce((acc, curr) => {
    return acc + Number(curr.price || 0) * Number(curr.quantity || 0);
  }, 0);

  // Calculate Total Percentage Used
  const totalPercentageUsed =
    (Number(watchedCompanyPercent) || 0) +
    watchedEmployees.reduce(
      (acc, curr) => acc + (Number(curr.percentage) || 0),
      0
    );

  // Sync Calculations (Effect)
  useEffect(() => {
    // 1. Update Map Row Totals
    watchedMaps.forEach((mapItem, index) => {
      const rowTotal =
        Number(mapItem.price || 0) * Number(mapItem.quantity || 0);
      if (mapItem.total !== rowTotal) {
        setValue(`map.${index}.total`, rowTotal);
      }
    });

    // 2. Update Company Amount based on Grand Total
    const companyAmount =
      grandTotal * ((Number(watchedCompanyPercent) || 0) / 100);
    setValue("company.amount", Number(companyAmount.toFixed(2)));

    // 3. Update Employee Amounts based on Grand Total
    watchedEmployees.forEach((emp, index) => {
      const empAmount = grandTotal * ((Number(emp.percentage) || 0) / 100);
      // Only update if value implies a change to avoid infinite loops
      // (React Hook Form handles dirty checking, but explicit checks help performance)
      setValue(`employee.${index}.amount`, Number(empAmount.toFixed(2)));
    });
  }, [
    grandTotal,
    watchedCompanyPercent,
    // JSON.stringify is a quick way to deep compare arrays for the dependency array
    JSON.stringify(watchedMaps.map((m) => `${m.price}-${m.quantity}`)),
    JSON.stringify(watchedEmployees.map((e) => e.percentage)),
    setValue,
  ]);

  // --- Form Handlers ---
  const onSubmit = async (data: MapsDistributionValues) => {
    console.log("Submitting Data:", data);
    // Add your API call logic here
    // await createMapDistribution(data);
  };

  // Prepare Employee Options for Select
  const employeeOptions =
    employees?.map((emp: any) => ({
      value: emp.id,
      label: emp.name || emp.full_name || "Unknown Employee", // Adjust based on your actual employee object
    })) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border mt-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Map Distribution - {project?.name || "Loading..."}
        </h2>
        <p className="text-sm text-gray-500">
          Calculate map revenue and distribute shares.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* --- SECTION 1: MAPS (REVENUE SOURCE) --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-gray-700">1. Map Details</h3>
            <span className="text-sm font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full">
              Total Revenue: {grandTotal.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-4 items-end bg-gray-50 p-3 rounded-md font-medium text-xs text-gray-500 uppercase">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Price per Unit</div>
            <div className="col-span-3">Quantity</div>
            <div className="col-span-3">Row Total</div>
            <div className="col-span-1"></div>
          </div>

          {mapFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-1 pt-3 text-center text-sm font-bold text-gray-400">
                {index + 1}
              </div>
              <div className="col-span-4">
                <NumberField
                  id={`map.${index}.price`}
                  label=""
                  placeholder="Price..."
                  register={register(`map.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  error={errors.map?.[index]?.price}
                  min={0}
                />
              </div>
              <div className="col-span-3">
                <NumberField
                  id={`map.${index}.quantity`}
                  label=""
                  placeholder="Qty"
                  register={register(`map.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                  error={errors.map?.[index]?.quantity}
                  min={1}
                />
              </div>
              <div className="col-span-3">
                {/* Read Only Total Display */}
                <div className="h-10 border bg-gray-100 rounded px-3 py-2 text-gray-600 text-sm">
                  {watch(`map.${index}.total`)?.toLocaleString() ?? 0}
                </div>
              </div>
              <div className="col-span-1 pt-1">
                <button
                  type="button"
                  onClick={() => removeMap(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              appendMap({ type_id: "", price: 0, quantity: 1, total: 0 })
            }
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium mt-2"
          >
            <Plus className="w-4 h-4" /> Add Another Map Type
          </button>
        </div>

        {/* --- SECTION 2: DISTRIBUTION (SHARES) --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-gray-700">
              2. Revenue Distribution
            </h3>
            <div
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                totalPercentageUsed > 100
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              Total Allocated: {totalPercentageUsed}%
            </div>
          </div>

          {/* Company Share (Fixed Row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border">
            <div className="flex flex-col justify-center">
              <span className="font-semibold text-gray-700">Company Share</span>
              <span className="text-xs text-gray-500">
                Fixed organization percentage
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                id="company.percentage"
                label="Percentage (%)"
                register={register("company.percentage", {
                  valueAsNumber: true,
                })}
                error={errors.company?.percentage}
                min={0}
                max={100}
              />
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-foreground">
                  Amount (Calc)
                </label>
                <div className="h-[42px] border bg-gray-200 rounded px-3 py-2 text-gray-700 text-sm font-medium">
                  {watch("company.amount")?.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Shares */}
          <div className="space-y-3 mt-4">
            {employeeFields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end bg-white p-2 border rounded hover:shadow-sm transition-shadow"
              >
                <div className="col-span-5">
                  <SearchableSelectField
                    id={`employee.${index}.employee_id`}
                    label="Employee"
                    options={employeeOptions}
                    loading={loadingEmployees}
                    value={watch(`employee.${index}.employee_id`)}
                    onChange={(val) =>
                      setValue(`employee.${index}.employee_id`, val)
                    }
                    error={errors.employee?.[index]?.employee_id as any}
                  />
                </div>
                <div className="col-span-3">
                  <NumberField
                    id={`employee.${index}.percentage`}
                    label="Percentage %"
                    register={register(`employee.${index}.percentage`, {
                      valueAsNumber: true,
                    })}
                    error={errors.employee?.[index]?.percentage}
                    min={0}
                    max={100}
                  />
                </div>
                <div className="col-span-3">
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-500">
                      Share Amount
                    </label>
                    <div className="h-[42px] flex items-center border bg-gray-50 rounded px-3 text-sm text-gray-700">
                      {watch(`employee.${index}.amount`)?.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="col-span-1 pb-1">
                  <button
                    type="button"
                    onClick={() => removeEmployee(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                appendEmployee({ employee_id: "", percentage: 0, amount: 0 })
              }
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-all flex justify-center items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Add Employee to Distribution
            </button>
          </div>
        </div>

        {/* --- SECTION 3: METADATA --- */}
        <div className="space-y-4 pt-4 border-t">
          <TextField
            id="description"
            label="Notes / Description"
            placeholder="Enter any additional details about this distribution..."
            register={register("description")}
            error={errors.description}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          {totalPercentageUsed !== 100 && (
            <p className="text-sm text-yellow-600 self-center">
              Warning: Total percentage is {totalPercentageUsed}% (should be
              100%)
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? "Saving..." : "Save Distribution"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectMapsDistributionForm;
