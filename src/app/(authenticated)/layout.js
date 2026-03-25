import AdminLayout from '@/components/layout/AdminLayout';

export default function AuthenticatedLayout({ children }) {
    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
