import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function GET(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const pageSize = parseInt(searchParams.get("pageSize")) || 1000;
        const filter = searchParams.get("filter") || "all"; // all | low | out
        const skip = (page - 1) * pageSize;

        const purchaseItem = await prisma.product.findMany({
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
            const currentStock = Number(purchase) - Number(sale)
            let status = "In Stock";
            if (currentStock === 0) status = "Out of Stock";
            else if (currentStock <= 10) status = "Low Stock";
            return {
                name: item.name,
                description: item.description,
                productId: item.id,
                price: item.price,
                totalPurchased: purchase,
                totalSold: sale,
                currentStock,
                status
            }
        })

        // Apply filter
        const filtered = filter === "low"
            ? inventoryData.filter(i => i.status === "Low Stock")
            : filter === "out"
                ? inventoryData.filter(i => i.status === "Out of Stock")
                : inventoryData;

        const totalItems = filtered.length;

        // Summary stats
        const summary = {
            totalProducts: inventoryData.length,
            inStock: inventoryData.filter(i => i.status === "In Stock").length,
            lowStock: inventoryData.filter(i => i.status === "Low Stock").length,
            outOfStock: inventoryData.filter(i => i.status === "Out of Stock").length,
        };

        return NextResponse.json({
            inventory: filtered,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
            summary
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
