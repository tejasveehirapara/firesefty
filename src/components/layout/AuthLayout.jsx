"use client";

import { getCurrentUser } from "@/utils/AuthCookie";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../ui/Loader";

const AuthLayout = ({ children }) => {
    const user_role = getCurrentUser();
    const router = useRouter();
    const pathname = usePathname();

    const [loading, setLoading] = useState(true);
    const [screenPermission, setScreenPermission] = useState([]);

    // ✅ Fetch permissions
    useEffect(() => {
        const fetchScreenPermission = async () => {
            try {
                const response = await fetch("/api/screenPermission");
                const data = await response.json();
                setScreenPermission(data.screens || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (!publicRoutes.includes(pathname)) {
            fetchScreenPermission();
        }
        setLoading(false);
    }, []);

    // ✅ Redirect if NOT logged in
    useEffect(() => {

        if (!publicRoutes.includes(pathname)) {
            if (!loading && !user_role) {
                router.replace("/");
            }
        }

    }, [loading, user_role, router]);

    const publicRoutes = ["/", "/forgot-password"];

    // ✅ Role-based redirect (SAFE)
    useEffect(() => {
        if (publicRoutes.includes(pathname))
            if (!loading && user_role) {
                if (user_role.role === "ADMIN") {

                    router.replace("/dashboard");
                    return;
                }

                if (
                    screenPermission.length > 0 &&
                    user_role.role !== "ADMIN"
                ) {
                    router.replace(screenPermission[0].route);
                }
            }
    }, [loading, user_role, screenPermission, router]);

    // ✅ PURE RENDER
    if (loading) {
        return (
            <div className="h-[100vh] w-full flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return <div>{children}</div>;
};

export default AuthLayout;