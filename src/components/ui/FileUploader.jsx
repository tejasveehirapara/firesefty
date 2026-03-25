"use client";
import React, { useState, useRef } from "react";

/**
 * FileUploader Component
 *
 * @param {string} label - Label for the uploader
 * @param {boolean} multiple - Allow multiple files
 * @param {string} accept - Accepted file types (e.g., "image/*,application/pdf")
 * @param {number} maxSize - Maximum file size in MB
 * @param {function} onChange - Callback when files are selected
 * @param {string} error - External error message
 * @param {boolean} disabled - Whether the uploader is disabled
 */
const FileUploader = ({
  label,
  multiple = false,
  accept,
  maxSize, // in MB
  onChange,
  error,
  disabled = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [internalError, setInternalError] = useState("");
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    if (disabled) return;
    setInternalError("");

    const filesArray = Array.from(files);

    // Validation
    if (maxSize) {
      const oversized = filesArray.some((f) => f.size > maxSize * 1024 * 1024);
      if (oversized) {
        setInternalError(`Files must be under ${maxSize}MB`);
        return;
      }
    }

    const newFiles = multiple ? [...selectedFiles, ...filesArray] : filesArray;
    setSelectedFiles(newFiles);
    if (onChange) onChange(multiple ? newFiles : newFiles[0]);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    if (disabled) return;
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (onChange) onChange(multiple ? newFiles : newFiles[0] || null);
  };

  const displayError = error || internalError;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-[var(--input-label)]"}`}
        >
          {label}
        </label>
      )}

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-8 
          border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer
          ${
            isDragging
              ? "border-[var(--uploader-border-hover)] bg-[var(--uploader-bg-hover)] scale-[1.01]"
              : "border-[var(--uploader-border)] bg-[var(--uploader-bg)]"
          }
          ${displayError ? "border-red-500" : "hover:border-[var(--uploader-border-hover)] hover:bg-[var(--uploader-bg-hover)]"}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          className="hidden"
        />

        <svg
          className={`w-12 h-12 mb-3 transition-colors duration-300 ${isDragging ? "text-[var(--color-brand-primary)]" : "text-[var(--uploader-icon)]"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="text-sm text-[var(--uploader-text)] font-medium">
          <span className="text-[var(--color-brand-primary)]">
            Click to upload
          </span>{" "}
          or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {accept ? accept.replace(/\*/g, "").toUpperCase() : "Any file"}{" "}
          {maxSize && `up to ${maxSize}MB`}
        </p>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200"
            >
              <span className="text-xs font-medium truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={disabled}
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <span className="text-xs text-red-500 font-medium">{displayError}</span>
      )}
    </div>
  );
};

export default FileUploader;
