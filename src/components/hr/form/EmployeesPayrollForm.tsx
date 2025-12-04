import { useEffect, useState } from "react";
import { usePayroll } from "../../../hooks/usePayroll";
import { useForm } from "react-hook-form";
import {
  FixedEmployeesPayrollSchema,
  FixedPayrollFormValues,
} from "../../../types/schema/fixedPayroll.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";

const EmployeesPayrollForm = () => {
  const [loading] = useState(false);
  const { fixedEmployees } = usePayroll();

  const { register, handleSubmit, reset } = useForm<FixedPayrollFormValues>({
    resolver: zodResolver(FixedEmployeesPayrollSchema),
    defaultValues: {
      employees: fixedEmployees.map((emp) => ({
        id: emp.id,
        amount: emp.base_salary,
      })),
    },
  });

  // Ensure default values populate once fixedEmployees load/update
  useEffect(() => {
    if (fixedEmployees && fixedEmployees.length) {
      reset({
        employees: fixedEmployees.map((emp) => ({
          id: emp.id,
          amount: emp.base_salary,
        })),
      });
    }
  }, [fixedEmployees, reset]);

  const onSubmit = async (data: FixedPayrollFormValues) => {
    // setLoading(true);
    // // Call payroll hook to save fixed payrolls
    // const result = await usePayroll().fixedPayroll(data);
    // if (result.success) {
    //   // Optionally show success message
    //   reset();
    // } else {
    //   // Optionally show error message
    // }
    // setLoading(false);
    console.log("Submitted data:", data);
  };
  return (
    <div>
      <div></div>
      <form onSubmit={handleSubmit(onSubmit)}>
        {fixedEmployees.map((emp, index) => (
          <div key={emp.id} className="mb-4 flex justify-between items-center">
            <label className="pr-4 w-48">
              {emp.first_name} {emp.last_name}:
            </label>
            <input
              type="number"
              {...register(`employees.${index}.amount` as const)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        ))}
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ الرواتب الثابتة"}
        </Button>
      </form>
    </div>
  );
};

export default EmployeesPayrollForm;
