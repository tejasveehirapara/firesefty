"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Package, ShoppingCart, TrendingUp,
    AlertTriangle, ShoppingBag, ArrowRight, Package2
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import { clearCurrentUser } from "@/utils/AuthCookie";

// ── Compact Stat Card ──
function StatCard({ title, value, icon: Icon, color, loading }) {
    const colorMap = {
        blue: { iconBg: "bg-blue-50", iconText: "text-blue-600", valText: "text-blue-700", border: "border-blue-100" },
        green: { iconBg: "bg-green-50", iconText: "text-green-600", valText: "text-green-700", border: "border-green-100" },
        purple: { iconBg: "bg-purple-50", iconText: "text-purple-600", valText: "text-purple-700", border: "border-purple-100" },
        orange: { iconBg: "bg-orange-50", iconText: "text-orange-600", valText: "text-orange-700", border: "border-orange-100" },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <div className={`bg-white rounded-2xl border ${c.border} px-5 py-4 shadow-sm flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconText} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 truncate">{title}</p>
                {loading ? (
                    <div className="h-6 w-20 bg-gray-100 rounded animate-pulse mt-1" />
                ) : (
                    <p className={`text-xl font-black mt-0.5 ${c.valText} truncate`}>{value}</p>
                )}
            </div>
        </div>
    );
}

// ── Custom Tooltip ──
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
            <p className="font-bold text-gray-700 mb-2">{label}</p>
            {payload.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
                    <span className="text-gray-500 capitalize">{entry.name}:</span>
                    <span className="font-bold text-gray-800">₹{entry.value.toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);


    const handleGetDashboardData = async () => {
        const res = await fetch("/api/dashboard")
        const data = await res.json()
        if (data.code === 401) {
            clearCurrentUser()
            router.push("/");
            return;
        }
        setData(data)
        setLoading(false)
    }

    useEffect(() => {
        handleGetDashboardData()
        // .then(r => r.json())
        // .then(d => { setData(d); setLoading(false); })
        // .catch((err) => { setLoading(false); console.log(err, "ERRR"); });
    }, []);

    const stats = data?.stats || {};
    const chartData = data?.chartData || [];
    const lowStockAlerts = data?.lowStockAlerts || [];
    const recentTransactions = data?.recentTransactions || [];

    const formatRupees = (amount) => {
        if (amount === undefined || amount === null) return "—";
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount.toFixed(0)}`;
    };

    const statCards = [
        { title: "Total Users", value: stats.totalUsers?.toLocaleString() ?? "—", icon: Users, color: "blue" },
        { title: "Total Products", value: stats.totalProducts?.toLocaleString() ?? "—", icon: Package, color: "green" },
        { title: "Total Purchases", value: formatRupees(stats.totalPurchaseAmount), icon: ShoppingCart, color: "purple" },
        { title: "Total Sales", value: formatRupees(stats.totalSaleAmount), icon: TrendingUp, color: "orange" },
    ];

    return (
        <div className="flex flex-col gap-6">

            {/* ── Header ── */}
            {/* <div>
                <h2 className="text-2xl font-black text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-400 mt-0.5 text-sm">Here's what's happening with your store right now.</p>
            </div> */}

            {/* ── Compact Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <StatCard key={card.title} {...card} loading={loading} />
                ))}
            </div>

            {/* ── Line Chart ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Monthly Overview</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Purchases vs Sales — last 6 months (₹)</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-purple-600">
                            <span className="w-3 h-0.5 bg-purple-500 rounded inline-block" />
                            Purchases
                        </span>
                        <span className="flex items-center gap-1.5 text-orange-500">
                            <span className="w-3 h-0.5 bg-orange-400 rounded inline-block" />
                            Sales
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="h-56 bg-gray-50 rounded-xl animate-pulse" />
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`}
                                width={55}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="purchases"
                                stroke="#a855f7"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#a855f7", strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="#f97316"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Bottom Grid: Recent Transactions + Low Stock ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Latest sales activity</p>
                        </div>
                        <Button
                            variant="outline"
                            size="small"
                            className="!rounded-xl !text-xs font-bold"
                            label="View All"
                            onClick={() => router.push("/quotations")}
                            startIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        />
                    </div>

                    <div className="flex-1 divide-y divide-gray-50 overflow-x-auto scrollbar-hide">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded w-16" />
                                </div>
                            ))
                        ) : recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                                <ShoppingBag className="w-9 h-9 mb-2" />
                                <p className="text-sm font-medium">No sales yet</p>
                            </div>
                        ) : (
                            recentTransactions.map((txn) => {
                                const initials = txn.buyerName
                                    ?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                                return (
                                    <div key={txn.id} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50/70 transition-colors gap-4">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--color-brand-primary)] font-black text-xs shrink-0">
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                                                        {txn.buyerName}
                                                    </p>
                                                    <span className="hidden sm:inline text-xs text-gray-400 font-normal truncate">
                                                        • {txn.buyerEmail}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 truncate max-w-full sm:max-w-[240px]">
                                                    {txn.products || "No products"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 shrink-0">
                                            <div className="order-2 sm:order-1 scale-90 sm:scale-100 origin-right">
                                                <Chip status={txn.status} />
                                            </div>
                                            <div className="text-right shrink-0 order-1 sm:order-2">
                                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                                    {txn.totalQty} unit{txn.totalQty !== 1 ? "s" : ""}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">
                                                    {new Date(txn.createdAt).toLocaleDateString("en-US", {
                                                        month: "short", day: "2-digit", year: "numeric"
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-2 mb-0.5">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <h3 className="text-sm font-bold text-gray-900">Low Stock Alerts</h3>
                        </div>
                        <p className="text-xs text-gray-400">Products with ≤ 10 units remaining</p>
                    </div>

                    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                            ))
                        ) : lowStockAlerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                <Package2 className="w-9 h-9 mb-2" />
                                <p className="text-sm font-medium">All products well stocked</p>
                            </div>
                        ) : (
                            lowStockAlerts.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-colors ${item.currentStock === 0
                                        ? "bg-red-50/60 border-red-100 hover:bg-red-50"
                                        : "bg-orange-50/60 border-orange-100 hover:bg-orange-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.currentStock === 0 ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-500"
                                            }`}>
                                            <Package className="w-3.5 h-3.5" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-base font-black ${item.currentStock === 0 ? "text-red-600" : "text-orange-600"
                                            }`}>
                                            {item.currentStock}
                                        </span>
                                        <p className={`text-[10px] font-bold uppercase tracking-wide ${item.currentStock === 0 ? "text-red-400" : "text-orange-400"
                                            }`}>
                                            {item.currentStock === 0 ? "Out" : "Left"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-50">
                        <Button
                            className="w-full !rounded-xl"
                            variant="outline"
                            label="Manage Inventory"
                            onClick={() => router.push("/inventory")}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
