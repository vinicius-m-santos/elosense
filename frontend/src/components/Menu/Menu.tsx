import { useAuth } from "@/providers/AuthProvider";
import ClientMenu from "./ClientMenu";

const Menu = () => {
    const { user } = useAuth();

    if (user?.roles.includes("ROLE_CLIENT")) {
        return <ClientMenu />;
    }

    return null;
};

export default Menu;
