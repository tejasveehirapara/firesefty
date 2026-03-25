import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkAuth } from "@/utils/checkAuth";

export async function POST(req, { params }) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword
            }
        });

        return NextResponse.json({
            message: "Password reset successfully",
            email: user.email,
            password: password
        });

    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
