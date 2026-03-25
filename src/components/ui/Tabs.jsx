"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const TabsContext = createContext(null);

/**
 * Tabs Component (Root)
 */
export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  className = "",
  children,
}) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setActiveTab(value);
    }
  }, [value]);

  const handleTabChange = (newValue) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, handleTabChange, orientation }}>
      <div
        className={`flex ${orientation === "vertical" ? "flex-row" : "flex-col"} gap-4 ${className}`}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * TabsList - Wrapper for tab triggers
 */
export const TabsList = ({ className = "", children, variant = "pill" }) => {
  const { orientation } = useContext(TabsContext);

  const variants = {
    pill: "bg-[var(--tabs-bg)] p-1 rounded-lg",
    underline:
      "bg-transparent border-b border-[var(--tabs-border)] rounded-none p-0 inline-flex items-center",
  };

  return (
    <div
      className={`
      relative inline-flex 
      ${orientation === "vertical" ? "flex-col items-start" : "items-center overflow-x-auto overflow-y-hidden scrollbar-none max-w-full"}
      ${variants[variant]}
      ${className}
    `}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { variant });
        }
        return child;
      })}
    </div>
  );
};

/**
 * TabsTrigger - The clickable tab header
 */
export const TabsTrigger = ({
  value,
  children,
  className = "",
  variant = "pill",
}) => {
  const { activeTab, handleTabChange, orientation } = useContext(TabsContext);
  const isActive = activeTab === value;

  const baseStyles =
    "relative px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none whitespace-nowrap";

  const variantStyles = {
    pill: `
      rounded-md z-10
      ${isActive
        ? "text-[var(--tabs-trigger-active-text)] bg-[var(--tabs-indicator-bg)] shadow-sm"
        : "text-[var(--tabs-trigger-text)] hover:text-[var(--tabs-trigger-active-text)]"
      }
    `,
    underline: `
      border-b-2 -mb-[1px]
      ${isActive
        ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]"
        : "border-transparent text-[var(--tabs-trigger-text)] hover:text-[var(--tabs-trigger-active-text)] hover:border-[var(--tabs-border)]"
      }
    `,
  };

  return (
    <button
      onClick={() => handleTabChange(value)}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

/**
 * TabsContent - The panel displayed for a specific tab
 */
export const TabsContent = ({ value, children, className = "" }) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) return null;

  return (
    <div
      className={`
      animate-in fade-in zoom-in-95 duration-200 
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export default Tabs;
