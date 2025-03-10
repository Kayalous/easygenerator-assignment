import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: Date;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials extends SignInCredentials {
  name: string;
}

const STORAGE_KEY = {
  TOKEN: "token",
  USER: "user",
} as const;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getStoredUser = (): User | null => {
  const userJson = localStorage.getItem(STORAGE_KEY.USER);
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    // Convert stored ISO date string back to Date object
    return { ...user, createdAt: new Date(user.createdAt) };
  } catch {
    localStorage.removeItem(STORAGE_KEY.USER);
    return null;
  }
};

export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = localStorage.getItem(STORAGE_KEY.TOKEN);
      if (!token) return null;

      try {
        const { data } = await api.get("/auth/profile");
        const userData = data.data as User;
        // Always update stored user data with fresh data from server
        localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(userData));
        return userData;
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("Profile fetch error:", error.response?.data);
        }
        localStorage.removeItem(STORAGE_KEY.TOKEN);
        localStorage.removeItem(STORAGE_KEY.USER);
        return null;
      }
    },
    initialData: getStoredUser,
    // Always fetch on mount to ensure data freshness
    staleTime: 0,
    // Retry failed requests
    retry: 2,
    // Keep showing stale data while revalidating
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // Don't reset error state on window focus
    retryOnMount: true,
  });

  const signInMutation = useMutation<AuthResponse, Error, SignInCredentials>({
    mutationFn: async (credentials) => {
      const { data } = await api.post("/auth/signin", credentials);
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem(STORAGE_KEY.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(data.user));
      queryClient.setQueryData(["user"], data.user);
      toast.success("Successfully signed in!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign in");
    },
  });

  const signUpMutation = useMutation<AuthResponse, Error, SignUpCredentials>({
    mutationFn: async (credentials) => {
      // First, sign up
      await api.post("/auth/signup", credentials);

      // Then, automatically sign in
      const { data } = await api.post("/auth/signin", {
        email: credentials.email,
        password: credentials.password,
      });
      return data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem(STORAGE_KEY.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY.USER, JSON.stringify(data.user));
      queryClient.setQueryData(["user"], data.user);
      toast.success("Successfully signed up and logged in!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sign up");
    },
  });

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY.TOKEN);
    localStorage.removeItem(STORAGE_KEY.USER);
    queryClient.setQueryData(["user"], null);
    queryClient.clear();
    toast.success("Successfully logged out");
    navigate("/signin");
  };

  return {
    user,
    isLoadingUser,
    signIn: signInMutation.mutate,
    isSigningIn: signInMutation.isPending,
    signUp: signUpMutation.mutate,
    isSigningUp: signUpMutation.isPending,
    signOut,
  };
};
