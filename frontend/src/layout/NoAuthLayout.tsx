import CleanNoAuthMenu from "@/components/Menu/CleanNoAuthMenu";
import React from "react";

export default function NoAuthLayout({ children, ...props }) {
    return (
        <div className="min-h-screen bg-gray-100 text-gray-100">
            {/* <CleanNoAuthMenu /> */}
            {React.isValidElement(children)
                ? React.cloneElement(children, { ...props })
                : children}
        </div>
    );
}
