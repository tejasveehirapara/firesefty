export default function UnauthorizedPage() {
    return (
        <div className="h-screen flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold">401 – Unauthorized</h1>
            <p className="text-gray-500 mt-2">
                You don’t have permission to view this page.
            </p>
        </div>
    );
}