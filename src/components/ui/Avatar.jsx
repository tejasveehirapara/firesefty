"use client";
import React from "react";

const Avatar = ({
  src,
  alt = "Avatar",
  initials,
  size = "md",
  shape = "circle",
  className = "",
}) => {
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  const shapeMap = {
    circle: "rounded-[var(--avatar-radius-circle)]",
    square: "rounded-[var(--avatar-radius-square)]",
  };

  const containerClasses = `
        relative inline-flex items-center justify-center overflow-hidden
        bg-[var(--avatar-bg)] text-[var(--avatar-text)] font-semibold
        border-2 border-[var(--avatar-border)] shadow-[var(--avatar-shadow)]
        ${sizeMap[size] || sizeMap.md}
        ${shapeMap[shape] || shapeMap.circle}
        ${className}
    `.trim();

  return (
    <div className={containerClasses}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : null}

      {/* Fallback to Initials */}
      {!src && initials && (
        <span className="uppercase select-none">{initials.slice(0, 2)}</span>
      )}

      {/* Default fallback icon if nothing provided */}
      {!src && !initials && (
        <svg
          className="w-1/2 h-1/2 opacity-50"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
};

export default Avatar;
