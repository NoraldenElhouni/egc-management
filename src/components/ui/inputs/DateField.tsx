import React from "react";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";

interface DateFieldProps {
  id: string;
  label?: string;
  placeholder?: string;
  register: ReturnType<UseFormRegister<FieldValues>>;
  error?: FieldError;
  min?: string;
  max?: string;
  hideLabel?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  min,
  max,
  hideLabel = false,
}) => {
  return (
    <div className="flex flex-col">
      {!hideLabel && label && (
        <label htmlFor={id} className="mb-1 text-sm text-foreground">
          {label}
        </label>
      )}
      <input
        id={id}
        type="date"
        placeholder={placeholder}
        min={min}
        max={max}
        {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
