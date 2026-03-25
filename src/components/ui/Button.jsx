"use client";
import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({
  children,
  label = "Button",
  loading = false,
  loadingText = "Loading...",
  variant = "primary",
  size = "medium",
  disabled = false,
  startIcon,
  endIcon,
  className = "",
  onClick,
  type = "button",
}) => {
  const isDisabled = disabled || loading;

  const baseClasses =
    "cursor-pointer inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-60";

  const sizeClasses = {
    small: "px-3 py-1.5 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-2.5 text-base",
  };

  const variantClasses = {
    primary:
      "text-white bg-[var(--color-brand-primary)]",
    success:
      "text-white bg-[var(--color-success-button)] hover:bg-[var(--color-success-button-hover)] shadow-sm",
    danger:
      "text-white bg-[var(--color-danger-button)] hover:bg-[var(--color-danger-button-hover)] shadow-sm",
    outline:
      "bg-transparent text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)] hover:bg-blue-50/50 active:scale-[0.98]",
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {label && <span>{label}</span>}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
