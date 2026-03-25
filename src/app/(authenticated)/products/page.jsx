"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Edit2, Trash2, Plus, Search, Package,
    IndianRupee, Tag, Calendar, BoxSelect, Layers
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Input from "@/components/ui/Input";
import { showToast } from "@/utils/toast";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";
import PageTitlePart from "@/components/PageTitlePart";
import ActionButton from "@/components/ui/ActionButton";

// ── Palette for product cards ──
const CARD_COLORS = [
    { bg: "bg-blue-50", border: "border-blue-100", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-100 text-blue-700" },
    { bg: "bg-purple-50", border: "border-purple-100", icon: "bg-purple-100 text-purple-600", badge: "bg-purple-100 text-purple-700" },
    { bg: "bg-green-50", border: "border-green-100", icon: "bg-green-100 text-green-600", badge: "bg-green-100 text-green-700" },
    { bg: "bg-orange-50", border: "border-orange-100", icon: "bg-orange-100 text-orange-600", badge: "bg-orange-100 text-orange-700" },
    { bg: "bg-rose-50", border: "border-rose-100", icon: "bg-rose-100 text-rose-600", badge: "bg-rose-100 text-rose-700" },
    { bg: "bg-teal-50", border: "border-teal-100", icon: "bg-teal-100 text-teal-600", badge: "bg-teal-100 text-teal-700" },
];

function ProductCard({ product, index, onEdit, onDelete }) {
    const c = CARD_COLORS[index % CARD_COLORS.length];
    const initials = product.name
        .split(" ")
        .map(w => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className={`group relative rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200`}>
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center text-base font-black shrink-0`}>
                    {initials}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-400 hover:text-blue-600 border border-white/60 shadow-sm transition-all"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button> */}
                    <ActionButton onClick={() => onEdit(product)} icon={Edit2} />
                    <ActionButton variant="delete" onClick={() => onDelete(product)} icon={Trash2} />
                    {/* <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-400 hover:text-red-500 border border-white/60 shadow-sm transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button> */}
                </div>
            </div>

            {/* Name & Description */}
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description || "No description provided."}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-black/5">
                <div className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-gray-700" />
                    <span className="text-lg font-black text-gray-900">
                        {product.price ? Number(product.price).toFixed(2) : "0.00"}
                    </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${c.badge}`}>
                    {new Date(product.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
                <Layers className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No products yet</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6">
                Start by adding your first product to the catalog. It will appear here as a card.
            </p>
            <Button
                variant="primary"
                className="!rounded-xl"
                onClick={onAdd}
                startIcon={<Plus className="w-4 h-4 text-white" />}
                label="Add First Product"
            />
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 flex flex-col gap-4 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="h-5 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-20" />
            </div>
        </div>
    );
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 12; // Grid looks better with 12

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ name: "", description: "", price: "" });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/products", window.location.origin);
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
                setProducts(data.products);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleOpenModal = (product = null) => {
        console.log(product);
        if (product) {
            setCurrentProduct(product);
            setFormData({ name: product.name, description: product.description || "", price: product.price?.toString() || "" });
        } else {
            setCurrentProduct(null);
            setFormData({ name: "", description: "", price: "" });
        }
        setIsProductModalOpen(true);
    };

    const handleCloseModal = () => { setIsProductModalOpen(false); setCurrentProduct(null); };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setIsSubmitting(true);
        try {
            const method = currentProduct ? "PATCH" : "POST";
            const url = currentProduct ? `/api/products/${currentProduct.id}` : "/api/products";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", currentProduct ? "Product updated!" : "Product created!");
                handleCloseModal();
                fetchProducts();
            } else {
                const data = await response.json();
                showToast("error", data.error || "Something went wrong");
            }
        } catch (error) {
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (product) => { setCurrentProduct(product); setIsDeleteModalOpen(true); };

    const confirmDelete = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/products/${currentProduct.id}`, { method: "DELETE" });
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", "Product deleted");
                setIsDeleteModalOpen(false);
                fetchProducts();
            } else {
                const data = await response.json();
                showToast("error", data.error || "Failed to delete");
            }
        } catch {
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ── Header ── */}



            {/* ── Product Grid ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
                {/* <div className="px-6 pt-6 border-b border-gray-50 flex justify-end items-center">

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-blue-500/5 rounded-md text-sm w-full transition-all outline-none"
                            />
                        </div>
                        <Button
                            onClick={() => handleOpenModal()}
                            startIcon={<Plus className="w-4 h-4 text-white" />}
                            label="New Product"
                        />
                    </div>
                </div> */}
                <PageTitlePart buttonOnClick={() => handleOpenModal()} buttonLabel="New Product" searchInput={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search products..." />
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <EmptyState onAdd={() => handleOpenModal()} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                            {products.map((product, index) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                    onEdit={handleOpenModal}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-400 font-medium">
                                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .map((p, i, arr) => (
                                            <React.Fragment key={p}>
                                                {i > 0 && arr[i - 1] !== p - 1 && (
                                                    <span className="text-gray-300 text-xs px-1">…</span>
                                                )}
                                                <button
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${p === currentPage
                                                        ? "bg-[var(--color-brand-primary)] text-white shadow-sm"
                                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        ))
                                    }
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            <Modal
                isOpen={isProductModalOpen}
                onClose={handleCloseModal}
                headerLabel={currentProduct ? "Edit Product" : "New Product"}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" label="Cancel" onClick={handleCloseModal} disabled={isSubmitting} />
                        <Button
                            variant="primary"
                            label={isSubmitting ? "Saving..." : currentProduct ? "Update Product" : "Create Product"}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        />
                    </div>
                }
            >
                <form className="flex flex-col gap-5 p-2" onSubmit={handleSubmit}>
                    <Input
                        label="Product Name"
                        name="name"
                        placeholder="e.g. Fire Extinguisher ABC"
                        required
                        value={formData.name}
                        onChange={handleFormChange}
                        startIcon={<Package className="w-4 h-4" />}
                    />
                    <Input
                        type="textarea"
                        label="Description"
                        name="description"
                        placeholder="Detailed product information..."
                        value={formData.description}
                        onChange={handleFormChange}
                        rows={3}
                    />
                    <Input
                        type="number"
                        label="Price (₹)"
                        name="price"
                        placeholder="0.00"
                        step="0.01"
                        value={formData.price}
                        onChange={handleFormChange}
                        startIcon={<IndianRupee className="w-4 h-4" />}
                    />
                </form>
            </Modal>

            {/* ── Delete Confirmation ── */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Product"
                message={`Are you sure you want to delete "${currentProduct?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                isLoading={isSubmitting}
            />
        </div>
    );
}
