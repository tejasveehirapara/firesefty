import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "./auth";


const checkAuth = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    const session = await prisma.userSession.findUnique({
        where: { token }
    });

    if (!session) {
        // ✅ Clear invalid cookie
        cookieStore.delete("token");
        return null;
    }

    try {
        const user = await verifyAuth(token);
        return user;
    } catch (e) {
        // ✅ Token invalid / expired
        cookieStore.delete("token");
        return null;
    }
};

export { checkAuth };
