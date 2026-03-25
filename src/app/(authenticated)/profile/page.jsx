"use client";

import React, { useState, useEffect } from "react";
import { User, Lock, Mail, Phone, Save, KeyRound } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { showToast } from "@/utils/toast";
import Loader from "@/components/ui/Loader";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";
import { Formik, Form } from "formik";
import * as Yup from "yup";

export default function ProfilePage() {
    const router = useRouter();
    // Validation Schemas
    const personalSchema = Yup.object().shape({
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),
        phone_number: Yup.string(),
    });

    const passwordSchema = Yup.object().shape({
        current_password: Yup.string().required("Current password is required"),
        new_password: Yup.string().min(6, "Password must be at least 6 characters").required("New password is required"),
        confirm_password: Yup.string()
            .oneOf([Yup.ref('new_password'), null], "Passwords must match")
            .required("Please confirm your password"),
    });

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/users/profile");
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                setUser(data.user);
                // setPersonalInfo({
                //     first_name: data.user.firstName,
                //     last_name: data.user.lastName,
                //     phone_number: data.user.phone || "",
                // });
            } else {
                showToast("error", data.error || "Failed to fetch profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            showToast("error", "Internal server error");
        } finally {
            setLoading(false);
        }
    };

    const submitPersonalInfo = async (values, { setSubmitting }) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "PERSONAL_DETAILS",
                    ...values
                }),
            });
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", "Profile updated successfully");
                setUser(data.user);
            } else {
                showToast("error", data.error || "Failed to update profile");
            }
        } catch (error) {
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const submitPasswordChange = async (values, { setSubmitting, resetForm }) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "CHANGE_PASSWORD",
                    current_password: values.current_password,
                    new_password: values.new_password,
                }),
            });
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", "Password changed successfully");
                resetForm();
            } else {
                showToast("error", data.error || "Failed to change password");
            }
        } catch (error) {
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-6 sm:mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 shadow-sm shrink-0">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">User Profile</h1>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Manage your personal information and security settings</p>
                </div>
            </div>

            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="mb-6 sm:mb-8 w-full sm:w-auto" variant="pill">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Personal Details
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Change Password
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="personal">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 sm:p-8">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 sm:w-5 h-5 text-blue-500" />
                                Basic Information
                            </h2>
                            <Formik
                                initialValues={{
                                    first_name: user?.firstName || "",
                                    last_name: user?.lastName || "",
                                    phone_number: user?.phone || "",
                                }}
                                validationSchema={personalSchema}
                                onSubmit={submitPersonalInfo}
                                enableReinitialize
                            >
                                {({ values, errors, touched, setFieldValue, isSubmitting: personalSubmitting }) => (
                                    <Form className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <Input
                                            label="First Name"
                                            name="first_name"
                                            value={values.first_name}
                                            onChange={(e) => setFieldValue("first_name", e.target.value)}
                                            placeholder="Enter first name"
                                            required
                                            startIcon={<User className="w-4 h-4" />}
                                            error={touched.first_name && errors.first_name}
                                        />
                                        <Input
                                            label="Last Name"
                                            name="last_name"
                                            value={values.last_name}
                                            onChange={(e) => setFieldValue("last_name", e.target.value)}
                                            placeholder="Enter last name"
                                            required
                                            startIcon={<User className="w-4 h-4" />}
                                            error={touched.last_name && errors.last_name}
                                        />
                                        <Input
                                            label="Email Address"
                                            value={user?.email || ""}
                                            readOnly
                                            disabled
                                            placeholder="email@example.com"
                                            startIcon={<Mail className="w-4 h-4" />}
                                            className="sm:col-span-2 cursor-not-allowed opacity-70"
                                        />
                                        <Input
                                            label="Phone Number"
                                            name="phone_number"
                                            value={values.phone_number}
                                            onChange={(e) => setFieldValue("phone_number", e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            startIcon={<Phone className="w-4 h-4" />}
                                            error={touched.phone_number && errors.phone_number}
                                        />
                                        <div className="sm:col-span-2 flex justify-end mt-2 sm:mt-4">
                                            <Button
                                                type="submit"
                                                label={isSubmitting ? "Saving..." : "Save Changes"}
                                                variant="primary"
                                                disabled={isSubmitting || personalSubmitting}
                                                startIcon={<Save className="w-4 h-4" />}
                                                className="!rounded-xl w-full sm:w-auto px-8"
                                            />
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="security">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 sm:p-8">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <KeyRound className="w-4 h-4 sm:w-5 h-5 text-purple-500" />
                                Security Settings
                            </h2>
                            <Formik
                                initialValues={{
                                    current_password: "",
                                    new_password: "",
                                    confirm_password: "",
                                }}
                                validationSchema={passwordSchema}
                                onSubmit={submitPasswordChange}
                            >
                                {({ values, errors, touched, setFieldValue, isSubmitting: passwordSubmitting }) => (
                                    <Form className="flex flex-col gap-4 sm:gap-6 max-w-md">
                                        <Input
                                            type="password"
                                            label="Current Password"
                                            name="current_password"
                                            value={values.current_password}
                                            onChange={(e) => setFieldValue("current_password", e.target.value)}
                                            placeholder="Enter current password"
                                            required
                                            startIcon={<Lock className="w-4 h-4" />}
                                            error={touched.current_password && errors.current_password}
                                        />
                                        <div className="h-px bg-gray-100 w-full my-1"></div>
                                        <Input
                                            type="password"
                                            label="New Password"
                                            name="new_password"
                                            value={values.new_password}
                                            onChange={(e) => setFieldValue("new_password", e.target.value)}
                                            placeholder="Enter new password"
                                            required
                                            startIcon={<Lock className="w-4 h-4" />}
                                            error={touched.new_password && errors.new_password}
                                        />
                                        <Input
                                            type="password"
                                            label="Confirm New Password"
                                            name="confirm_password"
                                            value={values.confirm_password}
                                            onChange={(e) => setFieldValue("confirm_password", e.target.value)}
                                            placeholder="Confirm new password"
                                            required
                                            startIcon={<Lock className="w-4 h-4" />}
                                            error={touched.confirm_password && errors.confirm_password}
                                        />
                                        <div className="flex justify-start mt-2 sm:mt-4">
                                            <Button
                                                type="submit"
                                                label={isSubmitting ? "Updating..." : "Update Password"}
                                                variant="primary"
                                                color="purple"
                                                disabled={isSubmitting || passwordSubmitting}
                                                startIcon={<KeyRound className="w-4 h-4" />}
                                                className="!rounded-xl w-full sm:w-auto px-8"
                                            />
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
