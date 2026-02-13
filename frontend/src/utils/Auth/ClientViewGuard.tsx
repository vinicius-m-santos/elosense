import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

const ROLE_PERSONAL = "ROLE_PERSONAL";
const ROLE_CLIENT = "ROLE_CLIENT";

/**
 * Permite ROLE_PERSONAL acessar qualquer /client-view/:id.
 * Permite ROLE_CLIENT acessar apenas /client-view/:id quando :id é o próprio client.id.
 */
const ClientViewGuard = ({ children }: { children: React.ReactNode }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();

    if (!user?.roles) {
        return <Navigate to="/login" replace />;
    }

    if (user.roles.includes(ROLE_PERSONAL)) {
        return <>{children}</>;
    }

    if (user.roles.includes(ROLE_CLIENT)) {
        const ownClientId = user.client?.id != null ? String(user.client.id) : null;
        if (ownClientId && id === ownClientId) {
            return <>{children}</>;
        }
        return <Navigate to="/student" replace />;
    }

    return <Navigate to="/login" replace />;
};

export default ClientViewGuard;
