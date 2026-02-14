import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
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
  client?: { id: number; name: string };
  personal?: { id: number; showPlatformExercises?: boolean };
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (
    accessToken: string,
    refreshToken: string,
    user: AuthUser
  ) => void;
  updateAuth: (
    accessToken?: string,
    refreshToken?: string,
    user?: AuthUser | null
  ) => void;
  clearAuth: () => void;
  hasStoredToken: () => boolean;
  getRoleHome: () => string;
};

export function getRoleHome(user: AuthUser | null): string {
  if (!user?.roles?.length) return "/login";
  return "/";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth(accessToken, refreshToken, user) {
        set({ accessToken, refreshToken, user });
      },

      updateAuth(accessToken, refreshToken, user) {
        set((state) => ({
          ...(accessToken != null && { accessToken }),
          ...(refreshToken != null && { refreshToken }),
          ...(user !== undefined && { user }),
        }));
      },

      clearAuth() {
        set({ accessToken: null, refreshToken: null, user: null });
      },

      hasStoredToken() {
        const { accessToken, refreshToken } = get();
        return !!(accessToken || refreshToken);
      },

      getRoleHome() {
        return getRoleHome(get().user);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
