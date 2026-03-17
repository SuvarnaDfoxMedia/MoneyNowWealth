// src/app/api/axios.ts
import axios from "axios";

// Main backend API
export const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE, // standardized backend base URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if you use cookies for auth
});

// Calculator API (optional, separate base URL)
export const CALC_API = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_CALC_API_BASE || process.env.NEXT_PUBLIC_API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});
