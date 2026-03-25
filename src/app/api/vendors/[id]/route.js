import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function PATCH(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;
        const { name, email, phone_number, product_ids } = await req.json();

        const vendor = await prisma.$transaction(async (tx) => {
            // Update vendor basic info
            const updatedVendor = await tx.vendor.update({
                where: { id },
                data: {
                    name,
                    email,
                    phoneNumber: phone_number,
                }
            });

            // Update product mappings
            if (product_ids !== undefined) {
                // Delete existing mappings
                await tx.vendorProductMapping.deleteMany({
                    where: { vendorId: id }
                });

                // Create new mappings
                if (product_ids.length > 0) {
                    await tx.vendorProductMapping.createMany({
                        data: product_ids.map(productId => ({
                            vendorId: id,
                            productId: productId
                        }))
                    });
                }
            }

            return updatedVendor;
        });

        return NextResponse.json({
            message: "Vendor updated successfully",
            vendor
        });
    } catch (error) {
        console.error("Error updating vendor:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Vendor with this email already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { id } = await params;

        await prisma.$transaction(async (tx) => {
            // Delete mappings first (though they should be cascade deleted if schema allows, but safer to do it manually if not sure)
            await tx.vendorProductMapping.deleteMany({
                where: { vendorId: id }
            });

            // Delete vendor
            await tx.vendor.delete({
                where: { id }
            });
        });

        return NextResponse.json({
            message: "Vendor deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting vendor:", error);

        // Handle Prisma foreign key constraint violation (P2003)
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "This vendor is associated with purchase records, so it cannot be deleted." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
