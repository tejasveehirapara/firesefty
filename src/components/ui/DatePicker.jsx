"use client";
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/**
 * DatePicker Component
 *
 * @param {Date | string} value - Current date value
 * @param {function} onChange - Callback when date changes
 * @param {Date | string} minDate - Minimum selectable date
 * @param {Date | string} maxDate - Maximum selectable date
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {string} placeholder - Input placeholder
 * @param {boolean} disabled - Disabled state
 * @param {boolean} required - Required state
 */
const DatePicker = ({
  value,
  onChange,
  mode = "single", // "single" | "range"
  minDate: minDateProp,
  maxDate: maxDateProp,
  label,
  error,
  placeholder = "Select date",
  disabled = false,
  required = false,
  className = "",
  datePickerClass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("calendar"); // calendar | months | years
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 300; // Fixed width of dropdown

      let left = rect.left + scrollX;

      // If dropdown would overflow right side of screen
      if (rect.left + dropdownWidth > viewportWidth) {
        left = rect.right + scrollX - dropdownWidth;
      }

      // If still overflowing left side (very small screens)
      if (left < 0) {
        left = 8; // Small padding from edge
      }

      setCoords({
        top: rect.bottom + scrollY,
        left: left,
        width: rect.width,
        rect: rect
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  // Normalize Min/Max dates
  const minDate = useMemo(
    () => (minDateProp ? new Date(minDateProp) : null),
    [minDateProp],
  );
  const maxDate = useMemo(
    () => (maxDateProp ? new Date(maxDateProp) : null),
    [maxDateProp],
  );

  // Parse initial value
  const selectedDate = useMemo(() => {
    if (!value) return mode === "range" ? { start: null, end: null } : null;

    if (mode === "range") {
      const start = value.start ? new Date(value.start) : null;
      const end = value.end ? new Date(value.end) : null;
      return {
        start: start && !isNaN(start.getTime()) ? start : null,
        end: end && !isNaN(end.getTime()) ? end : null,
      };
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }, [value, mode]);

  useEffect(() => {
    const focusDate = mode === "range" ? selectedDate.start : selectedDate;
    if (focusDate && isOpen) {
      setCurrentMonth(
        new Date(focusDate.getFullYear(), focusDate.getMonth(), 1),
      );
    }
  }, [selectedDate, isOpen, mode]);

  // Close and reset view on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setTimeout(() => setView("calendar"), 200);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrev = (e) => {
    e.stopPropagation();
    if (view === "calendar") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
      );
    } else if (view === "years") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 12, currentMonth.getMonth(), 1),
      );
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (view === "calendar") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
      );
    } else if (view === "years") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 12, currentMonth.getMonth(), 1),
      );
    }
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (mode === "range") {
      if (!selectedDate.start || (selectedDate.start && selectedDate.end)) {
        // Start new range
        onChange({ start: newDate, end: null });
      } else {
        // Complete the range
        if (newDate < selectedDate.start) {
          onChange({ start: newDate, end: null });
        } else {
          onChange({ start: selectedDate.start, end: newDate });
          setIsOpen(false);
          setTimeout(() => setView("calendar"), 200);
        }
      }
    } else {
      if (onChange) onChange(newDate);
      setIsOpen(false);
      setTimeout(() => setView("calendar"), 200);
    }
  };

  const isDateDisabled = (year, month, day) => {
    const date = new Date(year, month, day);
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999)))
      return true;
    return false;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long" });
  const yearNum = currentMonth.getFullYear();

  // Calendar Day Generation
  const days = [];
  const totalDays = daysInMonth(yearNum, currentMonth.getMonth());
  const startingDay = firstDayOfMonth(yearNum, currentMonth.getMonth());
  for (let i = 0; i < startingDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (mode === "range") {
      const date = new Date(yearNum, currentMonth.getMonth(), day);
      const start = selectedDate.start;
      const end = selectedDate.end;

      if (!start) return false;

      const isStart =
        date.getDate() === start.getDate() &&
        date.getMonth() === start.getMonth() &&
        date.getFullYear() === start.getFullYear();

      if (!end) return isStart;

      const isEnd =
        date.getDate() === end.getDate() &&
        date.getMonth() === end.getMonth() &&
        date.getFullYear() === end.getFullYear();

      return isStart || isEnd;
    }

    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isInRange = (day) => {
    if (mode !== "range" || !selectedDate.start) return false;

    const date = new Date(yearNum, currentMonth.getMonth(), day);
    const start = selectedDate.start;
    const end = selectedDate.end || hoverDate;

    if (!start || !end) return false;

    return date > start && date < end;
  };

  const isRangeEdge = (day) => {
    if (mode !== "range" || !selectedDate.start || !selectedDate.end)
      return null;

    const date = new Date(yearNum, currentMonth.getMonth(), day);

    if (
      date.getTime() ===
      new Date(
        selectedDate.start.getFullYear(),
        selectedDate.start.getMonth(),
        selectedDate.start.getDate(),
      ).getTime()
    )
      return "start";
    if (
      date.getTime() ===
      new Date(
        selectedDate.end.getFullYear(),
        selectedDate.end.getMonth(),
        selectedDate.end.getDate(),
      ).getTime()
    )
      return "end";

    return null;
  };

  // Month/Year List Generation
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startYear = yearNum - (yearNum % 12);
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  return (
    <div
      className={`relative flex flex-col gap-1.5 ${className}`}
      ref={containerRef}
    >
      {label && (
        <label
          className={`text-sm font-medium ${error ? "text-[var(--input-label-error)]" : "text-[var(--input-label)]"}`}
        >
          {label}{" "}
          {required && (
            <span className="text-[var(--input-label-error)] ml-0.5">*</span>
          )}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          ${datePickerClass}
          flex items-center gap-3 px-3 h-10 rounded-md border transition-all cursor-pointer 
          ${disabled ? "bg-[var(--input-disabled-bg)] cursor-not-allowed opacity-60" : ""}
          ${error
            ? "border-[var(--input-border-error)]"
            : isOpen
              ? "border-[var(--color-brand-primary)]"
              : "border-[var(--input-border)]"
          }
        `}
      >
        <CalendarIcon
          className={`w-4 h-4 ${error ? "text-[var(--input-border-error)]" : "text-gray-400"}`}
        />
        <span
          className={`text-sm flex-1 ${(mode === "range" && selectedDate.start) || (mode !== "range" && selectedDate) ? "text-gray-900" : "text-gray-400"}`}
        >
          {mode === "range" ? (
            selectedDate.start ? (
              <>
                {formatDate(selectedDate.start)}
                {selectedDate.end && ` - ${formatDate(selectedDate.end)}`}
              </>
            ) : (
              placeholder
            )
          ) : selectedDate ? (
            formatDate(selectedDate)
          ) : (
            placeholder
          )}
        </span>
        {((mode === "range" && selectedDate.start) ||
          (mode !== "range" && selectedDate)) &&
          !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(
                  mode === "range" ? { start: null, end: null } : null,
                );
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
      </div>

      {error && (
        <span className="text-xs text-[var(--input-label-error)] ml-0.5">
          {error}
        </span>
      )}
      {isOpen && mounted && coords.top !== 0 && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: `${coords.top + 8}px`,
            left: `${coords.left}px`,
            width: "300px",
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 font-bold text-sm text-gray-900">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setView(view === "months" ? "calendar" : "months");
                }}
                className="hover:bg-gray-100 px-2 py-0.5 rounded transition-colors"
              >
                {monthName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setView(view === "years" ? "calendar" : "years");
                }}
                className="hover:bg-gray-100 px-2 py-0.5 rounded transition-colors"
              >
                {yearNum}
              </button>
            </div>
            {(view === "calendar" || view === "years") && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Views */}
          {view === "calendar" && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-black uppercase text-gray-400 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                  const disabledDay = day
                    ? isDateDisabled(yearNum, currentMonth.getMonth(), day)
                    : false;
                  return (
                    <div
                      key={i}
                      className="aspect-square flex items-center justify-center"
                    >
                      {day && (
                        <button
                          disabled={disabledDay}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateSelect(day);
                          }}
                          onMouseEnter={() => {
                            if (
                              mode === "range" &&
                              selectedDate.start &&
                              !selectedDate.end
                            ) {
                              setHoverDate(
                                new Date(yearNum, currentMonth.getMonth(), day),
                              );
                            }
                          }}
                          onMouseLeave={() => {
                            if (mode === "range") setHoverDate(null);
                          }}
                          className={`
                            w-full h-full text-xs font-semibold transition-all relative z-10
                            ${isSelected(day)
                              ? "bg-[var(--color-brand-primary)] text-white shadow-md shadow-blue-200 rounded-lg"
                              : isToday(day)
                                ? "text-[var(--color-brand-primary)] bg-blue-50 ring-1 ring-blue-100 rounded-lg"
                                : disabledDay
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-600 hover:bg-gray-100 rounded-lg"
                            }
                            ${isInRange(day) ? "bg-blue-50 text-[var(--color-brand-primary)] !rounded-none" : ""}
                            ${isRangeEdge(day) === "start" ? "!rounded-r-none" : ""}
                            ${isRangeEdge(day) === "end" ? "!rounded-l-none" : ""}
                          `}
                        >
                          {day}
                          {isInRange(day) && (
                            <div className="absolute inset-0 bg-blue-50 -z-10" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {view === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button
                  key={m}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMonth(new Date(yearNum, i, 1));
                    setView("calendar");
                  }}
                  className={`py-3 text-xs font-bold rounded-lg transition-colors ${currentMonth.getMonth() === i ? "bg-blue-50 text-[var(--color-brand-primary)]" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {view === "years" && (
            <div className="grid grid-cols-3 gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMonth(new Date(y, currentMonth.getMonth(), 1));
                    setView("calendar");
                  }}
                  className={`py-3 text-xs font-bold rounded-lg transition-colors ${yearNum === y ? "bg-blue-50 text-[var(--color-brand-primary)]" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Footer (only in calendar view) */}
          {view === "calendar" && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <button
                onClick={() => {
                  const today = new Date();
                  if (
                    !isDateDisabled(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                    )
                  ) {
                    handleDateSelect(today.getDate());
                  } else {
                    setCurrentMonth(
                      new Date(today.getFullYear(), today.getMonth(), 1),
                    );
                  }
                }}
                className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-primary)] hover:underline"
              >
                Today
              </button>
              <button
                onClick={() => setView("years")}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
              >
                Go to Year
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DatePicker;
