"use client";
import UnauthorizedPage from "@/app/unauthorized/page";
import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import { getCurrentUser, clearCurrentUser } from "@/utils/AuthCookie";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../ui/Loader";

const AdminLayout = ({ children }) => {

    const pathname = usePathname();
    const router = useRouter();
    const user_role = getCurrentUser();

    const [loading, setLoading] = useState(true)

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [screenPermission, setScreenPermission] = useState([]);

    useEffect(() => {
        const fetchScreenPermission = async () => {
            const response = await fetch("/api/screenPermission");
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            setScreenPermission(data.screens);
        };
        fetchScreenPermission();
        setLoading(false)
    }, []);


    const is_permission_check = user_role?.role === "ADMIN" || pathname === "/profile" ? true : screenPermission?.some((item) => item?.route === pathname);


    if (loading) {
        return <div className="h-[100vh] w-full flex items-center justify-center"><Loader /></div>
    }

    return (
        <div className="flex h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
            {/* Sidebar - Hidden on mobile by default, handled by CSS/State */}
            <div className={`hidden lg:flex h-full flex-shrink-0 transition-all duration-300`}>
                <Sidebar setIsSidebarOpen={setIsSidebarOpen} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
                {/* Header */}
                <Header
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarCollapsed={!isSidebarOpen}
                />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto w-full p-2 sm:p-4 lg:p-6 transition-all duration-300">
                    {is_permission_check ? children : <UnauthorizedPage />}


                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`lg:hidden fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar setIsSidebarOpen={setIsSidebarOpen} />
            </div>
        </div>
    );
};

export default AdminLayout;
