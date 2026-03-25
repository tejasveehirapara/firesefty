"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Lock, Shield, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { showToast } from "@/utils/toast";

function ResetPasswordContent() {
    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, success, error
    const [errorMessage, setErrorMessage] = useState("");

    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMessage("No reset token provided. Please use the link Sent to your email.");
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            showToast("error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: formData.password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            showToast("success", "Password reset successful!");
            setStatus("success");
        } catch (err) {
            showToast("error", err.message);
            setErrorMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (status === "success") {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Password Changed!</h2>
                    <p className="mt-2 text-gray-600">Your password has been successfully updated. You can now sign in with your new password.</p>
                </div>
                <Button
                    onClick={() => router.push("/")}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                >
                    Sign In
                </Button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Invalid Link</h2>
                    <p className="mt-2 text-gray-600">{errorMessage}</p>
                </div>
                <Button
                    onClick={() => router.push("/forgot-password")}
                    variant="outline"
                    className="w-full py-2.5 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg"
                >
                    Request New Link
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">Set New Password</h2>
                <p className="mt-2 text-gray-500">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="New Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    required
                    startIcon={<Lock className="w-4 h-4 text-gray-400" />}
                    endIcon={
                        <Button
                            type="button"
                            variant="outline"
                            className="!p-0 border-transparent text-gray-400 hover:text-gray-600 !shadow-none"
                            onClick={() => setShowPassword(!showPassword)}
                            startIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            label=""
                        />
                    }
                    value={formData.password}
                    onChange={handleChange}
                />

                <Input
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    required
                    startIcon={<Lock className="w-4 h-4 text-gray-400" />}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                    {loading ? "Updating..." : "Reset Password"}
                </Button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex w-full bg-white selection:bg-blue-100 selection:text-blue-900 font-sans text-gray-900">
            {/* Left Side - Hero/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden flex-col justify-between p-12 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?q=80&w=2657&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
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
                        Secure Your <br />
                        <span className="text-blue-400">Account.</span>
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed mb-8">
                        Choose a strong password to keep your account safe and secure.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} Universal Safety Solutions.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-[400px]">
                    <Suspense fallback={<div>Loading...</div>}>
                        <ResetPasswordContent />
                    </Suspense>

                    <div className="mt-8 relative">
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
