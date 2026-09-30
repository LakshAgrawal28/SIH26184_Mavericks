import { ApiError, getToken } from "@/lib/api";

type AuthRouter = { replace: (href: string) => void };

export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

/** Redirect to login only when the session is invalid; returns true if redirected. */
export function redirectToLoginOnUnauthorized(err: unknown, router: AuthRouter): boolean {
  if (!isUnauthorizedError(err)) return false;
  if (typeof window !== "undefined") {
    localStorage.removeItem("ecdat_token");
  }
  router.replace("/login");
  return true;
}

export function requireSessionToken(router: AuthRouter): boolean {
  if (getToken()) return true;
  router.replace("/login");
  return false;
}
