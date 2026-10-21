// hooks/useUnitsAdmin.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { agreementsDb } from "../lib/agreementsDb";

// Settings → وحدات القياس: add, rename, reorder, (de)activate. Units are
// never deleted — agreement items point at them — so "remove" is
// deactivate: it disappears from the item pickers, old items keep it.
// Writes need manage_reference_data (RLS on lookups.units).

const DUPLICATE_UNIT_MESSAGE = "توجد وحدة بهذا الاسم بالفعل";

function errorMessage(e: unknown, fallback: string) {
  const err = e as { code?: string; message?: string } | null;
  if (err?.code === "23505") return DUPLICATE_UNIT_MESSAGE;
  if (err?.code === "42501") return "ليس لديك صلاحية تعديل وحدات القياس";
  return err?.message || fallback;
}

export function useUnitsAdmin() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["lookups", "units"] });
  const units = () => agreementsDb.schema("lookups").from("units");

  const add = useMutation({
    mutationFn: async (v: { name: string; sortOrder: number }) => {
      const { error } = await units().insert({ name: v.name.trim(), sort_order: v.sortOrder });
      if (error) throw new Error(errorMessage(error, "فشل في إضافة الوحدة"));
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; name?: string; sort_order?: number; is_active?: boolean }) => {
      const { id, ...patch } = v;
      if (patch.name !== undefined) patch.name = patch.name.trim();
      const { error } = await units().update(patch).eq("id", id);
      if (error) throw new Error(errorMessage(error, "فشل في حفظ الوحدة"));
    },
    onSuccess: invalidate,
  });

  return { add, update };
}
