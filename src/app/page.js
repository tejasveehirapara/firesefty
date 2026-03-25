"use client";
import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Mail, Lock, Shield, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { showToast } from "@/utils/toast";
import { setCurrentUser } from "@/utils/AuthCookie";

export default function HomePage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Successful login
      localStorage.setItem("sidebarData", JSON.stringify(data.sidebar_data));
      setCurrentUser(data.user);
      showToast("success", data.message);
      router.push(data.sidebar_data[0].route);
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
            Safety Management <br />
            <span className="text-blue-400">Reimagined.</span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            Streamline your fire safety operations with our comprehensive admin dashboard. Monitor inventory, track sales, and manage users all in one place.
          </p>

          <div className="space-y-4">
            {['Real-time Inventory Tracking', 'Advanced Sales Analytics', 'User Role Management'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-gray-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Universal Safety Solutions.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">


        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-7 h-7 text-white" fill="currentColor" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-500">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                startIcon={<Mail className="w-4 h-4 text-gray-400" />}
                value={formData.email}
                onChange={handleChange}
                error={error && !formData.email ? "Email is required" : ""}
                className="w-full"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  startIcon={<Lock className="w-4 h-4 text-gray-400" />}
                  endIcon={
                    <Button
                      type="button"
                      variant="outline"
                      className="!p-0 border-transparent text-gray-400 hover:text-gray-600 !shadow-none"
                      onClick={() => setShowPassword(!showPassword)}
                      startIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      label="Login"
                    />
                  }
                  value={formData.password}
                  onChange={handleChange}
                  error={error}
                />
                <div className="flex justify-end pt-1">
                  <a href="/forgot-password" name="forgot-password-link" className="text-sm font-medium text-[var(--color-brand-primary)]">
                    <span>Forgot password?</span>
                  </a>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!formData.email || !formData.password || loading}
              label="Sign In"
              loading={loading}
              className="w-full"
            />




          </form>

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
