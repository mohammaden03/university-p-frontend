import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse } from '../types';

// Storage key for short-lived access token in sessionStorage (persists across reload, cleared on tab close)
const TOKEN_KEY = 'htr_auth_access_token';

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Handle sandboxed storage restrictions if any
  }
}

// Base URL resolution: prefers VITE_API_BASE_URL if configured, otherwise falls back to /api/v1
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attaches Bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: formats Persian friendly errors and handles 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('htr:auth:unauthorized'));
    }

    // Extract Persian or human readable error message
    let errorMessage = 'خطای ارتباط با سامانه. لطفاً اتصال سرور و پایگاه داده را بررسی نمایید.';
    if (error.response?.data?.message) {
      const msg = error.response.data.message;
      errorMessage = Array.isArray(msg) ? msg.join(' | ') : msg;
    } else if (error.message === 'Network Error') {
      errorMessage = 'خطای اتصال به سرور NestJS (Network Error). لطفاً از در دسترس بودن بک‌اند اطمینان حاصل کنید.';
    }

    return Promise.reject(new Error(errorMessage));
  }
);
