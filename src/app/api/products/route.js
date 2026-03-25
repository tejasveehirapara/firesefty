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
                { description: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        const [products, totalItems] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({
            products,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { name, description, price } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: price ? parseFloat(price) : 0,
            }
        });

        return NextResponse.json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
