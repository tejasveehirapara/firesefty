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
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const skip = (page - 1) * pageSize;

        const whereClause = {
            AND: [
                search
                    ? {
                        OR: [
                            {
                                buyerName: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                buyerEmail: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                buyerAddress: {
                                    contains: search,
                                    mode: "insensitive",
                                },
                            },
                            {
                                items: {
                                    some: {
                                        product: {
                                            name: {
                                                contains: search,
                                                mode: "insensitive",
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    }
                    : {},
                startDate || endDate ? {
                    quotationDate: {
                        ...(startDate && { gte: new Date(startDate) }),
                        ...(endDate && { lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)) })
                    }
                } : {}
            ]
        }


        const [sales, totalItems] = await Promise.all([
            prisma.sale.findMany({
                where: { ...whereClause, ...(status && { status: status }) },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { id: true, name: true, price: true }
                            }
                        }
                    },
                    history: {
                        include: {
                            user: true
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.sale.count({
                where: { ...whereClause, ...(status && { status: status }) }
            })
        ]);

        return NextResponse.json({
            sales,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching sales:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { buyerName, buyerPhone, buyerEmail, buyerAddress, quotationDate, items } = await req.json();

        // Validate required fields
        if (!buyerName || !buyerPhone) {
            return NextResponse.json({ error: "Buyer name and phone number are required" }, { status: 400 });
        }
        if (!items || items.length === 0) {
            return NextResponse.json({ error: "At least one sale item is required" }, { status: 400 });
        }

        // Validate all items have productId and quantity
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity < 1) {
                return NextResponse.json({ error: "Each item must have a product and valid quantity" }, { status: 400 });
            }
        }

        const sale = await prisma.$transaction(async (tx) => {
            // Create the Sale record
            const newSale = await tx.sale.create({
                data: {
                    buyerName,
                    buyerPhone,
                    buyerEmail,
                    buyerAddress,
                    quotationDate,
                    status: "QuotationSent",
                }
            });

            // Create initial status history
            await tx.statusHistory.create({
                data: {
                    status: "QuotationSent",
                    saleId: newSale.id,
                    createdBy: user.userId
                }
            });

            // Fetch product prices for each item
            const productIds = items.map(i => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, price: true }
            });
            const priceMap = Object.fromEntries(products.map(p => [p.id, parseFloat(p.price || 0)]));

            // Create SaleItem records
            const saleItems = await Promise.all(
                items.map(item => {
                    const price = priceMap[item.productId] || 0;
                    return tx.saleItem.create({
                        data: {
                            saleId: newSale.id,
                            productId: item.productId,
                            quantity: parseInt(item.quantity),
                            unitPrice: item.price,
                            totalAmount: item.price * parseInt(item.quantity),
                        }
                    });
                })
            );

            // Deduct inventory for each product sold
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: { productId: item.productId }
                });

                if (inventory) {
                    await tx.inventory.update({
                        where: { productId: item.productId },
                        data: {
                            quantity: Math.max(0, inventory.quantity - parseInt(item.quantity))
                        }
                    });
                }
            }

            return { ...newSale, items: saleItems };
        });

        return NextResponse.json({
            message: "Sale created successfully",
            sale
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating sale:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
