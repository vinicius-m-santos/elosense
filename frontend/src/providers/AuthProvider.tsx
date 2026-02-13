import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import Loader from "@/components/ui/loader";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import { getPersistedAuth } from "@/utils/Auth/getPersistedAuth";

type User = {
  id: number;
  uuid?: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  phone?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  createdAt?: string;
  emailNotifications?: boolean;
  appNotifications?: boolean;
  client?: {
    id: number;
    name: string;
  };
  personal?: {
    id: number;
    showPlatformExercises?: boolean;
  };
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  api: AxiosInstance;
  login: (token: string, user: User, refresh_token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/logout", "/anamnese"];

const refreshAccessToken = async (): Promise<{
  token: string;
  user?: User;
  refresh_token?: string;
}> => {
  const refreshToken =
    useAuthStore.getState().refreshToken ??
    localStorage.getItem("refresh_token");
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await axios.post(
    `${import.meta.env.VITE_API_URL}/token/refresh`,
    { refresh_token: refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    }
  );

  const data = res.data ?? {};
  if (!data.token) {
    throw new Error("Refresh response missing token");
  }
  return data;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  accessTokenRef.current = accessToken;

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    useAuthStore.getState().clearAuth();
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }, [navigate]);

  const login = (token: string, userData: User, refresh_token: string) => {
    setAccessToken(token);
    setUser(userData);
    useAuthStore.getState().setAuth(token, refresh_token, userData as AuthUser);
    localStorage.setItem("refresh_token", refresh_token);
    if (userData.roles.includes("ROLE_CLIENT")) {
      navigate("/student");
    } else {
      navigate("/week-summary");
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: import.meta.env.VITE_API_URL });

    instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = accessTokenRef.current;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const message = (error.response?.data?.message ?? error.response?.data?.error ?? "").toString();
        const isTokenError =
          status === 401 ||
          (status === 403 && /jwt|token|unauthorized/i.test(message));

        if (!isTokenError) {
          return Promise.reject(error);
        }

        const isRefreshEndpoint =
          originalRequest?.url?.includes("/token/refresh") ?? false;
        if (isRefreshEndpoint) {
          return Promise.reject(error);
        }

        if (originalRequest._retry === true) {
          logout();
          return Promise.reject(error);
        }

        const refreshToken =
          useAuthStore.getState().refreshToken ??
          localStorage.getItem("refresh_token");
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        try {
          originalRequest._retry = true;
          if (!refreshPromiseRef.current) {
            refreshPromiseRef.current = refreshAccessToken()
              .then((data) => {
                setAccessToken(data.token);
                accessTokenRef.current = data.token;
                if (data.user != null) setUser(data.user);
                if (data.refresh_token != null) {
                  localStorage.setItem("refresh_token", data.refresh_token);
                }
                useAuthStore.getState().updateAuth(
                  data.token,
                  data.refresh_token ?? undefined,
                  data.user ?? undefined
                );
                return data.token;
              })
              .finally(() => {
                refreshPromiseRef.current = null;
              });
          }

          const newToken = await refreshPromiseRef.current;
          accessTokenRef.current = newToken;
          const retryConfig = {
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          return instance(retryConfig);
        } catch {
          logout();
          return Promise.reject(error);
        }
      }
    );

    return instance;
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const persisted = getPersistedAuth();
      const hasToken = !!(
        persisted?.accessToken ||
        persisted?.refreshToken ||
        localStorage.getItem("refresh_token")
      );
      const hasUserWithRoles =
        persisted?.user?.roles &&
        Array.isArray(persisted.user.roles) &&
        persisted.user.roles.length > 0;

      if (hasToken && hasUserWithRoles && persisted?.user) {
        setAccessToken(persisted.accessToken ?? null);
        setUser(persisted.user as User);
        setLoading(false);
        return;
      }

      const refreshToken =
        persisted?.refreshToken ?? localStorage.getItem("refresh_token");

      if (!refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await refreshAccessToken();
        setAccessToken(data.token);
        if (data.user != null) setUser(data.user);
        if (data.refresh_token != null) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        useAuthStore.getState().updateAuth(
          data.token,
          data.refresh_token ?? refreshToken,
          (data.user ?? useAuthStore.getState().user) ?? undefined
        );
      } catch {
        const currentPath = window.location.pathname;
        if (!PUBLIC_PATHS.includes(currentPath)) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  if (loading) {
    return <Loader loading={loading} />;
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        api,
        login,
        logout,
        updateUser,
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
