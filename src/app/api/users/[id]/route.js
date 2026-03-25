import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkAuth } from "@/utils/checkAuth";

export async function PATCH(req, { params }) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { first_name, last_name, email, password, phone_number, screen_ids, is_active, is_blocked } = await req.json();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
            include: { permissions: true }
        });

        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const data = {};
        if (first_name !== undefined) data.firstName = first_name;
        if (last_name !== undefined) data.lastName = last_name;
        if (email !== undefined) data.email = email.toLowerCase();
        if (phone_number !== undefined) data.phone = phone_number;
        if (is_active !== undefined) data.isActive = is_active;
        if (is_blocked !== undefined) data.isBlocked = is_blocked;

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        // Update user and permissions in a transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update basic info
            const user = await tx.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    phone: true,
                }
            });

            // Update permissions if provided
            if (screen_ids) {
                // Delete existing
                await tx.userPermission.deleteMany({
                    where: { userId: id }
                });

                // Create new
                if (screen_ids.length > 0) {
                    await tx.userPermission.createMany({
                        data: screen_ids.map(screenId => ({
                            userId: id,
                            screenId: screenId
                        }))
                    });
                }
            }

            return user;
        });

        return NextResponse.json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;

        // Prisma will handle dependent deletions if configured in schema, 
        // but let's be explicit if needed or rely on the transaction.
        await prisma.$transaction([
            prisma.userPermission.deleteMany({ where: { userId: id } }),
            prisma.userSession.deleteMany({ where: { userId: id } }),
            prisma.user.delete({ where: { id } })
        ]);

        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
