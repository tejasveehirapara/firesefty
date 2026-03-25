import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function GET(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page")) || 1;
        const pageSize = parseInt(searchParams.get("pageSize")) || 10;
        const skip = (page - 1) * pageSize;

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        const [vendors, totalItems] = await Promise.all([
            prisma.vendor.findMany({
                where,
                include: {
                    products: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.vendor.count({ where })
        ]);

        return NextResponse.json({
            vendors,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { name, email, phone_number, product_ids } = await req.json();

        if (!name || !email || !phone_number) {
            return NextResponse.json({ error: "Name, email and phone number are required" }, { status: 400 });
        }

        const vendor = await prisma.$transaction(async (tx) => {
            // Create vendor
            const newVendor = await tx.vendor.create({
                data: {
                    name,
                    email,
                    phoneNumber: phone_number,
                }
            });

            // Create product mappings if any
            if (product_ids && product_ids.length > 0) {
                await tx.vendorProductMapping.createMany({
                    data: product_ids.map(productId => ({
                        vendorId: newVendor.id,
                        productId: productId
                    }))
                });
            }

            return newVendor;
        });

        return NextResponse.json({
            message: "Vendor created successfully",
            vendor
        });
    } catch (error) {
        console.error("Error creating vendor:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Vendor with this email already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
