"use client";
import { capitalizeFirstLetter } from "@/utils/CapitalizeFirstLetterUtils";
import React from "react";

const Chip = ({ status = "pending", name, className = "" }) => {
  const statusMap = {
    pending: "bg-[var(--chip-pending-bg)] text-[var(--chip-pending-text)]",
    success: "bg-[var(--chip-success-bg)] text-[var(--chip-success-text)]",
    warning: "bg-[var(--chip-warning-bg)] text-[var(--chip-warning-text)]",
    error: "bg-[var(--chip-error-bg)] text-[var(--chip-error-text)]",
    active: "bg-[var(--chip-active-bg)] text-[var(--chip-active-text)]",
    inactive: "bg-[var(--chip-inactive-bg)] text-[var(--chip-inactive-text)]",
    created: "bg-blue-50 text-blue-600 border border-blue-100",
    quotationsent: "bg-purple-50 text-purple-600 border border-purple-100",
    discussion: "bg-amber-50 text-amber-600 border border-amber-100",
    remindersent: "bg-indigo-50 text-indigo-600 border border-indigo-100",
    confirmed: "bg-cyan-50 text-cyan-600 border border-cyan-100",
    completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-rose-50 text-rose-600 border border-rose-100",
  };

  const lowerStatus = status.toLowerCase();
  const chipClass = statusMap[lowerStatus] || statusMap["pending"];

  const statusLabelMap = {
    "QuotationSent": "Quotation Sent",
    "ReminderSent": "Reminder Sent"

  }

  const displayText = name || statusLabelMap[status] || capitalizeFirstLetter(lowerStatus);

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${chipClass} ${className}`}
    >
      {displayText}
    </span>
  );
};

export default Chip;
