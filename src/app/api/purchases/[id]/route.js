import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAuth } from "@/utils/checkAuth";

export async function DELETE(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Restore inventory
            for (const item of purchase.items) {
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: { quantity: { increment: item.quantity } }
                });
            }

            // 2. Delete purchase items
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id }
            });

            // 3. Delete purchase
            await tx.purchase.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: "Purchase deleted successfully" });
    } catch (error) {
        console.error("Error deleting purchase:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { items, purchaseDate } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "At least one product is required" },
                { status: 400 }
            );
        }

        const existingPurchase = await prisma.purchase.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingPurchase) {
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 }
            );
        }

        const totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.unitPrice) * parseInt(item.quantity));
        }, 0);

        const purchase = await prisma.$transaction(async (tx) => {

            /* ------------------ 1️⃣ Revert Old Inventory ------------------ */
            for (const oldItem of existingPurchase.items) {
                await tx.inventory.update({
                    where: { productId: oldItem.productId },
                    data: {
                        quantity: { decrement: oldItem.quantity }
                    }
                });
            }

            /* ------------------ 2️⃣ Delete Old Items ------------------ */
            await tx.purchaseItem.deleteMany({
                where: { purchaseId: id }
            });

            /* ------------------ 3️⃣ Update Purchase ------------------ */
            const updatedPurchase = await tx.purchase.update({
                where: { id },
                data: {
                    totalAmount,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined
                }
            });

            /* ------------------ 4️⃣ Create New Items ------------------ */
            const newItems = await Promise.all(
                items.map(item =>
                    tx.purchaseItem.create({
                        data: {
                            purchaseId: id,
                            productId: item.productId,
                            quantity: parseInt(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            totalAmount:
                                parseFloat(item.unitPrice) *
                                parseInt(item.quantity)
                        }
                    })
                )
            );

            /* ------------------ 5️⃣ Apply New Inventory ------------------ */
            for (const item of items) {
                await tx.inventory.upsert({
                    where: { productId: item.productId },
                    update: {
                        quantity: { increment: parseInt(item.quantity) }
                    },
                    create: {
                        productId: item.productId,
                        quantity: parseInt(item.quantity)
                    }
                });
            }

            return { ...updatedPurchase, items: newItems };
        });

        return NextResponse.json({
            message: "Purchase updated successfully",
            purchase
        });

    } catch (error) {
        console.error("Error updating purchase:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}