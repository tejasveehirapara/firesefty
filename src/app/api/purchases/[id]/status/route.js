import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { checkAuth } from "@/utils/checkAuth";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const updatedPurchase = await prisma.$transaction(async (tx) => {
            // Update purchase status
            const purchase = await tx.purchase.update({
                where: { id },
                data: { status }
            });
            console.log(user)
            // Create status history record
            await tx.statusHistory.create({
                data: {
                    status,
                    purchaseOrderId: id,
                    createdBy: user.userId
                }
            });

            return purchase;
        });

        return NextResponse.json({
            message: "Purchase status updated successfully",
            purchase: updatedPurchase
        });
    } catch (error) {
        console.error("Error updating purchase status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
