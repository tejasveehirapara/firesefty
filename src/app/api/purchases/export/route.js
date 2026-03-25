import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function POST(req) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { search, startDate, endDate, status, fileName, exportType } = await req.json();

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

        const purchases = await prisma.purchase.findMany({
            where: { ...whereClause, ...(status && { status: status }) },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { purchaseDate: "desc" },
        });

        // Generate CSV content
        const headers = ["Vendor", "PO date", "Status", "Product", "Quantity", "Total"];
        const rows = purchases.flatMap(purchase =>
            purchase.items.map(item => [
                purchase.vendor.name,
                new Date(purchase.purchaseDate).toISOString().split('T')[0],
                purchase.status,
                item.product?.name || "Unknown Product",
                item.quantity,
                Number(item.totalAmount).toFixed(2)
            ])
        );

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // Prepare file details
        const extension = exportType === "EXLS" ? "xls" : "csv";
        const safeFileName = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${extension}`;
        const contentType = exportType === "EXLS" ? "application/vnd.ms-excel" : "text/csv";

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${safeFileName}"`,
            },
        });
    } catch (error) {
        console.error("Error exporting purchases:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

