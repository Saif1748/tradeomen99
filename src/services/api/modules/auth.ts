import { request } from "../core";
import { UserProfile } from "../types";

export const authApi = {
  // Fetches decoded user profile and SaaS claims (Calls GET /api/v1/auth/me)
  getMe: () => request<UserProfile>("/auth/me"),

  // Updates user settings or preferences (Calls PATCH /api/v1/auth/profile)
  updateProfile: (data: Partial<UserProfile>) =>
    request<UserProfile>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};