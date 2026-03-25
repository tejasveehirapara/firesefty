"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle, Package, XCircle, TrendingUp, TrendingDown, ShoppingCart } from "lucide-react";
import Table from "@/components/ui/Table";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
    const router = useRouter();
    const [inventory, setInventory] = useState([]);
    const [summary, setSummary] = useState({ totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all | low | out
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory?page=${currentPage}&pageSize=${pageSize}&filter=${filter}`);
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                setInventory(data.inventory);
                setSummary(data.summary);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            console.error("Failed to fetch inventory", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filter]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const maxStock = Math.max(...inventory.map(i => i.currentStock), 1);

    const columns = [
        {
            key: "name",
            label: "Product",
            render: (name, row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${row.status === "Out of Stock"
                        ? "bg-red-50 border-red-100 text-red-400"
                        : row.status === "Low Stock"
                            ? "bg-yellow-50 border-yellow-100 text-yellow-500"
                            : "bg-blue-50 border-blue-100 text-[var(--color-brand-primary)]"
                        }`}>
                        <Package className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 text-sm leading-tight">{name}</div>
                        {row.description && (
                            <div className="text-xs text-gray-400 font-medium line-clamp-1 max-w-[200px]">{row.description}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "totalPurchased",
            label: "Purchased",
            render: (val) => (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {val} units
                </div>
            ),
        },
        {
            key: "totalSold",
            label: "Sold",
            render: (val) => (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-600">
                    <TrendingDown className="w-3.5 h-3.5" />
                    {val} units
                </div>
            ),
        },
        {
            key: "currentStock",
            label: "Current Stock",
            sortable: true,
            render: (stock, row) => (
                <div className="w-full max-w-[160px]">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className={`font-bold ${row.status === "Out of Stock" ? "text-red-600" :
                            row.status === "Low Stock" ? "text-yellow-600" :
                                "text-gray-800"
                            }`}>{stock} units</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${stock === 0 ? "bg-red-500" :
                                stock <= 10 ? "bg-yellow-400" :
                                    "bg-green-500"
                                }`}
                            style={{ width: `${Math.min((stock / maxStock) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (status) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${status === "In Stock"
                    ? "bg-green-50 text-green-700 border-green-100"
                    : status === "Low Stock"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                    {status === "In Stock"
                        ? <CheckCircle className="w-3 h-3" />
                        : status === "Low Stock"
                            ? <AlertTriangle className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />
                    }
                    {status}
                </span>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Products", value: summary.totalProducts, color: "blue", icon: Package },
                    { label: "In Stock", value: summary.inStock, color: "green", icon: CheckCircle },
                    { label: "Low Stock", value: summary.lowStock, color: "yellow", icon: AlertTriangle },
                    { label: "Out of Stock", value: summary.outOfStock, color: "red", icon: XCircle },
                ].map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${color === "blue" ? "border-blue-100" :
                        color === "green" ? "border-green-100" :
                            color === "yellow" ? "border-yellow-100" :
                                "border-red-100"
                        }`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color === "blue" ? "bg-blue-50 text-[var(--color-brand-primary)]" :
                            color === "green" ? "bg-green-50 text-green-600" :
                                color === "yellow" ? "bg-yellow-50 text-yellow-600" :
                                    "bg-red-50 text-red-600"
                            }`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className={`text-2xl font-black ${color === "blue" ? "text-[var(--color-brand-primary)]" :
                                color === "green" ? "text-green-700" :
                                    color === "yellow" ? "text-yellow-700" :
                                        "text-red-700"
                                }`}>{value}</div>
                            <div className="text-xs text-gray-500 font-medium">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[var(--table-radius)] border border-[var(--table-border)] flex flex-col overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">Inventory Status</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Real-time stock levels based on purchases and sales</p>
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: "all", label: "All Items" },
                            { key: "low", label: "Low Stock" },
                            { key: "out", label: "Out of Stock" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => handleFilterChange(key)}
                                className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all ${filter === key
                                    ? "bg-gray-900 text-white shadow-sm"
                                    : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-600"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4">
                    <Table
                        columns={columns}
                        data={inventory}
                        loading={loading}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
}
