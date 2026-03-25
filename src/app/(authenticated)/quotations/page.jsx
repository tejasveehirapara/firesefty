"use client";

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { Plus, ShoppingBag, Trash2, User, Phone, Mail, MapPin, Package, Edit, Search, MoreVertical, History } from "lucide-react";
import Chip from "@/components/ui/Chip";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/utils/toast";
import ActionButton from "@/components/ui/ActionButton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import PageTitlePart from "@/components/PageTitlePart";
import DatePicker from "@/components/ui/DatePicker";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";
import { Formik, Form, FieldArray, Field } from "formik";
import * as Yup from "yup";

const statuses = [{ label: "Quotation Sent", value: "QuotationSent" }
    , { label: "Discussion", value: "Discussion" }
    , { label: "Confirmed", value: "Confirmed" }
    , { label: "Completed", value: "Completed" },
{ label: "Cancelled", value: "Cancelled" }];

export default function SalesPage() {
    const router = useRouter();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // Modal
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const [search, setSearch] = useState("")
    const [searchInput, setSearchInput] = useState("");

    // Low Stock Alert
    const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);
    const [lowStockData, setLowStockData] = useState([]);

    // Sales validation schema
    const saleSchema = Yup.object().shape({
        buyerName: Yup.string().required("Buyer name is required"),
        buyerPhone: Yup.string().required("Phone number is required"),
        buyerEmail: Yup.string().email("Invalid email"),
        buyerAddress: Yup.string(),
        quotationDate: Yup.date().required("Date is required"),
        items: Yup.array().of(
            Yup.object().shape({
                productId: Yup.string().required("Product is required"),
                quantity: Yup.number().min(1, "Minimum 1").required("Quantity is required"),
                price: Yup.number().min(0, "Invalid price").required("Price is required")
            })
        ).min(1, "At least one item is required")
    });

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {

            const url = new URL("/api/sales", window.location.origin);
            url.searchParams.append("page", currentPage);
            url.searchParams.append("pageSize", pageSize);
            url.searchParams.append("search", search);
            url.searchParams.append("status", selectedStatus);
            if (startDate) {
                const sDate = startDate instanceof Date ? startDate.toISOString() : new Date(startDate).toISOString();
                url.searchParams.append("startDate", sDate);
            }
            if (endDate) {
                const eDate = endDate instanceof Date ? endDate.toISOString() : new Date(endDate).toISOString();
                url.searchParams.append("endDate", eDate);
            }


            const res = await fetch(url);
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                setSales(data.sales);
                setTotalItems(data.totalItems);
                setTotalPages(data.totalPages);
            }
        } catch (err) {
            showToast("error", "Failed to fetch sales");
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, selectedStatus, startDate, endDate]);

    const fetchProducts = async () => {
        try {
            const [prodRes, invRes] = await Promise.all([
                fetch("/api/products?pageSize=1000"),
                fetch("/api/inventory?pageSize=1000")
            ]);
            const prodData = await prodRes.json();
            const invData = await invRes.json();

            if (prodData.code === 401 || invData.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            // Build a stock map from inventory
            const stockMap = {};
            (invData.inventory || []).forEach(inv => {
                stockMap[inv.id] = inv.currentStock;
            });

            if (prodRes.ok) {
                const productDropdown = invData.inventory.map((item) => {
                    return {
                        value: item.productId,
                        label: `${item.name}`,
                        price: parseFloat(item.price || 0),
                        // stock: item.currentStock,
                        // isDisabled: item.currentStock === 0,
                    }
                })

                setProducts(productDropdown);
            }
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const confirmExport = async (values, { resetForm }) => {
        setExportLoading(true);
        try {
            const response = await fetch("/api/sales/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    search,
                    status: selectedStatus,
                    startDate,
                    endDate,
                    fileName: values.fileName,
                    exportType: values.exportType
                })
            });

            if (!response.ok) {
                const data = await response.json();
                if (data.code === 401) {
                    clearCurrentUser()
                    router.push("/");
                    return;
                }
                throw new Error(data.error || "Export failed");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const contentDisposition = response.headers.get('Content-Disposition');
            const fileNameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            a.download = fileNameMatch ? fileNameMatch[1] : `${values.fileName}.${values.exportType === "EXLS" ? "xls" : "csv"}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);


            setIsExportModalOpen(false);
            resetForm();
            showToast("success", "Quotation records exported successfully");
        } catch (error) {
            console.error("Export error:", error);
            showToast("error", "Failed to export quotation records");
        } finally {
            setExportLoading(false);
        }
    };

    const handleOpenModal = () => {
        setSelectedSale(null);
        setIsSaleModalOpen(true);
        fetchProducts();
    };

    const handleEdit = (sale) => {
        setSelectedSale(sale);
        setIsSaleModalOpen(true);
        fetchProducts();
    };

    const handleDelete = (sale) => {
        setSelectedSale(sale);
        setIsConfirmOpen(true);
    };

    const updateSaleStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/sales/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                showToast("success", `Status updated to ${newStatus}`);
                setOpenMenuId(null);
                fetchSales();
            } else {
                const data = await response.json();
                if (data.stockCheck) {
                    setLowStockData(data.stockCheck);
                    setIsLowStockModalOpen(true);
                    setOpenMenuId(null);
                } else {
                    showToast("error", data.error || "Failed to update status");
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("error", "Error updating status");
        }
    };

    const handleViewHistory = (sale) => {
        setSelectedSale(sale);
        setIsHistoryModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedSale) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/sales/${selectedSale.id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                showToast("success", "Sale deleted successfully");
                setIsConfirmOpen(false);
                fetchSales();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to delete sale");
            }
        } catch (error) {
            showToast("error", "Error deleting sale");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        // Validate stock
        for (const item of values.items) {
            const product = products.find(p => p.value === item.productId);
            if (product && item.quantity > product.stock) {
                showToast("error", `"${product.label}" only has ${product.stock} units available`);
                setSubmitting(false);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const url = selectedSale ? `/api/sales/${selectedSale.id}` : "/api/sales";
            const method = selectedSale ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    items: values.items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price }))
                })
            });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                showToast("success", `Sale ${selectedSale ? "updated" : "created"} successfully!`);
                setIsSaleModalOpen(false);
                fetchSales();
            } else {
                showToast("error", data.error || "Failed to create sale");
            }
        } catch (err) {
            showToast("error", "Internal server error");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status?.value || "")
        setCurrentPage(1)
    }

    const columns = [
        {
            key: "buyerName",
            label: "Buyer",
            render: (name, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-[var(--color-brand-primary)] border border-blue-100 uppercase shrink-0">
                        {name?.charAt(0)}{name?.split(" ")[1]?.charAt(0)}
                    </div>
                    <div>
                        <div className="font-semibold text-[12px] sm:text-sm text-gray-900 ">{name}</div>
                        <div className="text-[11px] text-gray-400 font-medium">
                            <a href={`mailto:${row.buyerEmail}`} className="hover:text-blue-600 hover:underline">{row.buyerEmail}</a>
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: "buyerPhone",
            label: "Phone",
            render: (phone) => <a href={`tel:${phone}`} className="text-[12px] sm:text-sm text-gray-600 hover:text-blue-600 hover:underline">{phone}</a>
        },
        {
            key: "buyerAddress",
            label: "Address",
            render: (address) => <span className="text-[12px] sm:text-sm text-gray-600">{address || "-"}</span>,
            sortable: false,
        },
        {
            key: "status",
            label: "Status",
            render: (status) => <Chip status={status} />,
            sortable: false,
        },
        {
            key: "",
            label: "Total Amount",
            render: (_, row) => {
                const totalAmount = row.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
                return <span className="text-[12px] sm:text-sm text-gray-600">₹{totalAmount}</span>
            },
            sortable: false,
        },

        {
            key: "quotationDate",
            label: "Quotation Date",
            render: (quotationDate) => (
                <span className="text-[12px] sm:text-sm text-gray-500 text-nowrap">
                    {new Date(quotationDate).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                </span>
            ),
            sortable: false,
        },
        {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (_, row) => (
                <div className="flex gap-2 justify-end">
                    <ActionButton icon={History} variant="view" title="Status History" onClick={(e) => { e.stopPropagation(); handleViewHistory(row); }} />
                    <ActionButton icon={Edit} disabled={row.status === "Completed"} variant="edit" onClick={(e) => { e.stopPropagation(); handleEdit(row); }} />
                    <ActionButton icon={Trash2} disabled={row.status === "Completed"} variant="delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} />
                    <StatusDropdown
                        sale={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        updateSaleStatus={updateSaleStatus}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] border border-gray-100 min-h-[500px] ">

            <div className="bg-white rounded-[var(--table-radius)] border border-[var(--table-border)] flex flex-col shadow-sm">
                <div className="flex flex-col justify-end items-end">
                    <PageTitlePart isStatusFilter={true} statusOptions={statuses}
                        handleStatusChange={handleStatusChange} selectedStatus={selectedStatus}
                        buttonLabel="New Quotation" buttonOnClick={() => { setSelectedSale(null); setIsSaleModalOpen(true); fetchProducts(); }}
                        searchInput={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by buyer or product..." isDateRange={true}
                        startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate}
                        onDateChange={() => setCurrentPage(1)}
                        onExport={handleExport}
                        isExport={true}
                    />

                </div>
                <div className="p-4">
                    <Table
                        columns={columns}
                        data={sales}
                        loading={loading}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        className="w-full"
                        renderExpandedRow={(sale) => (
                            <div className=" p-2 sm:p-4 bg-gray-50/50 rounded-xl my-2 border border-gray-100/50">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-3.5 h-3.5" /> Order Items ({sale.items?.length || 0})
                                </h4>
                                <div className="space-y-1 grid grid-cols-2 xl:grid-cols-3 gap-4">
                                    {sale.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:border-blue-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-[12px] sm:text-sm">{item.product?.name || "Unknown Product"}</p>
                                                    <p className="text-[11px] text-gray-400 font-medium">Unit Price: <span className="text-gray-600">₹{item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : "0.00"}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-6">
                                                <div>
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Qty</p>
                                                    <p className="font-black text-gray-900 text-[12px]  sm:text-sm">{item.quantity}</p>
                                                </div>
                                                <div className="w-24">
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Subtotal</p>
                                                    <p className="font-black text-[var(--color-brand-primary)] text-[12px]  sm:text-sm">
                                                        ₹{((parseFloat(item.unitPrice || 0)) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Add Sale Modal */}
            <Formik
                initialValues={{
                    buyerName: selectedSale?.buyerName || "",
                    buyerPhone: selectedSale?.buyerPhone || "",
                    buyerEmail: selectedSale?.buyerEmail || "",
                    buyerAddress: selectedSale?.buyerAddress || "",
                    quotationDate: selectedSale?.quotationDate ? new Date(selectedSale.quotationDate) : new Date(),
                    items: selectedSale?.items?.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.unitPrice
                    })) || [{ productId: "", quantity: 1, price: "" }]
                }}
                validationSchema={saleSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, isSubmitting: formikSubmitting, handleSubmit: formikSubmit }) => (
                    <Modal
                        isOpen={isSaleModalOpen}
                        onClose={() => setIsSaleModalOpen(false)}
                        headerLabel={selectedSale ? "Edit Quotation" : "Create New Quotation"}
                        size="5xl"
                        footer={
                            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                                <div className="w-full sm:w-auto text-center sm:text-left bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-gray-100 sm:border-0">
                                    <span className="text-[11px] text-gray-400 uppercase font-black block">Estimated Total</span>
                                    <span className="text-xl font-black text-gray-900">₹{
                                        values.items.reduce((sum, item) => sum + (Number(item.price || 0) * (parseInt(item.quantity) || 0)), 0).toFixed(2)
                                    }</span>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <Button className="flex-1 sm:flex-none" variant="outline" label="Cancel" onClick={() => setIsSaleModalOpen(false)} disabled={isSubmitting} />
                                    <Button
                                        className="flex-1 sm:flex-none"
                                        variant="primary"
                                        label={isSubmitting ? (selectedSale ? "Updating..." : "Creating...") : (selectedSale ? "Update Quotation" : "Create Quotation")}
                                        onClick={formikSubmit}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        }
                    >
                        <Form className="flex flex-col gap-6 p-2">
                            {/* ── Buyer Details ── */}
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> Buyer Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        name="buyerName"
                                        placeholder="e.g. James Smith"
                                        value={values.buyerName}
                                        onChange={(e) => setFieldValue("buyerName", e.target.value)}
                                        startIcon={<User className="w-4 h-4" />}
                                        required
                                        error={touched.buyerName && errors.buyerName}
                                    />
                                    <Input
                                        label="Phone Number"
                                        name="buyerPhone"
                                        placeholder="e.g. +91 98765 43210"
                                        value={values.buyerPhone}
                                        onChange={(e) => setFieldValue("buyerPhone", e.target.value)}
                                        startIcon={<Phone className="w-4 h-4" />}
                                        required
                                        error={touched.buyerPhone && errors.buyerPhone}
                                    />
                                    <Input
                                        label="Email Address"
                                        name="buyerEmail"
                                        type="email"
                                        placeholder="e.g. james@email.com"
                                        value={values.buyerEmail}
                                        onChange={(e) => setFieldValue("buyerEmail", e.target.value)}
                                        startIcon={<Mail className="w-4 h-4" />}
                                        error={touched.buyerEmail && errors.buyerEmail}
                                    />
                                    <Input
                                        label="Address"
                                        name="buyerAddress"
                                        placeholder="e.g. 123 Main St, City"
                                        value={values.buyerAddress}
                                        onChange={(e) => setFieldValue("buyerAddress", e.target.value)}
                                        startIcon={<MapPin className="w-4 h-4" />}
                                        error={touched.buyerAddress && errors.buyerAddress}
                                    />

                                    <DatePicker
                                        datePickerClass="bg-white"
                                        label="Quotation Date"
                                        value={values.quotationDate}
                                        onChange={(date) => setFieldValue("quotationDate", date)}
                                        error={touched.quotationDate && errors.quotationDate}
                                    />
                                </div>
                            </div>

                            {/* ── Sale Items ── */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <ShoppingBag className="w-3.5 h-3.5" /> Sale Items
                                    </h3>
                                </div>

                                <FieldArray name="items">
                                    {({ push, remove }) => (
                                        <div className="space-y-4 pr-1">
                                            {values.items.map((item, index) => {
                                                const selectedProduct = products.find(p => p.value === item.productId);

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-2xl border shadow-sm transition-all items-start ${selectedProduct && item.quantity > selectedProduct.stock
                                                            ? "border-red-200 bg-red-50/30"
                                                            : "border-gray-100 hover:border-blue-100"
                                                            }`}
                                                    >
                                                        {/* Product Select */}
                                                        <div className="md:col-span-4">
                                                            <Select
                                                                label="Product"
                                                                className={index > 0 ? "md:[&>label]:hidden" : ""}
                                                                options={products}
                                                                value={products.find(p => p.value === item.productId) || null}
                                                                onChange={(val) => {
                                                                    setFieldValue(`items.${index}.productId`, val?.value || "");
                                                                    setFieldValue(`items.${index}.price`, val?.price || 0);
                                                                    setFieldValue(`items.${index}.quantity`, 1);
                                                                }}
                                                                placeholder="Select product..."
                                                                error={touched.items?.[index]?.productId && errors.items?.[index]?.productId}
                                                            />
                                                        </div>

                                                        {/* Unit Price & Quantity grouped on mobile */}
                                                        <div className="grid grid-cols-2 md:col-span-4 gap-3">
                                                            <Input
                                                                label="Price"
                                                                className={index > 0 ? "md:[&>label]:hidden" : ""}
                                                                type="number"
                                                                value={item.price}
                                                                onChange={(e) => setFieldValue(`items.${index}.price`, e.target.value)}
                                                                placeholder="0.00"
                                                                error={touched.items?.[index]?.price && errors.items?.[index]?.price}
                                                            />
                                                            <Input
                                                                label="Qty"
                                                                className={index > 0 ? "md:[&>label]:hidden" : ""}
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => setFieldValue(`items.${index}.quantity`, e.target.value)}
                                                                placeholder="1"
                                                                error={touched.items?.[index]?.quantity && errors.items?.[index]?.quantity}
                                                            />
                                                        </div>

                                                        {/* Subtotal and Remove button */}
                                                        <div className="grid grid-cols-12 md:col-span-4 gap-3 w-full">
                                                            <div className="col-span-9">
                                                                <div className={`flex flex-col gap-1`}>
                                                                    <label className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider ${index > 0 ? 'md:hidden' : ''}`}>
                                                                        Subtotal
                                                                    </label>
                                                                    <div className="h-[38px] flex items-center px-3 bg-blue-50/50 border border-blue-100 rounded-xl text-[12px] font-bold text-[var(--color-brand-primary)]">
                                                                        ₹{(Number(item.price || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3">
                                                                <div className={`flex flex-col gap-1 items-center`}>
                                                                    <label className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider ${index > 0 ? 'md:hidden md:invisible' : 'invisible'}`}>
                                                                        Del
                                                                    </label>
                                                                    <div className="h-[38px] flex items-center justify-center">
                                                                        <ActionButton
                                                                            variant="delete"
                                                                            onClick={() => remove(index)}
                                                                            disabled={values.items.length === 1}
                                                                            icon={Trash2}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="small"
                                                    className="!rounded-xl text-[12px] font-bold"
                                                    onClick={() => push({ productId: "", quantity: 1, price: "" })}
                                                    startIcon={<Plus className="w-3.5 h-3.5" />}
                                                    label="Add Row"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </FieldArray>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Sale"
                message="Are you sure you want to delete this sale? Inventory will be restored."
                confirmLabel="Delete"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Status History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                headerLabel="Sale Status Timeline"
                size="md"
            >
                <div className="py-6 overflow-y-auto max-h-[70vh]">
                    {selectedSale?.history?.length > 0 ? (
                        <div className="relative">
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full" />
                            <div className="space-y-8">
                                {selectedSale.history.map((record, index) => (
                                    <div key={index} className="relative flex gap-4 group">
                                        <div className={`relative z-10 flex items-center justify-center w-6 min-w-6 h-6 rounded-full border-4 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${index === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-200'}`}>
                                            {index === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold tracking-tight ${index === 0 ? 'text-gray-900' : 'text-gray-500 font-semibold'}`}>
                                                        {record.status}
                                                    </span>
                                                    <Chip status={record.status} />
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 shadow-sm shrink-0">
                                                    {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${index === 0 ? 'bg-gradient-to-br from-white to-blue-50/10 border-blue-100 shadow-md ring-1 ring-blue-50/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {record.user?.firstName?.[0] || '?'}{record.user?.lastName?.[0] || ''}
                                                    </div>
                                                    <div>
                                                        <div className="text-[13px] font-semibold text-gray-800">
                                                            {record.user ? `${record.user.firstName} ${record.user.lastName}` : `Unknown User (${record.createdBy})`}
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 font-medium">
                                                            Status updated to {record.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <History className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-gray-900 font-bold mb-1">No history yet</h3>
                            <p className="text-sm text-gray-400 max-w-[200px]">This sale hasn't had any status updates recorded.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Low Stock Alert Modal */}
            <Modal
                isOpen={isLowStockModalOpen}
                onClose={() => setIsLowStockModalOpen(false)}
                headerLabel="Low Stock Warning"
                size="lg"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            variant="primary"
                            label="I'll Manage Stock"
                            onClick={() => setIsLowStockModalOpen(false)}
                        />
                    </div>
                }
            >
                <div className="p-4">
                    <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-red-900 font-black text-lg">Inventory Shortage</h3>
                            <p className="text-red-700 text-sm">{`${lowStockData.length} items in this sale have insufficient stock to mark as completed.`}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-3 text-center">Available</div>
                            <div className="col-span-3 text-center">Required</div>
                        </div>

                        {lowStockData.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-red-100 transition-all group">
                                <div className="col-span-6">
                                    <div className="font-bold text-gray-900 line-clamp-1">{item.product}</div>
                                    <div className="text-[10px] text-red-500 font-black uppercase tracking-wider flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                        Insufficient Stock
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="w-full h-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center border border-gray-100">
                                        <span className="text-[10px] text-gray-400 font-black uppercase leading-none mb-1">Stock</span>
                                        <span className="text-sm font-black text-gray-900 leading-none">{item.stock}</span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="w-full h-10 bg-red-50 rounded-xl flex flex-col items-center justify-center border border-red-100 group-hover:bg-red-100 transition-colors">
                                        <span className="text-[10px] text-red-400 font-black uppercase leading-none mb-1">Needed</span>
                                        <span className="text-sm font-black text-red-600 leading-none">{item.saleQuantity}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 shrink-0 mt-0.5">
                            <Edit className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-orange-800 font-medium leading-relaxed">
                            To complete this sale, please update your inventory or adjust the quantities in the sale record before trying again.
                        </p>
                    </div>
                </div>
            </Modal>

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={confirmExport}
                isLoading={exportLoading}
            />
        </div>
    );
}

const StatusDropdown = ({ sale, openMenuId, setOpenMenuId, updateSaleStatus }) => {
    const isOpen = openMenuId === sale.id;
    const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0, isUpward: false });
    const triggerRef = React.useRef(null);

    React.useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const shouldOpenUpward = spaceBelow < 250 && rect.top > 250;

            if (shouldOpenUpward) {
                setMenuPos({
                    top: rect.top - 8,
                    left: rect.right - 192,
                    isUpward: true
                });
            } else {
                setMenuPos({
                    top: rect.bottom + 8,
                    left: rect.right - 192,
                    isUpward: false
                });
            }
        }
    }, [isOpen]);

    const handleToggle = (e) => {
        e.stopPropagation();
        setOpenMenuId(isOpen ? null : sale.id);
    };

    return (
        <div className="relative" ref={triggerRef}>
            <div>
                <ActionButton
                    icon={MoreVertical}
                    onClick={handleToggle}
                />
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setOpenMenuId(null)}
                    ></div>
                    <div
                        className="fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[101]"
                        style={{
                            top: `${menuPos.top}px`,
                            left: `${menuPos.left}px`,
                            transform: menuPos.isUpward ? 'translateY(-100%)' : 'none',
                            visibility: menuPos.top === 0 ? 'hidden' : 'visible'
                        }}
                    >
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                            Update Status
                        </div>
                        {statuses.map((status) => (
                            <button
                                key={status.label}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateSaleStatus(sale.id, status.value);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${sale.status === status.value ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-gray-700'
                                    }`}
                            >
                                {status.label}
                                {sale.status === status.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ExportModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const exportTypes = [
        { label: "CSV (Comma Separated Values)", value: "CSV" },
        { label: "XLS (Excel Spreadsheet)", value: "EXLS" }
    ];

    return (
        <Formik
            initialValues={{ fileName: `quotations_export_${new Date().toISOString().split('T')[0]}`, exportType: "CSV" }}
            validationSchema={Yup.object().shape({
                fileName: Yup.string().required("File name is required"),
                exportType: Yup.string().required("Export type is required")
            })}
            onSubmit={onConfirm}
        >
            {({ values, errors, touched, setFieldValue, handleSubmit }) => (
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    headerLabel="Export Quotation Records"
                    size="md"
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="outline" label="Cancel" onClick={onClose} disabled={isLoading} />
                            <Button variant="primary" label={isLoading ? "Exporting..." : "Download File"} onClick={handleSubmit} disabled={isLoading} />
                        </div>
                    }
                >
                    <div className="space-y-4 p-2">
                        <Input
                            label="File Name"
                            name="fileName"
                            placeholder="e.g. quotations_q1_2024"
                            value={values.fileName}
                            onChange={(e) => setFieldValue("fileName", e.target.value)}
                            error={touched.fileName && errors.fileName}
                            required
                        />
                        <Select
                            label="Export Format"
                            options={exportTypes}
                            value={exportTypes.find(t => t.value === values.exportType)}
                            onChange={(val) => setFieldValue("exportType", val?.value || "CSV")}
                            error={touched.exportType && errors.exportType}
                            required
                        />
                    </div>
                </Modal>
            )}
        </Formik>
    );
}
