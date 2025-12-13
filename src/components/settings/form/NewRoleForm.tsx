import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RoleFormValues, RoleSchema } from "../../../types/schema/Role.schema";
import { useRoles } from "../../../hooks/settings/useRoles";
import { useState } from "react";
import { TextField } from "../../ui/inputs/TextField";
import Button from "../../ui/Button";
import { useNavigate } from "react-router-dom";

const NewRoleForm = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { addRoles } = useRoles();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RoleFormValues>({
    resolver: zodResolver(RoleSchema),
  });

  const onSubmit = async (data: RoleFormValues) => {
    setLoading(true);
    try {
      const result = await addRoles(data);
      if (!result.success) {
        alert("خطأ في إنشاء الدور ");
        setError(result.error || "خطأ غير معروف");
        setTimeout(() => {
          setError(null);
        }, 3000);
        return;
      }

      setSuccess("تم اضافة الدور بنجاح");
      reset();
      setTimeout(() => setSuccess(null), 3000);

      // redirect to roles list
      setTimeout(() => {
        navigate(`/settings/roles`); // ✅ SPA navigation, no reload
      }, 1000);
    } catch (error) {
      console.error("Unexpected error creating role:", error);
      alert("حدث خطأ غير متوقع أثناء إنشاء الدور.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">اضافة دور جديد</h1>

      {success && (
        <div className="mb-4 p-3 rounded text-sm bg-success/10 text-success">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded text-sm bg-error/10 text-error">
          {error}
        </div>
      )}

      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextField
          id="name"
          label="الاسم"
          register={register("name")}
          error={errors.name}
        />
        <TextField
          id="code"
          label="الرمز"
          register={register("code")}
          error={errors.code}
        />
        <div>
          <Button type="submit" loading={loading}>
            اضافة الدور
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewRoleForm;
