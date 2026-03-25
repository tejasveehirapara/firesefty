"use client"

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Plus, Calendar, Search, Trash2, ShoppingCart, Loader2, Edit, ShoppingBag, Package, View, MoreVertical, History } from "lucide-react";
import Chip from "@/components/ui/Chip";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ActionButton from "@/components/ui/ActionButton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import DatePicker from "@/components/ui/DatePicker";
import { showToast } from "@/utils/toast";
import PageTitlePart from "@/components/PageTitlePart";
import { Formik, Form, FieldArray } from "formik";
import { clearCurrentUser } from "@/utils/AuthCookie";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

const statuses = [
    { label: "Created", value: "Created" },
    { label: "Discussion", value: "Discussion" },
    { label: "Reminder Sent", value: "ReminderSent" },
    { label: "Confirmed", value: "Confirmed" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" }];

export default function PurchasesPage() {
    const router = useRouter();


    const [purchases, setPurchases] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const pageSize = 10;

    const [search, setSearch] = useState("")
    const [searchInput, setSearchInput] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Modal states
    const [isPOModalOpen, setIsPOModalOpen] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    const exportSchema = Yup.object().shape({
        fileName: Yup.string().required("File name is required"),
        exportType: Yup.string().required("Export type is required"),
    });

    const purchaseSchema = Yup.object().shape({
        vendorId: Yup.string().required("Vendor is required"),
        purchaseDate: Yup.date().required("Date is required"),
        items: Yup.array().of(
            Yup.object().shape({
                productId: Yup.string().required("Product is required"),
                quantity: Yup.number().min(1, "Minimum 1").required("Quantity is required"),
                unitPrice: Yup.number().min(1, "Invalid price").required("Price is required")
            })
        ).min(1, "At least one item is required")
    });

    const [purchaseDate, setPurchaseDate] = useState(new Date());

    const fetchPurchases = useCallback(async () => {
        setLoading(true);
        try {
            const url = new URL("/api/purchases", window.location.origin);
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

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                setPurchases(data.purchases || []);
                setTotalItems(data.totalItems || 0);
                setTotalPages(data.totalPages || 0);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, startDate, endDate, selectedStatus]);

    const fetchVendors = async () => {
        try {
            const response = await fetch("/api/vendors?pageSize=100");
            const data = await response.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (response.ok) {
                const options = data.vendors.map(v => ({
                    value: v.id,
                    label: v.name,
                    vendorData: v
                }));
                setVendors(options);
            }
        } catch (error) {
            console.error("Error fetching vendors:", error);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchVendors();
    }, [fetchPurchases]);

    // De-bounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleOpenModal = () => {
        setSelectedPurchase(null);
        setIsPOModalOpen('add');
    };

    // No longer need manual item handlers, Formik will handle them

    const calculateGrandTotal = () => {
        return poItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)), 0);
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        setIsSubmitting(true);
        try {
            const url = selectedPurchase ? `/api/purchases/${selectedPurchase.id}` : "/api/purchases";
            const method = selectedPurchase ? "PATCH" : "POST";

            const payload = {
                vendorId: values.vendorId,
                purchaseDate: values.purchaseDate.toISOString(),
                items: values.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                }))
            };

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
                setIsPOModalOpen('');
                fetchPurchases();
                showToast("success", `Purchase ${selectedPurchase ? "updated" : "created"} successfully`);
            } else {
                const data = await response.json();
                showToast("error", data.error || `Failed to ${selectedPurchase ? "update" : "create"} PO`);
            }
        } catch (error) {
            console.error("Error processing PO:", error);
            showToast("error", "An error occurred while processing your request");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleEdit = (purchase) => {
        setSelectedPurchase(purchase);
        setIsPOModalOpen('edit');
    }

    const handleDelete = (purchase) => {
        setSelectedPurchase(purchase);
        setIsConfirmOpen(true);
    };


    const confirmDelete = async () => {
        if (!selectedPurchase) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/purchases/${selectedPurchase.id}`, { method: "DELETE" });
            const data = await res.json();

            if (data.code === 401) {
                clearCurrentUser()
                router.push("/");
                return;
            }

            if (res.ok) {
                showToast("success", "Purchase deleted successfully");
                setIsConfirmOpen(false);
                await fetchPurchases();
            } else {
                const data = await res.json();
                showToast("error", data.error || "Failed to delete purchase");
            }
        } catch (error) {
            showToast("error", "Error deleting purchase");
        } finally {
            setIsDeleting(false);
        }
    };

    const updatePOStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/purchases/${id}/status`, {
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
                fetchPurchases();
            } else {
                const data = await response.json();
                showToast("error", data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("error", "Error updating status");
        }
    };

    const handleViewHistory = (purchase) => {
        setSelectedPurchase(purchase);
        setIsHistoryModalOpen(true);
    };


    const columns = [
        // {
        //     key: "id",
        //     label: "PO Number",
        //     render: (id) => (
        //         <div className="flex flex-col">

        //             <span className="text-[11px] text-gray-400 font-medium">Ref: {id}</span>
        //         </div>
        //     ),
        //     sortable: true,
        // },
        {
            key: "vendor",
            label: "Vendor",
            render: (vendor) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[var(--color-brand-primary)] font-bold text-xs shrink-0">
                        <span> {vendor.name.charAt(0)}</span>
                    </div>
                    <span className="text-[12px] sm:text-sm text-gray-900 font-semibold">{vendor.name}</span>
                </div>
            ),
        },
        {
            key: "purchaseDate",
            label: "PO Date",
            render: (date) => (
                <div className="flex text-nowrap items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (status) => (
                <Chip status={status} />
            ),
        },
        {
            key: "items",
            label: "Summary",
            render: (items) => (
                <div className="text-[11px] sm:text-[13px] text-gray-600">
                    <span className="font-bold text-gray-900">{items.length}</span> {items.length === 1 ? 'Item' : 'Items'}
                </div>
            ),
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            render: (amount) => (
                <span className="font-bold text-gray-900 text-[12px] sm:text-[14px]">
                    ₹{Number(amount).toFixed(2)}
                </span>
            ),
            sortable: true,
        },

        {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (_, row) => (
                <div className="flex gap-2 justify-end items-center">
                    {console.log(row, "iiii")}
                    <ActionButton icon={History} variant="view" title="Status History" onClick={() => handleViewHistory(row)} />
                    <ActionButton icon={Edit} disabled={row.status === "Completed"} variant="edit" onClick={() => handleEdit(row)} />
                    <ActionButton icon={Trash2} disabled={row.status === "Completed"} variant="delete" onClick={() => handleDelete(row)} />
                    <StatusDropdown
                        purchase={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        updatePOStatus={updatePOStatus}
                    />
                </div>
            ),
        },
    ];

    const handleStatusChange = (status) => {
        setSelectedStatus(status?.value || "")
        setCurrentPage(1)
    }

    // Get products for the selected vendor
    // const vendorProducts = selectedVendor
    //     ? selectedVendor.vendorData.products.map(p => ({
    //         value: p.product.id,
    //         label: p.product.name
    //     }))
    //     : [];

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const confirmExport = async (values, { resetForm }) => {
        setExportLoading(true);
        try {
            const response = await fetch("/api/purchases/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    search,
                    selectedStatus,
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
            resetForm()
            showToast("success", "Purchase records exported successfully");
        } catch (error) {
            console.error("Export error:", error);
            showToast("error", "Failed to export purchase records");
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[var(--table-radius)] border border-[var(--table-border)] flex flex-col shadow-sm">
                <div className="flex flex-col justify-end items-end">
                    <PageTitlePart isStatusFilter={true} statusOptions={statuses}
                        handleStatusChange={handleStatusChange} selectedStatus={selectedStatus}
                        startDate={startDate} datePickerPlaceHolder="PO Date" endDate={endDate}
                        setStartDate={setStartDate} setEndDate={setEndDate} buttonLabel="New PO"
                        placeholder="Search by vendor..." searchInput={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        buttonOnClick={() => handleOpenModal()} isDateRange={true}
                        onDateChange={() => setCurrentPage(1)}
                        onExport={handleExport}
                        isExport={true}
                    />

                </div>
                {/* Date Filter Section */}


                <div className="p-4">
                    <Table
                        columns={columns}
                        data={purchases}
                        loading={loading}
                        pageSize={pageSize}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(page) => setCurrentPage(page)}
                        className="w-full"
                        renderExpandedRow={(sale) => (
                            <div className="p-2 sm:p-4 bg-gray-50/50 rounded-xl my-2 border border-gray-100/50">
                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                                                    <p className="font-black text-gray-900 text-[12px] sm:text-sm">{item.quantity}</p>
                                                </div>
                                                <div className="w-24">
                                                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Subtotal</p>
                                                    <p className="font-black text-[var(--color-brand-primary)] text-[12px] sm:text-sm">
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

            {/* Create PO Modal */}
            <Formik
                initialValues={{
                    vendorId: selectedPurchase?.vendorId || "",
                    purchaseDate: selectedPurchase?.purchaseDate ? new Date(selectedPurchase.purchaseDate) : new Date(),
                    items: selectedPurchase?.items?.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    })) || [{ productId: "", quantity: 1, unitPrice: 0 }]
                }}
                validationSchema={purchaseSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, handleSubmit: formikSubmit }) => {
                    const selectedVendorData = vendors.find(v => v.value === values.vendorId)?.vendorData;
                    const vendorProducts = selectedVendorData
                        ? selectedVendorData.products.map(p => ({
                            value: p.product.id,
                            label: p.product.name,
                            price: p.product.price
                        }))
                        : [];

                    const calculateTotal = () => values.items.reduce((sum, item) => sum + (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 0)), 0);

                    return (
                        <Modal
                            isOpen={isPOModalOpen}
                            onClose={() => setIsPOModalOpen('')}
                            headerLabel={isPOModalOpen === 'edit' ? "Edit Purchase Order" : "Create New Purchase Order"}
                            size="4xl"
                            footer={
                                <div className="flex justify-end gap-3 w-full">
                                    <div className="flex-1 flex items-center justify-start px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-gray-400 uppercase font-black">Estimated Total</span>
                                            <span className="text-xl font-black text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        label="Cancel"
                                        onClick={() => setIsPOModalOpen('')}
                                        disabled={isSubmitting}
                                    />
                                    <Button
                                        variant="primary"
                                        label={isSubmitting ? "Processing..." : (isPOModalOpen === 'edit' ? "Update PO" : "Create PO")}
                                        onClick={formikSubmit}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            }
                        >
                            <Form className="flex flex-col gap-6 p-2">
                                {/* Step 1: Vendor Selection */}
                                <div className="bg-gray-50 p-4 flex flex-col gap-3 rounded-2xl border border-gray-100">
                                    <Select
                                        required
                                        label="Select Vendor"
                                        options={vendors}
                                        value={vendors.find(v => v.value === values.vendorId) || null}
                                        disabled={isPOModalOpen === 'edit'}
                                        onChange={(val) => {
                                            setFieldValue("vendorId", val?.value || "");
                                            setFieldValue("items", [{ productId: "", quantity: 1, unitPrice: 0 }]);
                                        }}
                                        placeholder="Search and select vendor..."
                                        error={touched.vendorId && errors.vendorId}
                                    />
                                    <DatePicker
                                        datePickerClass="bg-white"
                                        label="PO Date"
                                        required
                                        value={values.purchaseDate}
                                        onChange={(date) => setFieldValue("purchaseDate", date)}
                                        error={touched.purchaseDate && errors.purchaseDate}
                                    />
                                </div>
                                {/* Step 2: Dynamic Items */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <ShoppingCart className="w-4 h-4 text-blue-600" /> Order Items
                                        </h3>


                                    </div>

                                    {!values.vendorId ? (
                                        <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-2 opacity-40">
                                            <ShoppingCart className="w-12 h-12 text-gray-300" />
                                            <p className="text-sm font-medium text-gray-500 text-center px-8">Please select a vendor first to add products</p>
                                        </div>
                                    ) : (
                                        <FieldArray name="items">
                                            {({ push, remove }) => (
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto px-1">
                                                    {values.items.map((item, index) => (
                                                        <div key={index} className="flex flex-col md:flex-row items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-blue-100">
                                                            <div className="flex-1 w-full">
                                                                <Select
                                                                    label={index === 0 ? "Product" : ""}
                                                                    options={vendorProducts}
                                                                    value={vendorProducts.find(p => p.value === item.productId)}
                                                                    onChange={(val) => {
                                                                        setFieldValue(`items.${index}.productId`, val?.value || "");
                                                                        // setFieldValue(`items.${index}.unitPrice`, val?.price || 0);
                                                                    }}
                                                                    placeholder="Select Product"
                                                                    error={touched.items?.[index]?.productId && errors.items?.[index]?.productId}
                                                                />
                                                            </div>
                                                            <div className="w-full md:w-32">
                                                                <Input
                                                                    label={index === 0 ? "Selling Price" : ""}
                                                                    type="number"
                                                                    disabled
                                                                    placeholder="0.00"
                                                                    value={vendorProducts.find(p => p.value === item.productId)?.price}
                                                                />
                                                            </div>
                                                            <div className="w-full md:w-32">
                                                                <Input
                                                                    label={index === 0 ? "Price" : ""}
                                                                    type="number"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => setFieldValue(`items.${index}.unitPrice`, e.target.value)}
                                                                    placeholder="0.00"
                                                                    error={touched.items?.[index]?.unitPrice && errors.items?.[index]?.unitPrice}
                                                                />
                                                            </div>

                                                            <div className="w-full md:w-24 flex items-end gap-3">
                                                                <Input
                                                                    label={index === 0 ? "Qty" : ""}
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => setFieldValue(`items.${index}.quantity`, e.target.value)}
                                                                    placeholder="1"
                                                                    error={touched.items?.[index]?.quantity && errors.items?.[index]?.quantity}
                                                                />
                                                                <div className="h-[38px]">
                                                                    <ActionButton icon={Trash2} variant="delete" onClick={() => remove(index)} />
                                                                </div>
                                                            </div>

                                                            {/* <div className="h-[38px] flex items-center justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => remove(index)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                    disabled={values.items.length === 1}
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div> */}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </FieldArray>
                                    )}
                                    <div className="flex items-end justify-end">
                                        <FieldArray name="items">
                                            {({ push, remove }) => (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="small"
                                                        className="!rounded-xl text-[12px] font-bold"
                                                        onClick={() => push({ productId: "", quantity: 1, unitPrice: 0 })}
                                                        startIcon={<Plus className="w-3.5 h-3.5" />}
                                                        label="Add Row"
                                                        disabled={!values.vendorId}
                                                    />
                                                </>
                                            )}
                                        </FieldArray>
                                    </div>
                                </div>
                            </Form>
                        </Modal>
                    );
                }}
            </Formik>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Purchase"
                message="Are you sure you want to delete this purchase? Inventory will be restored."
                confirmLabel="Delete"
                variant="danger"
                isLoading={isDeleting}
            />

            {/* Status History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                headerLabel="Purchase Status Timeline"
                size="md"
            >
                <div className="py-6 overflow-y-auto max-h-[70vh]">
                    {selectedPurchase?.history?.length > 0 ? (
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100 rounded-full" />

                            <div className="space-y-8">
                                {selectedPurchase.history.map((record, index) => (
                                    <div key={index} className="relative flex gap-4 group">
                                        {/* Status Indicator Dot/Icon */}
                                        <div className={`relative z-10 flex items-center justify-center w-6 min-w-6 h-6 rounded-full border-4 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${index === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-200'
                                            }`}>
                                            {index === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        </div>

                                        {/* Content Card */}
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

                                            <div className={`p-4 rounded-2xl border transition-all duration-300 ${index === 0
                                                ? 'bg-gradient-to-br from-white to-blue-50/10 border-blue-100 shadow-md ring-1 ring-blue-50/50'
                                                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                                                }`}>
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
                            <p className="text-sm text-gray-400 max-w-[200px]">This purchase order hasn't had any status updates recorded.</p>
                        </div>
                    )}
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

const StatusDropdown = ({ purchase, openMenuId, setOpenMenuId, updatePOStatus }) => {


    const isOpen = openMenuId === purchase.id;
    const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    // useLayoutEffect runs before paint, preventing the flicker
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
        setOpenMenuId(isOpen ? null : purchase.id);
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
                                    updatePOStatus(purchase.id, status.value);
                                }}
                                className={`w-full cursor-pointer text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${purchase.status === status.value ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-gray-700'
                                    }`}
                            >
                                {status.label}
                                {purchase.status === status.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
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
            initialValues={{ fileName: `purchases_export_${new Date().toISOString().split('T')[0]}`, exportType: "CSV" }}
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
                    headerLabel="Export Purchase Records"
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
                            placeholder="e.g. purchases_q1_2024"
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

