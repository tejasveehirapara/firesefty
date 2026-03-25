"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Package,
    Store,
    TrendingUp,
    ShoppingCart,
    ClipboardList,
    LogOut,
    Shield,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { showToast } from "@/utils/toast";
import { clearCurrentUser } from "@/utils/AuthCookie";

// Icon mapping based on screen names
const iconMap = {
    Dashboard: LayoutDashboard,
    Users: Users,
    Products: Package,
    Vendors: Store,
    Sales: TrendingUp,
    Purchases: ShoppingCart,
    Inventory: ClipboardList,
};

const Sidebar = ({ setIsSidebarOpen }) => {

    const router = useRouter()
    const [menuItems, setMenuItems] = useState([]);
    const pathname = usePathname();

    useEffect(() => {
        // Get sidebar data from localStorage
        try {
            const storedData = localStorage.getItem("sidebarData");
            if (storedData) {
                setMenuItems(JSON.parse(storedData));
            }
        } catch (error) {
            console.error("Error parsing sidebar data:", error);
        }
    }, []);

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                clearCurrentUser()
                localStorage.removeItem('sidebarData');
                showToast('success', 'Logged out successfully');
                router.push('/');
            } else {
                showToast('error', 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showToast('error', 'Internal server error');
        }
    };

    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("current_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error("Error parsing user data:", error);
            }
        }
    }, []);

    const userInitial = user?.firstName?.charAt(0).toUpperCase() || 'A';
    const userName = user ? `${user.firstName} ${user.lastName}` : "Admin User";
    const userEmail = user ? user.email : "admin@firesefty.com";


    return (
        <div
            className={`h-screen transition-all duration-300 flex flex-col shadow-2xl w-64`}
            style={{ backgroundColor: "var(--color-brand-primary)", borderRight: "1px solid rgba(255,255,255,0.1)" }}
        >
            {/* Sidebar Header */}
            <div className={`h-24 flex items-center justify-between px-5`}>
                <div className={`flex items-center gap-3 transition-opacity duration-200 overflow-hidden `}>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                        <Shield className="w-6 h-6" style={{ color: "var(--color-brand-primary)" }} />
                    </div>
                    <div>
                        <h1 className="font-bold  text-lg text-white leading-none tracking-tight">Universal Safety Solutions</h1>
                        {/* <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100/60 mt-1 block">Admin Panel</span> */}
                    </div>
                </div>


            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-none">
                {menuItems.map((item, index) => {
                    const Icon = iconMap[item.screenName] || LayoutDashboard;
                    const isActive = pathname === item.route;

                    return (
                        <Link
                            key={index}
                            href={item.route}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? "bg-white/15 text-white font-semibold shadow-sm"
                                : " hover:bg-white/10 text-white/50 font-semibold"
                                }`}
                        >
                            <Icon
                                className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-white/50 font-semibold"
                                    }`}
                                strokeWidth={isActive ? 2.5 : 1.8}
                            />


                            <span className="truncate text-[14px]">{item.screenName}</span>



                        </Link>
                    );
                })}
            </div>

            {/* User Profile */}
            <div className={`mb-2 transition-all p-4 mx-2`}>
                <div
                    onClick={() => {
                        handleLogout();
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-white/5 cursor-pointer border border-white/10 `}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 overflow-hidden ring-2 ring-white/10 group-hover:ring-white/30 transition-all flex items-center justify-center font-bold text-white uppercase">
                            {userInitial}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[var(--color-brand-primary)] rounded-full shadow-sm"></div>
                    </div>

                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{userName}</p>
                        <p className="text-[11px] text-blue-100/50 truncate font-medium">{userEmail}</p>
                    </div>

                    <div

                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 text-blue-100/40 hover:text-white transition-colors" />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Sidebar;