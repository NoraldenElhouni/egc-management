import React from "react";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";

interface NumberFieldProps {
  id: string;
  label?: string;
  placeholder?: string;
  register: ReturnType<UseFormRegister<FieldValues>>;
  error?: FieldError;
  min?: number;
  max?: number;
  step?: string | number;
  hideLabel?: boolean;
  // Add this prop
}

export const NumberField: React.FC<NumberFieldProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  min,
  max,
  step = "0.01",
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
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
