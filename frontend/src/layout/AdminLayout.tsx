import Menu from "@/components/Menu/Menu";

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-100">
            <Menu />
            {children}
        </div>
    );
}
