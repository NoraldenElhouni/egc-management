import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TeamEmployeeSchema,
  TeamEmployeeValue,
} from "../../../types/schema/team.schema";
import { SelectField } from "../../ui/inputs/SelectField";
import { useEmployees } from "../../../hooks/useEmployees";
import { SearchableSelectField } from "../../ui/inputs/SearchableSelectField";
import { useProjectRole } from "../../../hooks/team/useTeam";
import { NumberField } from "../../ui/inputs/NumberField";
import Button from "../../ui/Button";
import { supabase } from "../../../lib/supabaseClient";
import { Database } from "../../../lib/supabase";

interface AddingNewTeamProjectsProps {
  projectId: string;
  employeesId?: string[];
  onSuccess?: () => void;
}

const AddingNewTeamProjects = ({
  projectId,
  employeesId = [],
  onSuccess,
}: AddingNewTeamProjectsProps) => {
  const [success, setSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { employees, loading: employeesLoading } = useEmployees();
  const { roles } = useProjectRole();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<TeamEmployeeValue>({
    resolver: zodResolver(TeamEmployeeSchema),
    defaultValues: {
      project_id: projectId,
      user_id: "",
      role: "",
      percentage: undefined,
    },
  });

  // Filter out employees that are already in the team
  const filteredEmployees =
    employees?.filter((emp) => emp.id && !employeesId.includes(emp.id)) || [];

  const onSubmit = async (data: TeamEmployeeValue) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccess(null);

    try {
      // Insert the new team member into project_assignments
      const newAssignment: Database["public"]["Tables"]["project_assignments"]["Insert"] =
        {
          project_id: data.project_id,
          user_id: data.user_id,
          project_role_id: data.role,
          percentage: data.percentage,
        };
      const { error } = await supabase
        .from("project_assignments")
        .insert(newAssignment);

      if (error) {
        throw error;
      }

      setSuccess("تم إضافة العضو بنجاح!");
      reset({
        project_id: projectId,
        user_id: "",
        role: "",
        percentage: undefined,
      });

      // Call onSuccess callback to refresh the team list
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setSuccess(null);
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Error adding team member:", error);
      const err = error as { message?: string } | undefined;
      setSubmitError(
        err?.message || "حدث خطأ أثناء إضافة العضو. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        إضافة عضو جديد
      </h3>

      {success && (
        <div className="mb-3 p-3 rounded-md text-sm bg-green-50 text-green-700 border border-green-200">
          {success}
        </div>
      )}

      {submitError && (
        <div className="mb-3 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Controller
            name="user_id"
            control={control}
            render={({ field }) => (
              <SearchableSelectField
                id="user_id"
                label="الموظف"
                value={field.value}
                onChange={field.onChange}
                options={filteredEmployees.map((emp) => ({
                  label: `${emp.first_name} ${emp.last_name}`,
                  value: emp.id,
                }))}
                error={errors.user_id}
                placeholder="-- اختر موظف --"
                disabled={employeesLoading || isSubmitting}
              />
            )}
          />

          <SelectField
            id="role"
            label="الدور"
            register={register("role")}
            error={errors.role}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            placeholder="-- اختر دور --"
          />

          <NumberField
            id="percentage"
            label="النسبة (%)"
            register={register("percentage", { valueAsNumber: true })}
            error={errors.percentage}
            placeholder="أدخل النسبة"
            min={0}
            max={100}
          />

          <Button
            type="submit"
            className="self-end"
            disabled={isSubmitting || employeesLoading}
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة إلى الفريق"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddingNewTeamProjects;
