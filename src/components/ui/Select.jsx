"use client";
import React from "react";
import SelectLib from "react-select";

/* ================================
   SELECT COMPONENT
================================ */
const Select = ({
  label,
  required = false,
  error,
  disabled = false,
  options = [],
  value,
  onChange,
  onBlur,
  isClearable = false,
  backgroundColor,
  isMulti = false,
  placeholder = "Select...",
  className = "",
  size = "medium", // small | medium | large
}) => {
  // Size classes
  const sizeClasses = {
    small: {
      minHeight: "32px",
      fontSize: "0.75rem", // text-xs
      paddingY: "0.5rem",
    },
    medium: {
      minHeight: "38px",
      fontSize: "0.875rem", // text-sm
      paddingY: "0.625rem",
    },
    large: {
      minHeight: "46px",
      fontSize: "1rem", // text-base
      paddingY: "0.75rem",
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.medium;

  // Custom react-select styles
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: selectedSize.minHeight,
      borderRadius: "0.375rem",
      borderWidth: "1px",
      borderColor: error
        ? "var(--input-border-error)"
        : state.isFocused
          ? "var(--input-border-focus)"
          : "var(--input-border)",
      backgroundColor: disabled
        ? "var(--input-disabled-bg)"
        : backgroundColor ? backgroundColor : "var(--input-bg)",
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: "none",
      fontSize: selectedSize.fontSize,
      "&:hover": {
        borderColor: state.isFocused
          ? "var(--input-border-focus)"
          : error
            ? "var(--input-border-error)"
            : "var(--input-border)",
      },
      paddingLeft: selectedSize.paddingX,
      paddingRight: selectedSize.paddingX,
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--input-placeholder)",
      fontSize: selectedSize.fontSize,
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--input-text)",
      fontSize: selectedSize.fontSize,
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: disabled ? "var(--input-placeholder)" : "var(--input-text)",
      fontSize: selectedSize.fontSize,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "var(--input-white)",
      fontSize: selectedSize.fontSize,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "var(--input-white)",
      ":hover": {
        backgroundColor: "var(--option-selected-bg)",
        color: "var(--input-white)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      fontSize: selectedSize.fontSize,
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--option-selected-bg)"
        : state.isFocused
          ? "var(--option-hover-bg)"
          : "var(--input-bg)",
      color: state.isSelected
        ? "var(--option-text-selected)"
        : "var(--option-text)",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: selectedSize.fontSize,
    }),
  };

  return (
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

      <SelectLib
        isMulti={isMulti}
        isDisabled={disabled}
        options={options}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        styles={customStyles}
        className="w-full"
        isClearable={isClearable}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"

      />

      {/* ERROR MESSAGE */}
      {error && (
        <span className="text-xs text-[var(--input-label-error)]">{error}</span>
      )}
    </div>
  );
};

export default Select;
