"use client"

import React, { useState, useEffect, useCallback } from "react";
import { Edit2, Trash2, Mail, Phone, Plus, Search, Package, User, Eye } from "lucide-react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ActionButton from "@/components/ui/ActionButton";
import PageTitlePart from "@/components/PageTitlePart";
import { showToast } from "@/utils/toast";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";

export default function VendorsPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]); // For the multi-select
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // Modal states
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        selectedProducts: [] // This will store react-select objects {value, label}
    });

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/vendors", window.location.origin);
            url.searchParams.append("page", currentPage);
            url.searchParams.append("pageSize", pageSize);
            url.searchParams.append("search", search);

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                setVendors(data.vendors || []);
                setTotalItems(data.totalItems || 0);
                setTotalPages(data.totalPages || 0);
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    const fetchAllProducts = async () => {
        try {
            // Fetching a large page size to get options for the dropdown
            const response = await fetch("/api/products?pageSize=100");
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                const options = data.products.map(p => ({
                    value: p.id,
                    label: p.name
                }));
                setProducts(options);
            }
        } catch (error) {
            console.error("Error fetching products for dropdown:", error);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    useEffect(() => {
        fetchAllProducts();
    }, []);

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleOpenModal = (vendor = null) => {
        if (vendor) {
            setSelectedVendor(vendor);
            setFormData({
                name: vendor.name,
                email: vendor.email,
                phone_number: vendor.phoneNumber,
                selectedProducts: (vendor.products || []).map(p => ({
                    value: p.product?.id,
                    label: p.product?.name
                }))
            });
        } else {
            setSelectedVendor(null);
            setFormData({
                name: "",
                email: "",
                phone_number: "",
                selectedProducts: []
            });
        }
        setIsVendorModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsVendorModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedVendor(null);
    };

    const handleViewDetails = (vendor) => {
        setSelectedVendor(vendor);
        setIsViewModalOpen(true);
    };

    const handleDeleteClick = (vendor) => {
        setSelectedVendor(vendor);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedVendor) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/vendors/${selectedVendor.id}`, {
                method: "DELETE"
            });
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", "Vendor deleted successfully");
                setIsConfirmDeleteOpen(false);
                fetchVendors();
            } else {
                const data = await response.json();
                showToast("error", data.error || "Failed to delete vendor");
            }
        } catch (error) {
            console.error("Error deleting vendor:", error);
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
            setSelectedVendor(null);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (selected, selectedItem) => {
        const selectedProducts = selectedItem?.value === "all" ? products : selected;
        setFormData(prev => ({ ...prev, selectedProducts: selectedProducts || [] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone_number: formData.phone_number,
                product_ids: formData.selectedProducts.map(p => p.value)
            };

            const url = selectedVendor
                ? `/api/vendors/${selectedVendor.id}`
                : "/api/vendors";

            const method = selectedVendor ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", selectedVendor ? "Vendor updated successfully" : "Vendor added successfully");
                handleCloseModal();
                fetchVendors();
            } else {
                const data = await response.json();
                showToast("error", data.error || "Failed to save vendor");
            }
        } catch (error) {
            console.error("Error saving vendor:", error);
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        {
            key: "name",
            label: "Vendor",
            render: (name, row) => (
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
                        <User className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900 text-[12px] sm:text-[15px] leading-tight mb-0.5">{name}</div>
                        <div className="text-[10px] sm:text-[12px] text-gray-400 font-medium">Created On: {new Date(row.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            key: "contact",
            label: "Contact Details",
            render: (_, row) => (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] sm:text-[13px] text-gray-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`mailto:${row.email}`} className="hover:text-blue-600 hover:underline">{row.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[13px] text-gray-600 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${row.phoneNumber}`} className="hover:text-blue-600 hover:underline">{row.phoneNumber}</a>
                    </div>
                </div>
            ),
        },
        {
            key: "productsCount",
            label: "Assigned Products",
            render: (_, row) => (
                <div className="flex flex-wrap gap-1 max-w-[300px]">
                    {row.products && row.products.length > 0 ? (
                        <>
                            {row.products.slice(0, 2).map((p, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold">
                                    {p.product?.name}
                                </span>
                            ))}
                            {row.products.length > 2 && (
                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px] font-bold">
                                    +{row.products.length - 2} More
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-400 text-xs font-medium italic">No products assigned</span>
                    )}
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1.5">
                    <ActionButton variant="view" icon={Eye} onClick={() => handleViewDetails(row)} />
                    <ActionButton variant="edit" icon={Edit2} onClick={() => handleOpenModal(row)} />
                    <ActionButton variant="delete" icon={Trash2} onClick={() => handleDeleteClick(row)} />
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[var(--table-radius)] border border-[var(--table-border)] flex flex-col overflow-hidden shadow-sm">

                <PageTitlePart buttonLabel="Add Vendor" placeholder="Search vendors..." searchInput={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} buttonOnClick={() => handleOpenModal()} />
                <div className="p-4">
                    <Table
                        columns={columns}
                        data={vendors}
                        loading={loading}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Add/Edit Vendor Modal */}
            <Modal
                isOpen={isVendorModalOpen}
                onClose={handleCloseModal}
                headerLabel={selectedVendor ? "Edit Vendor" : "Add New Vendor"}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            label="Cancel"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                        />
                        <Button
                            variant="primary"
                            label={isSubmitting ? "Processing..." : (selectedVendor ? "Update Vendor" : "Add Vendor")}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        />
                    </div>
                }
            >
                <form className="flex flex-col gap-5 p-2" onSubmit={handleSubmit}>
                    <Input
                        label="Vendor Name"
                        name="name"
                        placeholder="e.g. SafeFire Co."
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        startIcon={<User className="w-4 h-4" />}
                    />
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        placeholder="contact@vendor.com"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        startIcon={<Mail className="w-4 h-4" />}
                    />
                    <Input
                        label="Phone Number"
                        name="phone_number"
                        placeholder="+1 (555) 000-0000"
                        required
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        startIcon={<Phone className="w-4 h-4" />}
                    />
                    <Select
                        label="Assign Products"
                        isMulti
                        options={[{ label: "Select All", value: "all" }, ...products]}
                        value={formData.selectedProducts}
                        onChange={(e, selectedItem) => { handleSelectChange(e, selectedItem?.option); }}
                        placeholder="Select products to assign..."
                    />
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Vendor"
                message={`Are you sure you want to delete ${selectedVendor?.name}? This action cannot be undone and will remove all product mappings for this vendor.`}
                confirmLabel="Delete Vendor"
                loading={isSubmitting}
                variant="danger"
            />

            {/* View Vendor Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={handleCloseModal}
                headerLabel="Vendor Details"
                size="lg"
            >
                <div className="p-4 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100">
                        <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm shrink-0">
                            <User className="w-10 h-10" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedVendor?.name}</h2>
                            <p className="text-sm text-gray-400 font-medium">Retailer & Supplier Partner</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" /> Email Address
                            </h3>
                            <a href={`mailto:${selectedVendor?.email}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline">{selectedVendor?.email}</a>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5" /> Phone Number
                            </h3>
                            <a href={`tel:${selectedVendor?.phoneNumber}`} className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline">{selectedVendor?.phoneNumber}</a>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 md:col-span-2">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Assigned Products ({selectedVendor?.products?.length || 0})
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedVendor?.products && selectedVendor.products.length > 0 ? (
                                    selectedVendor.products.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            {p.product?.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No products currently assigned to this vendor.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                            <Search className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-blue-800 font-medium">This vendor was added to the system on <span className="font-bold">{new Date(selectedVendor?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                    </div>
                </div>
            </Modal>
        </div>
    );
}


