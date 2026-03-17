import axios from "axios";

const API_URL =
  (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";

// -------------------- LOGIN --------------------
export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  return axios.post(`${API_URL}/admin/login`, credentials, { withCredentials: true });
};

// -------------------- SIGNUP --------------------
export const signup = async (userData: {
  fname: string;
  lname: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}) => {
  if (!userData.termsAccepted) {
    throw new Error("You must accept the terms and conditions");
  }

  return axios.post(`${API_URL}/register`, userData, { withCredentials: true });
};

// -------------------- LOGOUT --------------------
export const logout = async (navigate: (path: string) => void) => {
  try {
    await axios.post(`${API_URL}/admin/logout`, {}, { withCredentials: true });
    localStorage.removeItem("user");
    navigate("/signin");
  } catch {
    // Keep current UX: on failure stay on current page.
  }
};
