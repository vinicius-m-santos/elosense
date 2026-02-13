import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

const ROLE_CLIENT = "ROLE_CLIENT";
const ROLE_PERSONAL = "ROLE_PERSONAL";

type PrivateRouteProps = {
    children: React.ReactNode;
    /** Se definido, apenas usuários com uma dessas roles podem acessar. ROLE_CLIENT é redirecionado para /student, ROLE_PERSONAL para /week-summary. */
    allowedRoles?: string[];
};

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && user?.roles) {
        const hasAllowedRole = allowedRoles.some((role) =>
            user.roles.includes(role)
        );
        if (!hasAllowedRole) {
            const redirectTo = user.roles.includes(ROLE_CLIENT)
                ? "/student"
                : user.roles.includes(ROLE_PERSONAL)
                  ? "/week-summary"
                  : "/login";
            return <Navigate to={redirectTo} replace />;
        }
    }

    return <>{children}</>;
};

export default PrivateRoute;
export { ROLE_CLIENT, ROLE_PERSONAL };
