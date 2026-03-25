import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail", // or SMTP provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});


export async function sendResetPasswordEmail(email, token) {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Inventory Management" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password",
        html: `
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetLink}">RESET PASSWORD</a>
      <p>This link will expire in 1 hour.</p>
    `,
    });
}