import { jwtDecode } from "jwt-decode";

/** Buffer em segundos: token válido se exp - now > BUFFER */
const VALIDITY_BUFFER_SEC = 300; // 5 minutos

type JwtPayload = { exp?: number };

/**
 * Verifica se o access token JWT ainda é válido (não expirou e tem margem de segurança).
 * Apenas decodifica o payload (sem validar assinatura); o backend valida na API.
 */
export function isAccessTokenValid(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const exp = decoded?.exp;
    if (exp == null || typeof exp !== "number") return false;
    const now = Math.floor(Date.now() / 1000);
    return exp - now > VALIDITY_BUFFER_SEC;
  } catch {
    return false;
  }
}
