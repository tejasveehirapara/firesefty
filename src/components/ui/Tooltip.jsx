"use client";
import React, { useState, useRef } from "react";

/**
 * Tooltip Component
 *
 * @param {ReactNode} children - The element that triggers the tooltip
 * @param {string} content - The text content of the tooltip
 * @param {string} position - top | bottom | left | right
 * @param {number} delay - delay in ms before showing
 * @param {string} className - Additional CSS classes
 */
const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 200,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[rgba(17,24,39,0.9)]",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-[rgba(17,24,39,0.9)]",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[rgba(17,24,39,0.9)]",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[rgba(17,24,39,0.9)]",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && content && (
        <div
          className={`
            absolute z-50 px-3 py-1.5
            text-[11px] font-semibold text-white
            bg-gray-900/90 backdrop-blur-md rounded-md
            shadow-xl border border-white/10 whitespace-nowrap
            animate-in fade-in zoom-in-95 slide-in-from-top-1
            duration-200 ease-out
            ${positionClasses[position] || positionClasses.top}
            ${className}
          `}
        >
          {content}

          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0 border-[5px] border-transparent
              ${arrowClasses[position] || arrowClasses.top}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
