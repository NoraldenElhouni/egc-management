import React from "react";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  id: string;
  label?: string;
  options: SelectOption[];
  register: ReturnType<UseFormRegister<FieldValues>>;
  error?: FieldError;
  placeholder?: string;
  hideLabel?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  options,
  register,
  error,
  placeholder,
  hideLabel = false,
}) => {
  return (
    <div className="flex flex-col">
      {!hideLabel && label && (
        <label htmlFor={id} className="mb-1 text-sm text-foreground">
          {label}
        </label>
      )}
      <select
        id={id}
        {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">{placeholder ?? "-- اختر --"}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
