import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "./types";

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

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
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
  const data = await request<any>("/auth/me");

  // 1. Identify the Plan (Checking plan_tier, active_plan_id, and plan_id)
  const rawPlan = (data.plan_tier || data.active_plan_id || data.plan_id || "FREE").toUpperCase();
  
  let finalPlan = rawPlan;
  // Handle legacy/alternate names if they exist in DB
  if (rawPlan === "FOUNDER" || rawPlan === "LIFETIME") {
    finalPlan = "PREMIUM";
  }

  // 2. Parse Preferences safely
  let parsedPreferences = {};
  try {
    if (typeof data.preferences === 'string') {
      parsedPreferences = JSON.parse(data.preferences);
    } else {
      parsedPreferences = data.preferences || {};
    }
  } catch (e) {
    // If parsing fails, default to empty object so app doesn't crash
    parsedPreferences = {}; 
  }

  return {
    ...data,
    id: data.id || data.user_id,
    plan_tier: finalPlan, 
    preferences: parsedPreferences,
  };
}