import apiClient from "./client";
import type { ApiResponse, User } from "../types";

export interface UpdateProfilePayload {
  name?: string;
  phone?: string | null;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export const profileApi = {
  get: () => apiClient.get<ApiResponse<User>>("/profile"),
  update: (data: UpdateProfilePayload) =>
    apiClient.put<ApiResponse<User>>("/profile", data),
};
