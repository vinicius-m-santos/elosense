import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

import PrivateRoute, {
    ROLE_CLIENT,
    ROLE_PERSONAL,
} from "./utils/Auth/PrivateRoute";
import ClientViewGuard from "./utils/Auth/ClientViewGuard";
import PublicRouteGuard from "./utils/Auth/PublicRouteGuard";
import AdminLayout from "./layout/AdminLayout";
import NoAuthLayout from "./layout/NoAuthLayout";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Logout = lazy(() => import("./pages/Logout"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const RegisterSuccess = lazy(() => import("./pages/RegisterSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PlanSubscription = lazy(() => import("./pages/PlanSubscription"));
const MatchDetail = lazy(() => import("./pages/MatchDetail"));
const DashboardAlt = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));

export default function App() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
                    Carregando...
                </div>
            }
        >
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
        </Suspense>
    );
}