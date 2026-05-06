import React from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface TextAreaFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  register?: UseFormRegisterReturn;
  error?: FieldError;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  rows = 4,
  onChange,
}) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1 text-sm text-foreground">
        {label}
      </label>

      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        {...register}
        onChange={(e) => {
          register?.onChange(e);
          onChange?.(e);
        }}
        className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />

      {error && <p className="text-sm text-error mt-1">{error.message}</p>}
    </div>
  );
};
