import { useEffect, useState } from "react";

export type Role = "scrum" | "developer";
const KEY = "srp_auth";

export interface AuthUser {
  role: Role;
  name: string;
  email: string;
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("srp-auth"));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("srp-auth"));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(() => {
    setUser(getAuth());
    const handler = () => setUser(getAuth());
    window.addEventListener("srp-auth", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("srp-auth", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return user;
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("srp_theme") as "light" | "dark") || "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("srp_theme", theme);
  }, [theme]);
  return { theme, setTheme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) };
}
