import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkAuth } from "@/utils/checkAuth";

export async function POST(req) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { first_name, last_name, email, password, phone_number, screen_ids } = await req.json();

        if (!first_name || !last_name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with permissions
        const user = await prisma.user.create({
            data: {
                firstName: first_name,
                lastName: last_name,
                email: email.toLowerCase(),
                password: hashedPassword,
                phone: phone_number,
                role: "USER",
                permissions: {
                    create: (screen_ids || []).map(screenId => ({
                        screen: { connect: { id: screenId } }
                    }))
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
                permissions: {
                    include: {
                        screen: true
                    }
                }
            },
        });

        return NextResponse.json({
            message: "User created successfully",
            user,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req) {
    try {
        const userCheck = await checkAuth()
        if (!userCheck) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const pageSize = parseInt(searchParams.get("pageSize")) || 10;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status"); // 'active' | 'inactive' | null

        const skip = (page - 1) * pageSize;

        // Build where clause
        const where = {
            role: "USER"
        };

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        // Fetch users and total count in parallel
        const [users, totalItems] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    phone: true,
                    isActive: true,
                    isBlocked: true,
                    createdAt: true,
                    permissions: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: pageSize,
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({
            users,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
