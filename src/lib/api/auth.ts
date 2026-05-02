import apiClient from "./client";
import type {
  ApiResponse,
  User,
  LoginCredentials,
  RegisterData,
} from "../types";

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>(
      "/auth/login",
      credentials
    ),

  register: (data: RegisterData) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>(
      "/auth/register",
      data
    ),

  logout: () => apiClient.post<ApiResponse<null>>("/auth/logout"),

  getMe: () => apiClient.get<ApiResponse<User>>("/auth/me"),

  googleLogin: (idToken: string) =>
    apiClient.post<ApiResponse<{ user: User; token: string }>>("/auth/google", {
      id_token: idToken,
    }),
};
