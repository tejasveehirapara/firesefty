import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function GET() {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        // ── Parallel fetch all stats ──
        const [
            totalUsers,
            totalProducts,
            recentSales,
            allProducts,
        ] = await Promise.all([
            prisma.user.count({
                where: {
                    role: "USER"
                }
            }),
            prisma.product.count(),
            prisma.sale.findMany({
                // where: { status: "Completed" },
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    items: {
                        include: {
                            product: { select: { id: true, name: true, price: true } }
                        }
                    }
                }
            }),
            prisma.product.findMany({
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
            })
        ]);

        // ── Total purchase amount ──
        const purchaseAgg = await prisma.purchaseItem.aggregate({
            where: { purchase: { status: "Completed" } },
            _sum: { totalAmount: true }
        });
        const totalPurchaseAmount = parseFloat(purchaseAgg._sum.totalAmount || 0);

        // ── Total sales amount (qty × price) ──
        const saleAgg = await prisma.saleItem.aggregate({
            where: { sale: { status: "Completed" } },
            _sum: { totalAmount: true }
        });
        const totalSaleAmount = parseFloat(saleAgg._sum.totalAmount || 0);

        // ── Monthly chart data (last 6 months) ──
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            return {
                label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
                start: new Date(d.getFullYear(), d.getMonth(), 1),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
            };
        });

        const sixMonthsAgo = months[0].start;
        const [purchaseItems6m, saleItems6m] = await Promise.all([
            prisma.purchaseItem.findMany({
                where: {
                    createdAt: { gte: sixMonthsAgo },
                    purchase: { status: "Completed" }
                },
                select: { totalAmount: true, createdAt: true }
            }),
            prisma.saleItem.findMany({
                where: {
                    createdAt: { gte: sixMonthsAgo },
                    sale: { status: "Completed" }
                },
                select: { quantity: true, createdAt: true, product: { select: { price: true } } }
            })
        ]);

        const chartData = months.map(({ label, start, end }) => {
            const purchases = purchaseItems6m
                .filter(p => new Date(p.createdAt) >= start && new Date(p.createdAt) <= end)
                .reduce((s, p) => s + parseFloat(p.totalAmount || 0), 0);

            const sales = saleItems6m
                .filter(s => new Date(s.createdAt) >= start && new Date(s.createdAt) <= end)
                .reduce((s, item) => s + (item.quantity * parseFloat(item.product?.price || 0)), 0);

            return {
                month: label,
                purchases: Math.round(purchases),
                sales: Math.round(sales),
            };
        });

        // ── Low stock alerts (stock <= 10) ──
        const inventoryData = allProducts.map((item) => {
            const purchase = item.purchaseItems.reduce((acc, item) => acc + item.quantity, 0) || 0
            const sale = item.saleItems.reduce((acc, item) => acc + item.quantity, 0) || 0
            const currentStock = Number(purchase) - Number(sale)
            let status = "In Stock";
            if (currentStock === 0) status = "Out of Stock";
            else if (currentStock <= 10) status = "Low Stock";
            return {
                name: item.name,
                description: item.description,
                id: item.id,
                price: item.price,
                totalPurchased: purchase,
                totalSold: sale,
                currentStock,
                status
            }
        }).filter(i => i.status === "Out of Stock")

        // ── Format recent sales ──
        const recentTransactions = recentSales.map(sale => ({
            id: sale.id,
            buyerName: sale.buyerName,
            buyerPhone: sale.buyerPhone,
            status: sale.status,
            buyerEmail: sale.buyerEmail,
            itemCount: sale.items.length,
            totalQty: sale.items.reduce((s, i) => s + i.quantity, 0),
            products: sale.items.map(i => i.product?.name).filter(Boolean).join(", "),
            createdAt: sale.createdAt,
        }));

        return NextResponse.json({
            stats: {
                totalUsers,
                totalProducts,
                totalPurchaseAmount,
                totalSaleAmount,
            },
            chartData,
            lowStockAlerts: inventoryData,
            recentTransactions,
        });

    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
