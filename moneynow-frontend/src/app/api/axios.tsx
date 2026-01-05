import axios from "axios";

/* Main backend API */
export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/* Calculator API */
export const CALC_API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CALC_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});
