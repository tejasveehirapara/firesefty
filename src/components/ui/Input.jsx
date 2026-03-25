"use client";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* ================================
   INPUT COMPONENT
================================ */
const Input = ({
  type = "text", // text | password | textarea
  label,
  required = false,
  error,
  placeholder,
  disabled = false,
  startIcon,
  endIcon,
  className = "",
  value,
  onChange,
  onBlur,
  rows = 3,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";
  const inputType = isPasswordType
    ? showPassword
      ? "text"
      : "password"
    : type;
  const isTextarea = type === "textarea";

  const wrapperBase =
    "flex items-center rounded-md border transition-all duration-200 px-3";

  const wrapperBorder = error
    ? "border-[var(--input-border-error)]"
    : "border-[var(--input-border)] focus-within:border-[var(--input-border-focus)]";

  const wrapperBg = disabled
    ? "bg-[var(--input-disabled-bg)] cursor-not-allowed"
    : "bg-[var(--input-bg)]";

  const inputBase =
    "w-full bg-transparent outline-none text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] disabled:cursor-not-allowed";

  const iconClass = disabled
    ? "text-[var(--input-icon-disabled)]"
    : "text-[var(--input-icon)]";

  const dividerClass = disabled
    ? "bg-[var(--input-divider-disabled)]"
    : "bg-[var(--input-divider)]";

  return (
    <>
      <div className={`flex flex-col gap-1 ${className}`}>
        {/* LABEL */}
        {label && (
          <label
            className={`text-sm font-medium ${error
              ? "text-[var(--input-label-error)]"
              : "text-[var(--input-label)]"
              }`}
          >
            {label}
            {required && (
              <span className="text-[var(--input-label-error)] ml-0.5">*</span>
            )}
          </label>
        )}

        {/* INPUT WRAPPER */}
        <div className={`${wrapperBase} ${wrapperBorder} ${wrapperBg}`}>
          {/* START ICON */}
          {startIcon && (
            <>
              <span className={`flex items-center ${iconClass}`}>
                {startIcon}
              </span>
              <span className={`w-px h-5 mx-2 ${dividerClass}`} />
            </>
          )}

          {/* INPUT / TEXTAREA */}
          {isTextarea ? (
            <textarea
              rows={rows}
              disabled={disabled}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              className={`${inputBase} py-2 resize-none`}
              {...rest}
            />
          ) : (
            <input
              type={inputType}
              disabled={disabled}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              className={`${inputBase} py-2`}
              {...rest}
            />
          )}

          {/* END ICON */}
          {(isPasswordType || endIcon) && (
            <>
              <span className={`w-px h-5 mx-2 ${dividerClass}`} />
              <span className={`flex items-center ${iconClass}`}>
                {isPasswordType ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-gray-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                ) : (
                  endIcon
                )}
              </span>
            </>
          )}
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <span className="text-xs text-[var(--input-label-error)]">
            {error}
          </span>
        )}
      </div>
    </>
  );
};

export default Input;