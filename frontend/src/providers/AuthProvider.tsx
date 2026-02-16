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
import { useAuthStore, getRoleHome, type AuthUser } from "@/stores/authStore";
import { getPersistedAuth } from "@/utils/Auth/getPersistedAuth";
import { isAccessTokenValid } from "@/utils/Auth/jwtUtils";

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
  login: (token: string, user: User, refresh_token: string, options?: { redirectTo?: string }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  /** true enquanto valida sessão (refresh em andamento) no boot */
  isValidating: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/login", "/logout", "/anamnese"];

const refreshAccessToken = async (): Promise<{
  token: string;
  user?: User;
  refresh_token?: string;
}> => {
  const refreshToken = useAuthStore.getState().refreshToken;
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
  const persisted = getPersistedAuth();
  const storedAccessToken = persisted?.accessToken ?? null;
  const storedRefreshToken =
    persisted?.refreshToken ?? useAuthStore.getState().refreshToken ?? null;
  const hasPersistedUser =
    persisted?.user?.roles &&
    Array.isArray(persisted.user.roles) &&
    persisted.user.roles.length > 0;

  /** Token válido (exp > now + 5min) → usar persistido sem refresh */
  const accessTokenValid = isAccessTokenValid(storedAccessToken);
  /** Precisa refresh: temos refresh_token mas access token expirado ou ausente */
  const needsRefresh =
    storedRefreshToken != null &&
    !accessTokenValid;

  const [accessToken, setAccessToken] = useState<string | null>(
    storedAccessToken
  );
  const [user, setUser] = useState<User | null>(
    hasPersistedUser ? (persisted!.user as User) : null
  );
  /** true até terminar a validação no boot (refresh em andamento); false se não precisa validar */
  const [isValidating, setIsValidating] = useState(needsRefresh);
  const navigate = useNavigate();
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  accessTokenRef.current = accessToken;

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    useAuthStore.getState().clearAuth();
    navigate("/login");
  }, [navigate]);

  const login = useCallback(
    (token: string, userData: User, refresh_token: string, options?: { redirectTo?: string }) => {
      setAccessToken(token);
      setUser(userData);
      useAuthStore.getState().setAuth(token, refresh_token, userData as AuthUser);
      const target = options?.redirectTo ?? getRoleHome(userData as AuthUser);
      navigate(target);
    },
    [navigate]
  );

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    useAuthStore.getState().updateAuth(undefined, undefined, updatedUser as AuthUser);
  }, []);

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

        const refreshToken = useAuthStore.getState().refreshToken;
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
                  useAuthStore.getState().updateAuth(
                    data.token,
                    data.refresh_token,
                    data.user ?? undefined
                  );
                } else {
                  useAuthStore.getState().updateAuth(
                    data.token,
                    undefined,
                    data.user ?? undefined
                  );
                }
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
    const refreshToken =
      getPersistedAuth()?.refreshToken ?? useAuthStore.getState().refreshToken;
    const tokenStillValid = isAccessTokenValid(
      getPersistedAuth()?.accessToken ?? useAuthStore.getState().accessToken
    );
    /** Refresh só quando: F5 com tokens persistidos e access token expirado/ausente */
    if (!refreshToken || tokenStillValid) return;

    let cancelled = false;

    const doRefresh = async () => {
      try {
        const data = await refreshAccessToken();
        if (cancelled) return;
        setAccessToken(data.token);
        if (data.user != null) setUser(data.user);
        useAuthStore.getState().updateAuth(
          data.token,
          data.refresh_token ?? undefined,
          (data.user ?? useAuthStore.getState().user) ?? undefined
        );
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
        useAuthStore.getState().clearAuth();
        const currentPath = window.location.pathname;
        if (!PUBLIC_PATHS.includes(currentPath)) {
          navigate("/login");
        }
      } finally {
        if (!cancelled) setIsValidating(false);
      }
    };

    doRefresh();
    return () => {
      cancelled = true;
    };
  }, [logout, navigate, needsRefresh]);

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
        isValidating,
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
