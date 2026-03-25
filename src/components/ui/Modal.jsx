"use client";
import React from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

const Modal = ({
  isOpen = false,
  onClose,
  size = "md", // sm | md | lg | xl
  headerLabel = "",
  children,
  footer,
  className = "",
}) => {
  if (!isOpen) return null;

  // Modal size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-[95vw]",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]  "
      style={{ backgroundColor: "var(--modal-backdrop)" }}
    >
      <div
        className={`rounded-2xl  max-h-[90vh] overflow-y-auto shadow-2xl w-full mx-4 animate-in fade-in zoom-in-95 duration-200 border border-white/20 ${sizeClasses[size] || sizeClasses.md} ${className}`}
        style={{ backgroundColor: "var(--modal-bg)" }}
      >
        {/* Header */}
        {headerLabel && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--modal-header-border)" }}
          >
            <h3 className="font-bold text-gray-900" style={{ color: "var(--modal-header-text)" }}>{headerLabel}</h3>
            <Button
              variant="outline"
              size="small"
              onClick={onClose}
              className="!p-1.5 !rounded-lg border-transparent hover:bg-[var(--modal-close-bg-hover)] !shadow-none"
              startIcon={<X className="w-4 h-4" />}
              label=""
            />
          </div>
        )}

        {/* Body */}
        <div
          className="p-4"
          style={{
            color: "var(--modal-body-text)",
            backgroundColor: "var(--modal-body-bg)",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-4 py-3 border-t rounded-b-lg"
            style={{
              borderColor: "var(--modal-footer-border)",
              backgroundColor: "var(--modal-footer-bg)",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
