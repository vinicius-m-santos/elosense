import { useState } from "react";
import { Link } from "react-router-dom";

export default function Dropdown({ label, buttonStyle, links }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center hover:text-gray-300 cursor-pointer ${buttonStyle}`}
      >
        {label}
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <ul className="absolute z-2 left-0 mt-2 w-44 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
          {links &&
            links.map((link) => (
              <li key={link.url}>
                <Link
                  to={link.url}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}