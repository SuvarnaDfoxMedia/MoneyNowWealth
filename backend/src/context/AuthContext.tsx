import {
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { AuthContext, User } from "./authContextCore";
const backendUrl =
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";

const extractUserPayload = (responseData: any) =>
  responseData?.data ?? responseData?.user ?? responseData;

const normalizeUser = (raw: any): User => {
  const role = String(raw?.role || "").trim().toLowerCase();
  const safeRole: User["role"] =
    role === "admin" || role === "editor" || role === "user" ? role : "user";

  return {
    ...raw,
    role: safeRole,
    firstname: raw?.firstname || "",
    lastname: raw?.lastname || "",
    phone: raw?.phone || "",
    address: raw?.address || "",
    profileImage: raw?.profileImage || null,
    countryCode: raw?.countryCode || "",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => setUser(null), []);

  /* ------------------------------ REFRESH USER ------------------------------ */
  const refreshUser = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/admin/profile/me`, {
        withCredentials: true,
      });
      const data = extractUserPayload(res.data);
      setUser(normalizeUser(data));
    } catch {
      try {
        const res = await axios.get(`${backendUrl}/admin/profile/me`, {
          withCredentials: true,
        });
        const data = extractUserPayload(res.data);
        setUser(normalizeUser(data));
      } catch {
        clearAuth();
      }
    }
  }, [clearAuth]);

  /* ------------------------------ LOGIN ------------------------------ */
  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        `${backendUrl}/auth/admin/login`,
        { email, password },
        { withCredentials: true },
      );

      const data = res.data.user;
      if (!data) throw new Error("Invalid credentials");

      setUser(normalizeUser(data));

      // Refresh user data from admin-scoped session endpoint.
      setTimeout(() => {
        refreshUser();
      }, 500);
    } catch (err: unknown) {
      clearAuth();
      const msg =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response?: { data?: { message?: string } } }).response!
              .data!.message!
          : "Invalid email or password";
      throw new Error(msg);
    }
  };

  /* ------------------------------ LOGOUT ------------------------------ */
  const logout = async () => {
    try {
      await axios.post(`${backendUrl}/auth/admin/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }
  };

  /* ------------------------------ INITIAL LOAD ------------------------------ */
  useEffect(() => {
    const init = async () => {
      await refreshUser(); // fetch user on app load
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
