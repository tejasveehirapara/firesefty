import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function DELETE(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;

        // Fetch sale items first to restore inventory
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Restore inventory


            // 2. Delete related records
            await tx.statusHistory.deleteMany({
                where: { saleId: id }
            });

            await tx.saleItem.deleteMany({
                where: { saleId: id }
            });

            // 3. Delete sale
            await tx.sale.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: "Sale deleted successfully" });
    } catch (error) {
        console.error("Error deleting sale:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { buyerName, buyerPhone, buyerEmail, buyerAddress, quotationDate, items } = await req.json();

        // Validate basic fields
        if (!buyerName || !buyerPhone) {
            return NextResponse.json({ error: "Buyer name and phone required" }, { status: 400 });
        }
        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Items required" }, { status: 400 });
        }

        const updatedSale = await prisma.$transaction(async (tx) => {
            // 1. Get existing sale items
            const existingSale = await tx.sale.findUnique({
                where: { id },
                include: { items: true }
            });

            if (!existingSale) {
                throw new Error("Sale not found");
            }



            // 3. Delete ALL old items
            await tx.saleItem.deleteMany({
                where: { saleId: id }
            });

            // 4. Fetch product prices and Validate/Deduct inventory for NEW items
            const productIds = items.map(i => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, price: true, inventory: true }
            });

            const priceMap = Object.fromEntries(products.map(p => [p.id, parseFloat(p.price || 0)]));

            // 5. Create NEW items
            await Promise.all(items.map(item => {
                const price = priceMap[item.productId] || 0;
                return tx.saleItem.create({
                    data: {
                        saleId: id,
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        unitPrice: Number(item?.price),
                        totalAmount: Number(item?.price) * parseInt(item.quantity)
                    }
                });
            }));

            // 6. Update Sale details
            return await tx.sale.update({
                where: { id },
                data: {
                    buyerName,
                    buyerPhone,
                    buyerEmail,
                    buyerAddress,
                    quotationDate
                },
                include: { items: true } // Return updated items
            });
        });

        return NextResponse.json({ message: "Sale updated successfully", sale: updatedSale });

    } catch (error) {
        console.error("Error updating sale:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
