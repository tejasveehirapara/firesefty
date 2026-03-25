"use client";
import React from "react";

const Checkbox = ({
  label = "",
  checked = false,
  disabled = false,
  error = "",
  onChange,
  className = "",
  id,
  ...props
}) => {
  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-center gap-2 ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {/* Checkbox Box */}
        <div
          className={`w-4 h-4 rounded border flex items-center justify-center
            ${
              checked
                ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                : "bg-[var(--color-white)] border-[var(--input-border)]"
            }
            ${
              disabled
                ? "bg-[var(--input-disabled-bg)] border-[var(--input-divider-disabled)]"
                : ""
            }
          `}
        >
          {checked && (
            <svg
              className="w-3 h-3 text-[var(--color-white)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Label */}
        {label && (
          <span className="text-sm text-[var(--input-label)]">{label}</span>
        )}

        {/* Hidden native input */}
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="absolute opacity-0 w-0 h-0"
          {...props}
        />
      </label>

      {/* Error message */}
      {error && (
        <span className="text-xs text-[var(--input-label-error)]">{error}</span>
      )}
    </div>
  );
};

export default Checkbox;
