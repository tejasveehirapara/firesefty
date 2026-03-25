"use client";
import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Mail, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toast";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to process request");
            }

            showToast("success", data.message);
            setSubmitted(true);
        } catch (err) {
            showToast("error", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-white selection:bg-blue-100 selection:text-blue-900 font-sans text-gray-900">
            {/* Left Side - Hero/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-gray-900/90 backdrop-blur-sm"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Shield className="w-6 h-6 text-white" fill="currentColor" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Universal Safety Solutions</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
                        Forgot your <br />
                        <span className="text-blue-400">Password?</span>
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed mb-8">
                        Don't worry, it happens to the best of us. Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Universal Safety Solutions.
                </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-[400px] space-y-8">
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Shield className="w-7 h-7 text-white" fill="currentColor" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {submitted ? "Check your email" : "Reset Password"}
                        </h2>
                        <p className="mt-2 text-gray-500">
                            {submitted
                                ? "We have sent a password recover link to your email."
                                : "Enter your email address to receive a reset link."}
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                required
                                startIcon={<Mail className="w-4 h-4 text-gray-400" />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full"
                            />

                            <Button
                                type="submit"
                                label="Send Reset Link"
                                loading={loading}
                                disabled={loading || !email}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            />

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => router.push("/")}
                                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline gap-1"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                            </div>
                            <p className="text-center text-gray-600">
                                If an account exists for <span className="font-semibold">{email}</span>, you will receive an email with instructions shortly.
                            </p>
                            <Button
                                label="Return to Login"
                                type="button"
                                onClick={() => router.push("/")}
                                variant="outline"
                                className="w-full py-2.5 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
                            />

                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Protected by Universal Safety Solutions</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
