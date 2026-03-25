"use client"
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, User as UserIcon, Mail, Lock, Phone, Edit2, Trash2, Eye, Power, RefreshCw, Copy, Check, Key } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import ActionButton from "@/components/ui/ActionButton";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Input from "@/components/ui/Input";
import { showToast } from "@/utils/toast";
import PageTitlePart from "@/components/PageTitlePart";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit/Delete State
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isResetFormOpen, setIsResetFormOpen] = useState(false);
    const [resetFormData, setResetFormData] = useState({ password: "", confirmPassword: "" });
    const [resetDetails, setResetDetails] = useState({ email: "", password: "" });
    const [copiedField, setCopiedField] = useState(null);

    // Screens State
    const [screens, setScreens] = useState([]);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchInput, setSearchInput] = useState("");

    const validationSchema = Yup.object({
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),
        email: Yup.string().email("Invalid email address").required("Email is required"),
        password: Yup.string().when([], {
            is: () => !editMode,
            then: (schema) => schema.min(6, "Password must be at least 6 characters").required("Password is required"),
            otherwise: (schema) => schema.min(6, "Password must be at least 6 characters").optional(),
        }),
        phone_number: Yup.string().optional(),
        screen_ids: Yup.array().min(1, "At least one screen permission is required").required("Required"),
    });

    const formik = useFormik({
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            phone_number: "",
            screen_ids: []
        },
        validationSchema,
        onSubmit: async (values) => {
            if (viewMode) return;
            setIsSubmitting(true);
            try {
                const url = editMode ? `/api/users/${selectedUser.id}` : "/api/users";
                const method = editMode ? "PATCH" : "POST";

                const res = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(values)
                });
                const data = await res.json();

                if (data.code === 401) {
                    clearCurrentUser()
                    router.push("/");
                    return;
                }

                if (res.ok) {
                    showToast("success", editMode ? "User updated successfully" : "User added successfully");
                    setIsModalOpen(false);
                    fetchUsers();
                } else {
                    showToast("error", data.error || "Failed to save user");
                }
            } catch (error) {
                console.error("Error saving user:", error);
                showToast("error", "Internal server error");
            } finally {
                setIsSubmitting(false);
            }
        }
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                search: search,
                status: selectedStatus
            });

            const res = await fetch(`/api/users?${queryParams}`);
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                const mappedUsers = data.users.map(user => ({
                    ...user,
                    name: `${user.firstName} ${user.lastName}`,
                    joined: new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric"
                    }),

                }));
                setUsers(mappedUsers);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            showToast("error", "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, search, selectedStatus]);

    const fetchScreens = async () => {
        try {
            const res = await fetch("/api/screens");
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                setScreens(data);
            }
        } catch (error) {
            console.error("Error fetching screens:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchScreens();
    }, [fetchUsers]);

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleCheckboxChange = (screenId) => {
        if (viewMode) return;
        const currentIds = formik.values.screen_ids;
        const newIds = currentIds.includes(screenId)
            ? currentIds.filter(id => id !== screenId)
            : [...currentIds, screenId];

        formik.setFieldValue("screen_ids", newIds);
    };

    const openAddModal = () => {
        setEditMode(false);
        setViewMode(false);
        setSelectedUser(null);
        formik.resetForm({
            values: {
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                phone_number: "",
                screen_ids: []
            }
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditMode(true);
        setViewMode(false);
        setSelectedUser(user);
        formik.resetForm({
            values: {
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email,
                password: "",
                phone_number: user.phone || "",
                screen_ids: user.permissions?.map(p => p.screenId) || []
            }
        });
        setIsModalOpen(true);
    };

    const openViewModal = (user) => {
        setEditMode(false);
        setViewMode(true);
        setSelectedUser(user);
        formik.resetForm({
            values: {
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email,
                password: "••••••••",
                phone_number: user.phone || "",
                screen_ids: user.permissions?.map(p => p.screenId) || []
            }
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleToggleStatus = async (user) => {
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !user.isActive })
            });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                showToast("success", `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
                fetchUsers();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to toggle status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            showToast("error", "Internal server error");
        }
    };

    const openResetFormModal = (user) => {
        setSelectedUser(user);
        setResetFormData({ password: "", confirmPassword: "" });
        setIsResetFormOpen(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (resetFormData.password !== resetFormData.confirmPassword) {
            showToast("error", "Passwords do not match");
            return;
        }
        if (resetFormData.password.length < 6) {
            showToast("error", "Password must be at least 6 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: resetFormData.password })
            });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                setResetDetails({
                    email: data.email,
                    password: data.password
                });
                setIsResetFormOpen(false);
                setIsResetModalOpen(true);
                showToast("success", "Password reset successfully");
            } else {
                showToast("error", data.error || "Failed to reset password");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyAll = () => {
        const text = `Email: ${resetDetails.email}\nPassword: ${resetDetails.password}`;
        navigator.clipboard.writeText(text);
        setCopiedField("all");
        setCopiedField(null)
        setIsResetModalOpen(false)
    };

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
    };

    const handleDeleteUser = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: "DELETE"
            });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                showToast("success", "User deleted successfully");
                setIsDeleteModalOpen(false);
                fetchUsers();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            showToast("error", "Internal server error");
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            key: "user",
            label: "User Details",
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-[var(--color-brand-primary)] shadow-sm border border-blue-100 uppercase">
                        {row.firstName?.charAt(0)}{row.lastName?.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm">{row.name}</div>
                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                            <a href={`mailto:${row.email}`} className="hover:text-blue-600 hover:underline">{row.email}</a>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "phone",
            label: "Phone Number",
            render: (phone) => <a href={`tel:${phone}`} className="text-xs sm:text-sm text-gray-600 font-medium hover:text-blue-600 hover:underline">{phone || "N/A"}</a>
        },
        {
            key: "isActive",
            label: "Status",
            render: (status) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border uppercase tracking-wider ${status ? 'bg-green-50 text-green-700 border-green-100' :
                    'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full  ${status ? 'bg-green-500' : 'bg-red-500'}`}></span> {status ? "ACTIVE" : "INACTIVE"}
                </span>
            ),
        },
        {
            key: "joined",
            label: "Joined Date",
            render: (date) => <span className="text-xs sm:text-sm text-gray-500 font-medium">{date}</span>,
            sortable: true,
        },
        {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <ActionButton
                        variant="view"
                        icon={Eye}
                        onClick={() => openViewModal(row)}
                        title="View Details"
                    />
                    <ActionButton
                        variant="edit"
                        icon={Edit2}
                        onClick={() => openEditModal(row)}
                        title="Edit User"
                    />
                    <ActionButton
                        variant={row.isActive ? "inactive" : "active"}
                        icon={Power}
                        onClick={() => handleToggleStatus(row)}
                        title={row.isActive ? "Deactivate User" : "Activate User"}
                        className={row.isActive ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"}
                    />
                    <ActionButton
                        variant="delete"
                        icon={Trash2}
                        onClick={() => openDeleteModal(row)}
                        title="Delete User"
                    />
                    <ActionButton
                        variant="reset"
                        icon={Key}
                        onClick={() => openResetFormModal(row)}
                        title="Reset Password"
                    />
                </div>
            ),
        },
    ];

    const userStatuses = [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
    ];

    const handleStatusChange = (status) => {
        setSelectedStatus(status?.value || "");
        setCurrentPage(1);
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] border border-gray-100 min-h-[500px] flex flex-col">
            <PageTitlePart
                buttonOnClick={openAddModal}
                buttonLabel="Add User"
                searchInput={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
                placeholder="Search users..."
                isStatusFilter={true}
                statusOptions={userStatuses}
                selectedStatus={selectedStatus}
                handleStatusChange={handleStatusChange}
            />
            <div className="p-2 sm:p-6">
                <Table
                    columns={columns}
                    data={users}
                    pageSize={pageSize}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    className="w-full"
                />
            </div>

            {/* Add/Edit/View Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                headerLabel={viewMode ? "User Details" : (editMode ? "Edit User" : "Add New User")}
                size="5xl"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            label={viewMode ? "Close" : "Cancel"}
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                        />
                        {!viewMode && (
                            <Button
                                variant="primary"
                                label={isSubmitting ? "Saving..." : (editMode ? "Save Changes" : "Add User")}
                                onClick={formik.handleSubmit}
                                disabled={isSubmitting}
                            />
                        )}
                    </div>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                name="first_name"
                                placeholder="John"
                                {...formik.getFieldProps("first_name")}
                                error={formik.touched.first_name && formik.errors.first_name}
                                startIcon={<UserIcon className="w-4 h-4" />}
                                required
                                disabled={viewMode}
                            />
                            <Input
                                label="Last Name"
                                name="last_name"
                                placeholder="Doe"
                                {...formik.getFieldProps("last_name")}
                                error={formik.touched.last_name && formik.errors.last_name}
                                startIcon={<UserIcon className="w-4 h-4" />}
                                required
                                disabled={viewMode}
                            />
                        </div>
                        <Input
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            {...formik.getFieldProps("email")}
                            error={formik.touched.email && formik.errors.email}
                            startIcon={<Mail className="w-4 h-4" />}
                            required
                            disabled={viewMode}
                        />
                        {!viewMode && <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder={editMode ? "Leave empty to keep current" : "••••••••"}
                            {...formik.getFieldProps("password")}
                            error={formik.touched.password && formik.errors.password}
                            startIcon={<Lock className="w-4 h-4" />}
                            required={!editMode && !viewMode}
                            disabled={viewMode}
                        />}
                        <Input
                            label="Phone Number"
                            name="phone_number"
                            placeholder="+1 (555) 000-0000"
                            {...formik.getFieldProps("phone_number")}
                            error={formik.touched.phone_number && formik.errors.phone_number}
                            startIcon={<Phone className="w-4 h-4" />}
                            disabled={viewMode}
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Screen Permissions</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[350px] overflow-y-auto">
                            <div className="grid grid-cols-1 gap-3">
                                {screens.map((screen) => (
                                    <label
                                        key={screen.id}
                                        className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 transition-all group ${viewMode ? 'cursor-default' : 'cursor-pointer hover:border-[var(--color-brand-primary)] hover:shadow-sm'}`}
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] cursor-pointer disabled:opacity-50 disabled:cursor-default"
                                                checked={formik.values.screen_ids.includes(screen.id)}
                                                onChange={() => handleCheckboxChange(screen.id)}
                                                disabled={viewMode}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700 group-hover:text-[var(--color-brand-primary)]">
                                                {screen.screenName}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {screen.route}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                                {screens.length === 0 && (
                                    <p className="text-center text-xs text-gray-500 py-4">No screens available.</p>
                                )}
                            </div>
                        </div>
                        {formik.touched.screen_ids && formik.errors.screen_ids && (
                            <p className="text-xs text-red-500 mt-2 font-medium">
                                {formik.errors.screen_ids}
                            </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-3 italic">
                            * Selected screens will be accessible to this user immediately.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone and will remove all their permissions.`}
                confirmLabel="Delete User"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Reset Password Form Modal */}
            <Modal
                isOpen={isResetFormOpen}
                onClose={() => setIsResetFormOpen(false)}
                headerLabel="Reset User Password"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            label="Cancel"
                            onClick={() => setIsResetFormOpen(false)}
                            disabled={isSubmitting}
                        />
                        <Button
                            variant="primary"
                            label={isSubmitting ? "Resetting..." : "Reset Password"}
                            onClick={handleResetPassword}
                            disabled={isSubmitting}
                        />
                    </div>
                }
            >
                <div className="space-y-4 py-2">
                    <p className="text-sm text-gray-500 mb-4">
                        Resetting password for <span className="font-bold text-gray-900">{selectedUser?.name}</span>
                    </p>
                    <Input
                        label="New Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={resetFormData.password}
                        onChange={(e) => setResetFormData(prev => ({ ...prev, password: e.target.value }))}
                        startIcon={<Lock className="w-4 h-4" />}
                        required
                    />
                    <Input
                        label="Confirm New Password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={resetFormData.confirmPassword}
                        onChange={(e) => setResetFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        startIcon={<Lock className="w-4 h-4" />}
                        required
                    />
                </div>
            </Modal>

            {/* Reset Password Success Modal */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                headerLabel="Password Reset Successful"
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            label="Copy Both & Close"
                            startIcon={copiedField === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            onClick={handleCopyAll}
                        />
                        <Button
                            variant="primary"
                            label="Close"
                            onClick={() => setIsResetModalOpen(false)}
                        />
                    </div>
                }
            >
                <div className="space-y-6 py-2">
                    <p className="text-sm text-gray-500">
                        The password has been updated. You can copy the credentials below.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email Address</label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                <span className="text-sm font-medium text-gray-700 flex-1 truncate">{resetDetails.email}</span>
                                <button
                                    onClick={() => handleCopy(resetDetails.email, 'email')}
                                    className="cursor-pointer p-1.5 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-[var(--color-brand-primary)]"
                                    title="Copy Email"
                                >
                                    {copiedField === 'email' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">New Password</label>
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                <span className="text-sm font-mono font-bold text-gray-800 flex-1">{resetDetails.password}</span>
                                <button
                                    onClick={() => handleCopy(resetDetails.password, 'password')}
                                    className="cursor-pointer p-1.5 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-[var(--color-brand-primary)]"
                                    title="Copy Password"
                                >
                                    {copiedField === 'password' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                        <div className="p-1 bg-amber-100 rounded-full h-fit">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            Ensure you copy these credentials. For security, the password cannot be retrieved again.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
