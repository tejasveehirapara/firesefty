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

        if (status === "Completed") {
            const sale = await prisma.sale.findUnique({ where: { id } });
            if (!sale) {
                return NextResponse.json({ error: "Sale not found" }, { status: 404 });
            }
            const items = await prisma.saleItem.findMany({ where: { saleId: id } });

            const purchaseItem = await prisma.product.findMany({
                where: {
                    id: {
                        in: items.map((item) => item.productId)
                    }
                },
                include: {
                    purchaseItems: {
                        where: {
                            purchase: {
                                status: "Completed",
                            },
                        },
                        select: {
                            id: true,
                            quantity: true,
                            unitPrice: true,
                            totalAmount: true,
                        },
                    },
                    saleItems: {
                        where: {
                            sale: {
                                status: "Completed",
                            },
                        },
                        select: {
                            id: true,
                            quantity: true,
                            unitPrice: true,
                            totalAmount: true,

                        },
                    },
                },
            });


            const inventoryData = purchaseItem.map((item) => {
                const purchase = item.purchaseItems.reduce((acc, item) => acc + item.quantity, 0) || 0
                const sale = item.saleItems.reduce((acc, item) => acc + item.quantity, 0) || 0
                const currentStock = Number(purchase) - Number(sale);
                return {
                    name: item.name,
                    description: item.description,
                    productId: item.id,
                    price: item.price,
                    totalPurchased: purchase,
                    totalSold: sale,
                    currentStock,
                }
            })

            let stockCheck = [];

            for (const item of items) {
                const matchedItem = inventoryData.find((i) => i.productId === item.productId);
                const lowStock = item.quantity > matchedItem.currentStock;
                if (lowStock) {
                    stockCheck.push({
                        product: matchedItem.name,
                        stock: matchedItem.currentStock,
                        saleQuantity: item.quantity
                    })
                }
            }
            if (stockCheck.length > 0) {
                return NextResponse.json({ error: "Low Stock Alerts... Please manage your stock", stockCheck }, { status: 400 });
            }
        }


        const updatedSale = await prisma.$transaction(async (tx) => {
            // Update sale status
            const sale = await tx.sale.update({
                where: { id },
                data: { status }
            });

            // Create status history record
            await tx.statusHistory.create({
                data: {
                    status,
                    saleId: id,
                    createdBy: user.userId
                }
            });

            return sale;
        });

        return NextResponse.json({
            message: "Sale status updated successfully",
            sale: updatedSale
        });
    } catch (error) {
        console.error("Error updating sale status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
