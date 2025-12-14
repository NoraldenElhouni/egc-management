import React from "react";
import { useController, Control } from "react-hook-form";

type Props = {
  control: Control<any>;
  name: string; // "specializationIds"
  items: { id: string; name: string }[];
  error?: string;
};

export function SpecializationsCheckboxList({
  control,
  name,
  items,
  error,
}: Props) {
  const { field } = useController({ control, name });

  const selected: string[] = field.value ?? [];

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    field.onChange(next);
  };

  return (
    <div className="md:col-span-2">
      <div className="mb-2 text-sm font-medium">Specializations</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded border p-3">
        {items.map((sp) => (
          <label key={sp.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(sp.id)}
              onChange={() => toggle(sp.id)}
            />
            <span>{sp.name}</span>
          </label>
        ))}
      </div>

      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
