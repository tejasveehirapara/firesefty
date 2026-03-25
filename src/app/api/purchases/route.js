import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { checkAuth } from "@/utils/checkAuth";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const pageSize = parseInt(searchParams.get("pageSize")) || 10;
        const search = searchParams.get("search") || '';
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status");
        const skip = (page - 1) * pageSize;

        const whereClause = {
            AND: [
                search ? {
                    OR: [
                        { vendor: { name: { contains: search, mode: "insensitive" } } },
                        { vendor: { email: { contains: search, mode: "insensitive" } } },
                        { items: { some: { product: { name: { contains: search, mode: "insensitive" } } } } }
                    ]
                } : {},
                startDate || endDate ? {
                    purchaseDate: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
                    }
                } : {}
            ]
        };

        const [purchases, totalItems] = await Promise.all([
            prisma.purchase.findMany({
                where: { ...whereClause, ...(status && { status: status }) },
                include: {
                    vendor: true,
                    history: {
                        include: {
                            user: true
                        },
                        orderBy: { createdAt: 'desc' }
                    },
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { purchaseDate: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.purchase.count({ where: { ...whereClause, ...(status && { status: status }) } })
        ]);

        return NextResponse.json({
            purchases,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { vendorId, items, purchaseDate } = await req.json();

        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json({ error: "Vendor and at least one product are required" }, { status: 400 });
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.unitPrice) * parseInt(item.quantity));
        }, 0);

        const purchase = await prisma.$transaction(async (tx) => {
            // Create the purchase record
            const newPurchase = await tx.purchase.create({
                data: {
                    vendorId,
                    totalAmount,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                    status: "Created",
                }
            });

            // Create initial status history
            await tx.statusHistory.create({
                data: {
                    status: "Created",
                    purchaseOrderId: newPurchase.id,
                    createdBy: user.userId
                }
            });

            // Create each item
            const purchaseItems = await Promise.all(
                items.map(item => tx.purchaseItem.create({
                    data: {
                        purchaseId: newPurchase.id,
                        productId: item.productId,
                        quantity: parseInt(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        totalAmount: parseFloat(item.unitPrice) * parseInt(item.quantity)
                    }
                }))
            );

            // Update inventory for each product
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

            return { ...newPurchase, items: purchaseItems };
        });

        return NextResponse.json({
            message: "Purchase Order created successfully",
            purchase
        });
    } catch (error) {
        console.error("Error creating purchase:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
