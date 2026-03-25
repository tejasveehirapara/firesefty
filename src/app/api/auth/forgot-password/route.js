import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security reasons, don't reveal if the user exists or not
            return NextResponse.json(
                { message: 'If an account exists with this email, a reset link will be sent.' },
                { status: 200 }
            );
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

        // Store token in database
        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires,
            },
        });

        await sendResetPasswordEmail(email, resetToken)

        // Simulate sending email
        console.log(`Reset link: http://localhost:3000/reset-password?token=${resetToken}`);

        return NextResponse.json(
            { message: 'If an account exists with this email, a reset link will be sent.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
