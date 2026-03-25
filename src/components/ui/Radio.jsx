"use client";
import React from "react";

/* ================================
   RADIO COMPONENT
================================ */
const Radio = ({
  label = "",
  checked = false,
  disabled = false,
  error = "",
  onChange,
  className = "",
  id,
  name,
  value,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label
        htmlFor={radioId}
        className={`inline-flex items-center gap-2 cursor-pointer ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        {/* Radio circle */}
        <div
          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
            checked
              ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
              : "bg-[var(--color-white)] border-[var(--input-border)]"
          }`}
        >
          {checked && (
            <div className="w-2 h-2 rounded-full bg-[var(--color-white)]" />
          )}
        </div>

        {label && (
          <span className={`text-sm text-[var(--input-label)]`}>{label}</span>
        )}

        {/* Native input for accessibility */}
        <input
          type="radio"
          id={radioId}
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="absolute opacity-0 w-0 h-0"
          {...props}
        />
      </label>

      {/* ERROR */}
      {error && (
        <span className="text-xs text-[var(--input-label-error)]">{error}</span>
      )}
    </div>
  );
};

export default Radio;
