import { supabase } from "@/integrations/supabase/client";

/**
 * UserProfile Interface
 * Exported to match the Python backend's 'UserResponse' schema.
 */
export interface UserProfile {
  user_id: string;
  email: string;
  role: string;
  plan_tier: "FREE" | "PRO" | "PREMIUM";
  daily_chat_count: number;
  monthly_ai_tokens_used: number;
  monthly_import_count: number;
  preferences: Record<string, any>;
  last_chat_reset_at?: string;
  quota_reset_at?: string;
  created_at?: string;
}


/**
 * API Error Class
 * Standardized error handling for backend responses.
 */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = message;
  }
}


/**
 * Base URL Configuration
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";


/**
 * Universal Request Wrapper
 * Automatically attaches the Supabase JWT to every request.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 1. Retrieve the most current session token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const token = session?.access_token;


  if (sessionError || !token) {
    throw new ApiError("No active session found. Please log in again.", 401);
  }


  const isFormData = options.body instanceof FormData;


  const headers: HeadersInit = {
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {}),
  };


  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }


  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });


    // 2. Handle HTTP Errors (4xx, 5xx)
    if (!response.ok) {
      let message = "API Request Failed";
      try {
        const err = await response.json();
        message = err?.detail || message;
      } catch {
        message = `HTTP Error ${response.status}`;
      }
      throw new ApiError(message, response.status);
    }


    // 3. Handle Empty Success Responses
    if (response.status === 204) {
      return {} as T;
    }


    return await response.json();
  } catch (error) {
    // 4. Handle Network Failures (CORS, DNS, Server Down)
    if (error instanceof ApiError) throw error;
    
    console.error("Network/Fetch Error:", error);
    throw new ApiError("Network connection failed. Check if backend is running.", 503);
  }
}


/**
 * fetchBackendProfile
 * Bootstraps the user session by fetching data from the Python backend.
 */
export async function fetchBackendProfile(): Promise<UserProfile> {
  return request<UserProfile>("/auth/me");
}