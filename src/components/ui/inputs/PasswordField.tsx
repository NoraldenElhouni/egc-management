import React from "react";
import { UseFormRegister, FieldError, FieldValues } from "react-hook-form";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  register: ReturnType<UseFormRegister<FieldValues>>;
  error?: FieldError;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
}) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm text-foreground">
        {label}
      </label>
      <input
        id={id}
        type="password"
        placeholder={placeholder}
        {...register}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
