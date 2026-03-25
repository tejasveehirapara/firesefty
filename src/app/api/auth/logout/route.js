import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { checkAuth } from '@/utils/checkAuth';

export async function POST() {
    try {
        const user = await checkAuth()
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized", code: 401 }, { status: 401 })

        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (token) {
            // Delete session from database
            await prisma.userSession.deleteMany({
                where: {
                    token: token,
                },
            });
        }

        const response = NextResponse.json(
            { message: 'Logout successful' },
            { status: 200 }
        );

        // Clear cookie
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
