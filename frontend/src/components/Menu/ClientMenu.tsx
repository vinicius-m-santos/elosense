import { Link } from "react-router-dom";
import UserDropdown from "@/components/Menu/components/UserDropdown";
import logo from "@/assets/fitrise_logo.png";
import { useState } from "react";
import {
    LogOut,
    MenuIcon,
    User,
    X,
    Dumbbell,
    Home,
    Activity,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const ClientMenu = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth();

    return (
        <nav className="bg-gray-100 text-gray-800 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <Link to="/student">
                            <img
                                src={logo}
                                className="w-30 h-10 mt-2 object-contain"
                            />
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:w-full md:flex md:justify-between space-x-2 items-center">
                        <div className="flex">
                            <Link
                                to="/student"
                                className="flex items-center px-4 py-2 text-sm font-bold hover:text-gray-600 rounded-lg transition duration-500"
                            >
                                <Home size={16} className="mr-2" />
                                Início
                            </Link>
                            <Link
                                to="/student/workouts"
                                className="flex items-center px-4 py-2 text-sm font-bold hover:text-gray-600 rounded-lg transition duration-500"
                            >
                                <Dumbbell size={16} className="mr-2" />
                                Meus treinos
                            </Link>
                            <Link
                                to={`/client-view/${user?.client?.id}`}
                                className="flex items-center px-4 py-2 text-sm font-bold hover:text-gray-600 rounded-lg transition duration-500"
                            >
                                <Activity size={16} className="mr-2" />
                                Acompanhamento
                            </Link>
                        </div>
                        <UserDropdown />
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 focus:outline-none"
                        >
                            {mobileMenuOpen ? (
                                <X size={24} />
                            ) : (
                                <MenuIcon size={24} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-4 flex flex-col">
                        <Link
                            to="/student"
                            className="flex items-center px-4 py-2 mb-1 rounded-lg hover:bg-gray-200 transition"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Home size={16} className="mr-2" />
                            Início
                        </Link>
                        <Link
                            to="/student/workouts"
                            className="flex items-center px-4 py-2 mb-1 rounded-lg hover:bg-gray-200 transition"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Dumbbell size={16} className="mr-2" />
                            Meus treinos
                        </Link>
                        <Link
                            to={`/client-view/${user?.client?.id}`}
                            className="flex items-center px-4 py-2 mb-1 rounded-lg hover:bg-gray-200 transition"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Activity size={16} className="mr-2" />
                            Acompanhamento
                        </Link>
                        <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 mb-1 rounded-lg hover:bg-gray-200 transition"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <User size={16} className="mr-2" />
                            Perfil
                        </Link>
                        <Link
                            to="/logout"
                            className="flex items-center px-4 py-2 mb-1 rounded-lg hover:bg-gray-200 transition"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default ClientMenu;
