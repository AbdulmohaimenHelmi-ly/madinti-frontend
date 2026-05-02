import { create } from "zustand";
import type { User } from "../types";
import { authApi } from "../api/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  impersonator: { token: string; user: User } | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    role?: "customer" | "vendor";
  }) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => void;
  startImpersonation: (token: string, user: User) => void;
  stopImpersonation: () => void;
}

const IMPERSONATOR_KEY = "impersonator";

function readImpersonator(): AuthState["impersonator"] {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IMPERSONATOR_KEY);
    return raw ? (JSON.parse(raw) as { token: string; user: User }) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
  impersonator: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("auth_token", token);
      } else {
        localStorage.removeItem("auth_token");
      }
    }
    set({ token });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password });
      const { user, token } = response.data.data;
      get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register(data);
      const { user, token } = response.data.data;
      get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const response = await authApi.googleLogin(idToken);
      const { user, token } = response.data.data;
      get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      get().setToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(IMPERSONATOR_KEY);
      }
      set({
        user: null,
        isAuthenticated: false,
        impersonator: null,
        isInitialized: true,
      });
    }
  },

  fetchUser: async () => {
    try {
      const response = await authApi.getMe();
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      get().setToken(null);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  initialize: () => {
    if (typeof window === "undefined") return;
    if (get().isInitialized) return;

    const token = localStorage.getItem("auth_token");
    const impersonator = readImpersonator();

    if (token) {
      // Optimistically mark as authenticated so the UI does not flicker.
      set({ token, isAuthenticated: true, isLoading: true, impersonator });
      get().fetchUser();
    } else {
      set({ isInitialized: true, impersonator: null });
    }
  },

  startImpersonation: (token, user) => {
    if (typeof window === "undefined") return;
    const current = get();
    if (!current.token || !current.user) return;

    // Save the admin session as "impersonator" so we can return later.
    const imp = { token: current.token, user: current.user };
    localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(imp));
    localStorage.setItem("auth_token", token);

    set({
      token,
      user,
      isAuthenticated: true,
      impersonator: imp,
      isInitialized: true,
    });
  },

  stopImpersonation: () => {
    if (typeof window === "undefined") return;
    const { impersonator } = get();
    if (!impersonator) return;

    localStorage.setItem("auth_token", impersonator.token);
    localStorage.removeItem(IMPERSONATOR_KEY);

    set({
      token: impersonator.token,
      user: impersonator.user,
      isAuthenticated: true,
      impersonator: null,
      isInitialized: true,
    });
  },
}));
