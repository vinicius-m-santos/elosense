import type { AuthUser } from "@/stores/authStore";

const AUTH_STORAGE_KEY = "auth-storage";

export type PersistedAuth = {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: AuthUser | null;
} | null;

export function getPersistedAuth(): PersistedAuth {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state) return null;
    return state;
  } catch {
    return null;
  }
}
