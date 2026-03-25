"use client";
import React, { useState, useRef, useEffect } from "react";

/**
 * ImageDropzone Component
 *
 * @param {string} label - Label for the dropzone
 * @param {boolean} multiple - Allow multiple images
 * @param {number} maxSize - Maximum file size in MB
 * @param {function} onChange - Callback when images are selected/removed
 * @param {string} error - External error message
 * @param {boolean} disabled - Whether the dropzone is disabled
 */
const ImageDropzone = ({
  label,
  multiple = false,
  maxSize, // in MB
  onChange,
  error,
  disabled = false,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [internalError, setInternalError] = useState("");
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    if (disabled) return;
    setInternalError("");

    const filesArray = Array.from(files);

    // Only allow images
    const nonImages = filesArray.some((f) => !f.type.startsWith("image/"));
    if (nonImages) {
      setInternalError("Only image files are allowed");
      return;
    }

    // Validation
    if (maxSize) {
      const oversized = filesArray.some((f) => f.size > maxSize * 1024 * 1024);
      if (oversized) {
        setInternalError(`Images must be under ${maxSize}MB`);
        return;
      }
    }

    const newFiles = multiple
      ? [...previews.map((p) => p.file), ...filesArray]
      : filesArray;

    // Create previews
    const newPreviews = filesArray.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updatedPreviews = multiple
      ? [...previews, ...newPreviews]
      : newPreviews;
    setPreviews(updatedPreviews);

    if (onChange)
      onChange(multiple ? updatedPreviews.map((p) => p.file) : filesArray[0]);
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

  const removeImage = (index) => {
    if (disabled) return;
    const removed = previews[index];
    URL.revokeObjectURL(removed.url);

    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);

    const currentFiles = updatedPreviews.map((p) => p.file);
    if (onChange) onChange(multiple ? currentFiles : currentFiles[0] || null);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

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
          relative flex flex-col items-center justify-center p-6 min-h-[160px]
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
          accept="image/*"
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <svg
            className={`w-10 h-10 mb-2 transition-colors duration-300 ${isDragging ? "text-[var(--color-brand-primary)]" : "text-[var(--uploader-icon)]"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-[var(--uploader-text)] font-medium">
            <span className="text-[var(--color-brand-primary)]">
              Upload image
            </span>{" "}
            or drag here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP {maxSize && `up to ${maxSize}MB`}
          </p>
        </div>
      </div>

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 animate-in zoom-in-95 duration-200"
            >
              <img
                src={preview.url}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  disabled={disabled}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <span className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
          {displayError}
        </span>
      )}
    </div>
  );
};

export default ImageDropzone;
