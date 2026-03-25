import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Login failed. Please check your credentials.' },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Your account is not active. Please contact the admin.' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Login failed. Please check your credentials.' },
                { status: 401 }
            );
        }

        const sidebar_data = user.role === "ADMIN" ? await prisma.screen.findMany({
            orderBy: {
                order: 'asc',
            },
        }) : await prisma.userPermission.findMany({
            where: {
                userId: user.id,
            },
            include: {
                screen: true
            },
            orderBy: {
                screen: {
                    order: "asc",
                },
            },

        }).then((res) => {
            console.log(res, "resresresres")
            return res.map((item) => item.screen);
        });

        const permissions = sidebar_data.map((item) => item.route)

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, permissions },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update user session in database
        await prisma.userSession.create({
            data: {
                userId: user.id,
                token: token,
                expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            },
        });


        const response = NextResponse.json(
            {
                message: 'Login successful',
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },
                sidebar_data
            },
            { status: 200 }
        );

        // Set cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
