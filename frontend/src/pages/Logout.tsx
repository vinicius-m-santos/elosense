import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

const Logout = () => {
    const { logout } = useAuth();

    useEffect(() => {
        logout();
    }, []);

    return <></>;
};

export default Logout;
