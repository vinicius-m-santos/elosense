import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import PrivateRoute, {
    ROLE_CLIENT,
    ROLE_PERSONAL,
} from "./utils/Auth/PrivateRoute";
import ClientViewGuard from "./utils/Auth/ClientViewGuard";
import PublicRouteGuard from "./utils/Auth/PublicRouteGuard";
import AdminLayout from "./layout/AdminLayout";
import Home from "./pages/Home";
import NoAuthLayout from "./layout/NoAuthLayout";
import EmailVerification from "./pages/EmailVerification";
import RegisterSuccess from "./pages/RegisterSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PlanSubscription from "./pages/PlanSubscription";
import MatchDetail from "./pages/MatchDetail";
import DashboardAlt from "./pages/Dashboard";
import Profile from "./pages/Profile";

export default function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <Home />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/match/:matchId"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <MatchDetail />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <DashboardAlt />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/login"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <Login />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/register"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <Register />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/register-success"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <RegisterSuccess />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/verify-email/:token"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <EmailVerification />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/email-not-verified"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <EmailVerification />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/forgot-password"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <ForgotPassword />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/reset-password/:token"
                element={
                    <NoAuthLayout>
                        <PublicRouteGuard>
                            <ResetPassword />
                        </PublicRouteGuard>
                    </NoAuthLayout>
                }
            />
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <NoAuthLayout>
                            <Profile />
                        </NoAuthLayout>
                    </PrivateRoute>
                }
            />
            <Route
                path="/plan"
                element={
                    <PrivateRoute allowedRoles={[ROLE_PERSONAL]}>
                        <AdminLayout>
                            <PlanSubscription />
                        </AdminLayout>
                    </PrivateRoute>
                }
            />
            <Route path="/logout" element={<Logout />} />
        </Routes>
    );
}
