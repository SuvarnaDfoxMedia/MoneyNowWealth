import axios from "axios";

const backendUrl =
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";

export const refreshAuthUser = async () => {
  try {
    const res = await axios.get(`${backendUrl}/admin/profile/me`, {
      withCredentials: true,
    });
    const data = res.data?.data ?? res.data?.user ?? res.data;
    return {
      ...data,
      firstname: data.firstname || "",
      lastname: data.lastname || "",
      phone: data.phone || "",
      address: data.address || "",
      profileImage: data.profileImage || null,
    };
  } catch {
    throw new Error("Refresh failed");
  }
};

export const logoutAuth = async () => {
  try {
    await axios.post(`${backendUrl}/auth/admin/logout`, {}, { withCredentials: true });
  } catch {
    // Best-effort logout for expired sessions.
  }
};
