import prisma from "@/lib/prisma"; // adjust if needed
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { checkAuth } from "@/utils/checkAuth";

export async function GET(request) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        // ✅ Fetch permissions ordered by screen order
        const permissions = await prisma.userPermission.findMany({
            where: {
                userId: user.userId,
            },
            include: {
                screen: true,
            },
            orderBy: {
                screen: {
                    order: "asc",
                },
            },
        });
        return NextResponse.json({
            success: true,
            screens: permissions.map(p => p.screen),
        });

    } catch (error) {
        console.error("Screen fetch error:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch screens." },
            { status: 500 }
        );
    }
}