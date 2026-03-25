"use client";
import React from "react";
import Button from "@/components/ui/Button";

/**
 * ActionButton Component
 *
 * @param {React.ReactNode} icon - Lucide icon component
 * @param {function} onClick - Click handler
 * @param {string} variant - 'edit' | 'delete' | 'view' | 'primary'
 * @param {string} title - Tooltip title
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional classes
 */
const ActionButton = ({
    icon: Icon,
    onClick,
    variant = "edit",
    title = "",
    disabled = false,
    className = "",
}) => {
    const variantClasses = {
        edit: "!bg-gray-100 text-gray-700 hover:!bg-black hover:text-white",
        delete: "!bg-red-50 text-red-600 hover:!bg-red-600 hover:text-white border border-red-100",
        view: "!bg-blue-50 text-[var(--color-brand-primary)] hover:!bg-[var(--color-brand-primary)] hover:text-white border border-blue-100",
        primary: "!bg-[var(--color-brand-primary)] text-white hover:opacity-90 shadow-sm",
        reset: "!bg-orange-50 text-orange-600 hover:!bg-orange-600 hover:text-white border border-orange-100",
    };

    const handleClick = (e) => {
        e.stopPropagation();
        if (onClick) onClick(e);
    };

    return (
        <Button
            onClick={handleClick}
            disabled={disabled}
            title={title}
            variant="outline"
            size="small"
            className={`
                !p-2 !rounded-lg !shadow-sm hover:!shadow active:!scale-95
                !flex !items-center !justify-center
                disabled:!opacity-50 disabled:!cursor-not-allowed disabled:active:!scale-100
                border-transparent
                ${variantClasses[variant] || variantClasses.edit}
                ${className}
            `}
            startIcon={Icon ? <Icon className="h-4 w-4" /> : null}
            label=""
        />
    );
};

export default ActionButton;