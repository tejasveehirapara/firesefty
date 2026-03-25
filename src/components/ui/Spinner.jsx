"use client";
import React from "react";
import { Loader2 } from "lucide-react";

/* ================================
   SPINNER COMPONENT (Lucide)
================================ */
const Spinner = ({
  size = "medium",
  color = "var(--color-spinner-primary)",
  className = "",
}) => {
  // Size classes
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6",
    large: "w-10 h-10",
  };

  const selectedSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Loader2 className={`${selectedSize} animate-spin`} color={color} />
    </div>
  );
};

export default Spinner;
