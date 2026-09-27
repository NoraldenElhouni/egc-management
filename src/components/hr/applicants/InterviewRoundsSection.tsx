import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../ui/Button";
import { SelectField } from "../../ui/inputs/SelectField";
import { TextField } from "../../ui/inputs/TextField";
import { useEmployees } from "../../../hooks/useEmployees";
import { useCan } from "../../../hooks/permissions/useCan";
import {
  interviewRoundSchema,
  InterviewRoundFormValues,
} from "../../../types/schema/interviewRound.schema";
import {
  INTERVIEW_ROUND_STATUS_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
  InterviewRound,
  InterviewRoundStatus,
  interviewRoundStatusLabel,
  interviewTypeLabel,
} from "../../../types/hr.type";

interface InterviewRoundsSectionProps {
  rounds: InterviewRound[];
  loading: boolean;
  addRound: (
    values: InterviewRoundFormValues,
  ) => Promise<{ success: boolean; message?: string }>;
  setStatus: (
    id: string,
    status: InterviewRoundStatus,
  ) => Promise<{ success: boolean }>;
}

const InterviewRoundsSection: React.FC<InterviewRoundsSectionProps> = ({
  rounds,
  loading,
  addRound,
  setStatus,
}) => {
  const { employees } = useEmployees();
  const { can: canManage } = useCan("manage_interview_rounds");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InterviewRoundFormValues>({
    resolver: zodResolver(
      interviewRoundSchema,
    ) as unknown as Resolver<InterviewRoundFormValues>,
  });

  const onSubmit = async (data: InterviewRoundFormValues) => {
    setSaving(true);
    try {
      const result = await addRound(data);
      if (!result.success) {
        alert(result.message ?? "فشل في إضافة جولة المقابلة");
        return;
      }
      reset();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-800">جولات المقابلة</h3>
        {canManage && (
          <Button size="sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "إلغاء" : "إضافة جولة"}
          </Button>
        )}
      </div>

      {loading && <div className="text-sm text-gray-500">جاري التحميل...</div>}

      {!loading && rounds.length === 0 && !showForm && (
        <p className="text-sm text-gray-500">لا توجد جولات مقابلة بعد.</p>
      )}

      <ul className="space-y-2">
        {rounds.map((round) => (
          <li
            key={round.id}
            className="flex items-center justify-between border rounded-lg px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-medium">جولة {round.round_number}</span>
              {round.interview_type && (
                <span className="text-gray-500">
                  {" "}
                  — {interviewTypeLabel(round.interview_type)}
                </span>
              )}
              {round.scheduled_at && (
                <span className="text-gray-500">
                  {" "}
                  — {new Date(round.scheduled_at).toLocaleString("ar-LY")}
                </span>
              )}
              {round.location && (
                <span className="text-gray-500"> — {round.location}</span>
              )}
            </div>

            {canManage ? (
              <select
                value={round.status}
                onChange={(e) =>
                  setStatus(
                    round.id,
                    e.target.value as (typeof INTERVIEW_ROUND_STATUS_OPTIONS)[number]["value"],
                  )
                }
                className="border rounded px-2 py-1 text-xs bg-white"
              >
                {INTERVIEW_ROUND_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-gray-500">
                {interviewRoundStatusLabel(round.status)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {showForm && canManage && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <SelectField
            id="interviewType"
            label="نوع المقابلة"
            options={INTERVIEW_TYPE_OPTIONS.map((o) => ({ ...o }))}
            register={register("interviewType")}
            error={errors.interviewType}
          />

          <div className="flex flex-col">
            <label htmlFor="scheduledAt" className="mb-1 text-sm text-foreground">
              موعد المقابلة
            </label>
            <input
              id="scheduledAt"
              type="datetime-local"
              {...register("scheduledAt")}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.scheduledAt && (
              <p className="text-sm text-error mt-1">
                {errors.scheduledAt.message}
              </p>
            )}
          </div>

          <SelectField
            id="interviewerEmployeeId"
            label="القائم بالمقابلة"
            options={employees.map((e) => ({
              value: e.id,
              label: `${e.first_name} ${e.last_name ?? ""}`.trim(),
            }))}
            register={register("interviewerEmployeeId")}
            error={errors.interviewerEmployeeId}
          />

          <TextField
            id="location"
            label="المكان"
            register={register("location")}
            error={errors.location}
          />

          <div className="md:col-span-2 flex justify-end">
            <Button loading={saving} type="submit">
              حفظ الجولة
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InterviewRoundsSection;
