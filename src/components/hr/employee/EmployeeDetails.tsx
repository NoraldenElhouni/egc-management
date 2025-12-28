import { supabase } from "../../../lib/supabaseClient";
import { FullEmployee } from "../../../types/extended.type";
import EmployeeHeaderCard, {
  EmployeeHeaderValues,
} from "./cards/EmployeeHeaderCard";
import ProjectsCard from "./ProjectsCard";
import QuickStats, { QuickStatsValues } from "./QuickStats";

interface EmployeeDetailsProps {
  employee: FullEmployee;
  onUpdated: () => void | Promise<void>;
}

const EmployeeDetails = ({ employee, onUpdated }: EmployeeDetailsProps) => {
  const handleSave = async (data: EmployeeHeaderValues) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update(data)
        .eq("id", employee.id);

      if (error) {
        console.error(error);
        throw error;
      }

      const status = (data.status ?? undefined) as
        | "active"
        | "inactive"
        | undefined;
      const { error: usererror } = await supabase
        .from("users")
        .update({ status })
        .eq("id", employee.id);

      if (usererror) {
        console.error(usererror);
        throw usererror;
      }

      await onUpdated(); // ✅ await refetch
    } catch (e) {
      console.error(e);
      throw e; // keeps edit mode open if you choose
    }
  };

  const handleSaveQuickStats = async (data: QuickStatsValues) => {
    // convert explicit nulls to undefined so Supabase accepts optional numeric fields
    const sanitized = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
    ) as Record<string, unknown>;

    const { error } = await supabase
      .from("employees")
      .update(sanitized)
      .eq("id", employee.id);

    if (error) throw error;

    await onUpdated();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-800">تفاصيل الموظف</h3>
        </div>

        <EmployeeHeaderCard employee={employee} onSave={handleSave} />

        <ProjectsCard projects={employee.projects || []} />

        <QuickStats employee={employee} onSave={handleSaveQuickStats} />
      </div>
    </div>
  );
};

export default EmployeeDetails;
