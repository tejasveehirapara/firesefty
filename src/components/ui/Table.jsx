"use client";
import React, { useState, useMemo } from "react";
import Button from "@/components/ui/Button";

/**
 * Table Component
 *
 * @param {Array} columns - Array of column objects { key, label, render, sortable }
 * @param {Array} data - Array of data objects
 * @param {number} pageSize - Number of rows per page
 * @param {boolean} loading - Loading state
 * @param {string} emptyMessage - Message when no data is found
 * @param {function} onRowClick - Callback when a row is clicked
 * @param {function} onSort - Callback when sorting changes (returns { key, direction })
 *
 * Controlled Pagination Props (for API driven pagination):
 * @param {number} currentPage - Controlled current page (1-indexed)
 * @param {number} totalPages - Total number of pages from API
 * @param {number} totalItems - Total number of items across all pages
 * @param {function} onPageChange - Callback when page changes
 */
const Table = ({
  columns = [],
  data = [],
  pageSize = 10,
  loading = false,
  emptyMessage = "No data found",
  onRowClick,
  onSort,
  // Controlled pagination props
  currentPage: controlledPage,
  totalPages: controlledTotalPages,
  totalItems: controlledTotalItems,
  onPageChange,

  className = "",
  renderExpandedRow, // New prop for expandable content
}) => {
  const [internalPage, setInternalPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Use controlled props if provided, otherwise fallback to internal state
  const isRemote =
    controlledPage !== undefined && controlledTotalPages !== undefined;
  const currentPage = isRemote ? controlledPage : internalPage;

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }

    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);

    // Reset page to 1 on sort
    if (isRemote) {
      if (onPageChange) onPageChange(1);
    } else {
      setInternalPage(1);
    }

    if (onSort) {
      onSort(newSortConfig);
    }
  };

  const processedData = useMemo(() => {
    if (isRemote) return data; // Data is already sliced/sorted by API

    let sortableItems = [...data];
    if (sortConfig.key !== null && sortConfig.direction !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig, isRemote]);

  const totalPages = isRemote
    ? controlledTotalPages
    : Math.ceil(processedData.length / pageSize);
  const totalItemsCount = isRemote
    ? controlledTotalItems || data.length
    : processedData.length;

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = isRemote
    ? data
    : processedData.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      if (isRemote) {
        if (onPageChange) onPageChange(page);
      } else {
        setInternalPage(page);
      }
    }
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <div className="overflow-hidden border border-[var(--table-border)] rounded-[var(--table-radius)] bg-[var(--color-surface)] shadow-md transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--table-header-bg)]/50 border-b border-[var(--table-border)]">
                {/* Expand Toggle Header */}
                {renderExpandedRow && <th className="w-10 px-6 py-4" />}

                {columns.map((col) => {
                  const isSortable = col.sortable;
                  const isSorted = sortConfig.key === col.key;
                  const alignment = col.align === "right" ? "justify-end text-right" : col.align === "center" ? "justify-center text-center" : "justify-start text-left";

                  return (
                    <th
                      key={col.key}
                      onClick={() => isSortable && handleSort(col.key)}
                      align={col?.align}
                      className={`text-xs sm:text-sm
                        px-3 sm:px-6 sm:py-4 py-2 text-[12px] font-bold uppercase tracking-wider text-[var(--table-header-text)]
                        ${isSortable ? "cursor-pointer  transition-all group" : ""}
                        ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                      `}
                    >
                      <div className={`flex items-center gap-2 ${alignment}`}>
                        {col.label}
                        {isSortable && (
                          <div
                            className={`flex flex-col gap-0.5 transition-all duration-300 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
                          >
                            <svg
                              className={`w-2.5 h-2.5 ${isSorted && sortConfig.direction === "asc" ? "fill-[var(--color-brand-primary)]" : "fill-[var(--color-gray-400)]"}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
                            </svg>
                            <svg
                              className={`w-2.5 h-2.5 ${isSorted && sortConfig.direction === "desc" ? "fill-[var(--color-brand-primary)]" : "fill-[var(--color-gray-400)]"}`}
                              viewBox="0 0 24 24"
                            >
                              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--table-border)]/50">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin"></div>

                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => {
                  const isExpanded = expandedRows.has(row.id || rowIndex);
                  return (
                    <React.Fragment key={row.id || rowIndex}>
                      <tr
                        onClick={() => {
                          // if (renderExpandedRow) toggleRow(row.id || rowIndex);
                          // else
                          if (onRowClick) onRowClick(row);
                        }}
                        className={`
                          transition-colors duration-200 border-b border-[var(--table-border)]/50 last:border-0
                          ${(onRowClick || renderExpandedRow) ? "cursor-pointer hover:bg-[var(--table-row-hover)]" : "hover:bg-[var(--table-row-hover)]"}
                          ${isExpanded ? "bg-[var(--table-row-hover)]" : ""}
                        `}
                      >
                        {/* Expand Toggle Column */}
                        {renderExpandedRow && (
                          <td className="w-10 px-6 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(row.id || rowIndex);
                              }}
                              className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-[var(--color-brand-primary)]" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        )}

                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`
                                px-3 sm:px-6 sm:py-4 py-3  text-sm font-medium text-[var(--color-text-secondary)]
                              ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                            `}
                          >
                            {col.render
                              ? col.render(row[col.key], row)
                              : row[col.key]}
                          </td>
                        ))}
                      </tr>

                      {/* Expanded Row Content */}
                      {isExpanded && renderExpandedRow && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={columns.length + (renderExpandedRow ? 1 : 0)} className="px-6 py-4 border-b border-[var(--table-border)]/50">
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                              {renderExpandedRow(row)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (renderExpandedRow ? 1 : 0)}
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <span className="text-sm text-[var(--color-text-tertiary)] font-medium">
                        {emptyMessage}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-[13px] text-[var(--color-text-tertiary)] font-medium">
            Showing <span className="text-[var(--color-text-primary)] font-bold">{startIndex + 1}</span> to{" "}
            <span className="text-[var(--color-text-primary)] font-bold">{Math.min(startIndex + pageSize, totalItemsCount)}</span> of{" "}
            <span className="text-[var(--color-text-primary)] font-bold">{totalItemsCount}</span> results
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="small"
              className="!w-9 !h-9 !p-0 flex items-center justify-center !rounded-xl border-[var(--color-gray-200)] !shadow-none"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              startIcon={
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              }
              label=""
            />

            <div className="flex items-center gap-1.5">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`
                        w-9 h-9 rounded-xl text-[13px] font-bold transition-all
                        ${currentPage === pageNum
                          ? "bg-[var(--color-brand-primary)] text-white shadow-md shadow-blue-500/20"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]"
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <span key={pageNum} className="text-[var(--color-gray-400)] font-bold px-1">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="small"
              className="!w-9 !h-9 !p-0 flex items-center justify-center !rounded-xl border-[var(--color-gray-200)] !shadow-none"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              startIcon={
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              }
              label=""
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
