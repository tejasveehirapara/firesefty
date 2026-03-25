import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function PATCH(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { name, description, price } = await req.json();

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                description,
                price: price ? parseFloat(price) : undefined,
            }
        });

        return NextResponse.json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;

        // In a real app we might want to check for dependencies (sales, purchases)
        // For now we'll do a simple delete.
        await prisma.product.delete({
            where: { id }
        });

        return NextResponse.json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting product:", error);

        // Handle Prisma foreign key constraint violation (P2003)
        if (error.code === 'P2003') {
            const constraint = error.meta?.field_name || "";
            let errorMessage = "This product cannot be deleted because it has associated records (Purchases/Sales or Vendor mappings).";

            if (constraint.includes("vendor_product_mapping")) {
                errorMessage = "This product cannot be deleted because it is assigned to a vendor. Please remove the product from the vendor's list first.";
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
