import { useEffect, useRef, useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";

export default function UserDropdown() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative inline-block text-left">
            {/* Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`cursor-pointer inline-flex justify-between items-center p-2 text-white text-sm font-medium rounded-full focus:outline-none ${
                    open ? "bg-gray-300" : ""
                }`}
            >
                <UserCircleIcon className="w-5 h-5 text-black hover:text-gray-700" />
            </button>

            {/* Menu */}
            {open && (
                <div className="absolute z-2 right-0 mt-2 w-40 bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg">
                    <ul className="py-1 text-sm text-gray-700">
                    <li>
                        <Link to="/profile" 
                                className="w-full flex text-left px-4 py-2 hover:bg-gray-100">
                                <User size={16} className="mr-2" /> Profile
                        </Link>
                    </li>
            {/* <li>
              <button className="default w-full text-left px-4 py-2 hover:bg-gray-100">
                Settings
              </button>
            </li> */}
                        <li>
                            <Link
                                to="/logout"
                                className="w-full flex text-left px-4 py-2 hover:bg-gray-100"
                            >
                                <LogOut size={16} className="mr-2" />
                                Sair
                            </Link>
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}
