import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkAuth } from "@/utils/checkAuth";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const userId = userCheck.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const userId = userCheck.userId;

        const body = await req.json();
        const { type, first_name, last_name, phone_number, current_password, new_password } = body;

        if (type === "PERSONAL_DETAILS") {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: first_name,
                    lastName: last_name,
                    phone: phone_number,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                }
            });

            return NextResponse.json({
                message: "Profile updated successfully",
                user: updatedUser
            });
        }

        if (type === "CHANGE_PASSWORD") {
            if (!current_password || !new_password) {
                return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const isPasswordValid = await bcrypt.compare(current_password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ message: "Password changed successfully" });
        }

        return NextResponse.json({ error: "Invalid update type" }, { status: 400 });

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
