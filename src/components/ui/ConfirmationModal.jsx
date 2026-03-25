"use client";
import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

/**
 * ConfirmationModal Component
 *
 * @param {boolean} isOpen - Modal state
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm action handler
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmLabel - Label for confirm button
 * @param {string} cancelLabel - Label for cancel button
 * @param {string} variant - 'danger' | 'warning' | 'primary'
 * @param {boolean} isLoading - Loading state for confirm button
 */
const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    isLoading = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            headerLabel={title}
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        label={cancelLabel}
                        onClick={onClose}
                        disabled={isLoading}
                    />
                    <Button
                        variant={variant}
                        label={isLoading ? "Processing..." : confirmLabel}
                        onClick={onConfirm}
                        disabled={isLoading}
                    />
                </div>
            }
        >
            <div className="flex items-start gap-4 p-2">
                <div className={`
                    p-3 rounded-full flex-shrink-0
                    ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}
                `}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-gray-600 text-sm leading-relaxed mt-1">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
