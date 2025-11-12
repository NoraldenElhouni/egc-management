import React from "react";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";

interface TextFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "number";
  placeholder?: string;
  register: ReturnType<UseFormRegister<FieldValues>>;
  error?: FieldError;
  step?: string;
  valueAsNumber?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  type = "text",
  placeholder,
  register,
  error,
  step,
}) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        step={step}
        {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
