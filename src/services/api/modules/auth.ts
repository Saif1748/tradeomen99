import { request } from "../core";
import { UserProfile } from "../types";

export interface UpdateProfileData {
  full_name?: string;
  preferences?: Record<string, any>;
  email?: string;
}

export const authApi = {
  /**
   * Fetches decoded user profile and SaaS claims
   * Calls GET /api/v1/auth/me
   */
  getMe: () => request<UserProfile>("/auth/me"),

  /**
   * Updates user settings or preferences
   * Calls PATCH /api/v1/auth/me
   */
  updateProfile: (data: UpdateProfileData | Partial<UserProfile>) =>
    request<UserProfile>("/auth/me", {
      method: "PATCH", // ✅ Must be PATCH to match @router.patch("/me") in Python
      body: JSON.stringify(data),
    }),
};