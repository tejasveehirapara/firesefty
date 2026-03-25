import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function GET() {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const screens = await prisma.screen.findMany({
            orderBy: {
                screenName: "asc",
            },
        });

        return NextResponse.json(screens);
    } catch (error) {
        console.error("Error fetching screens:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
