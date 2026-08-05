import React from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface TextFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "number";
  placeholder?: string;
  register?: UseFormRegisterReturn; // ✅ correct type
  error?: FieldError;
  step?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  label,
  type = "text",
  placeholder,
  register,
  error,
  step,
  onChange,
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
        // spread RHF register props FIRST
        {...register}
        // ✅ merge onChange (RHF + custom)
        onChange={(e) => {
          register?.onChange(e); // give event to RHF (this enables live watch)
          onChange?.(e); // your optional handler
        }}
        // ✅ keep ref + onBlur from RHF automatically via {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
