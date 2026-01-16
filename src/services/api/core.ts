import { supabase } from "@/integrations/supabase/client";

// ✅ 1. Define or Import UserProfile (Ensure this matches your backend response)
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
  // Legacy fields that might come from backend
  plan_id?: string;
  active_plan_id?: string;
  full_name?: string;
}

/**
 * API Error Class
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

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Universal Request Wrapper
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
 * ✅ ROBUST PROFILE FETCHER
 * Normalizes backend data (plan_id -> plan_tier) and parses preferences safely.
 */
export async function fetchBackendProfile(): Promise<UserProfile> {
  // 1. Fetch raw data (typed as any so we can inspect loose fields)
  const data = await request<any>("/auth/me");

  // 2. Normalize Plan Tier
  // Checks all possible field names for the plan
  const rawPlan = (
    data.plan_tier || 
    data.active_plan_id || 
    data.plan_id || 
    "FREE"
  ).toUpperCase();
  
  let finalPlan: "FREE" | "PRO" | "PREMIUM" = "FREE";

  // Map backend values to frontend constants
  if (rawPlan.includes("PREMIUM") || rawPlan === "FOUNDER" || rawPlan === "LIFETIME") {
    finalPlan = "PREMIUM";
  } else if (rawPlan.includes("PRO")) {
    finalPlan = "PRO";
  }

  // 3. Normalize Preferences
  // Handles case where DB stores JSON as a string instead of JSONB
  let parsedPreferences = {};
  try {
    if (typeof data.preferences === 'string') {
      parsedPreferences = JSON.parse(data.preferences);
    } else {
      parsedPreferences = data.preferences || {};
    }
  } catch (e) {
    console.warn("Failed to parse user preferences", e);
    parsedPreferences = {}; 
  }

  // 4. Return Clean Object
  return {
    ...data,
    id: data.id || data.user_id, // Ensure ID is accessible
    plan_tier: finalPlan,        // ✅ Forced correct plan
    preferences: parsedPreferences,
  };
}