import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { authService } from "../services/authService";
import { UserData } from "../lib/userStorage";

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  first_login: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on app start - RUNS ONCE
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);

      // Try local storage first (FAST - 10-50ms)
      const localUser = await authService.getCurrentUser();

      if (localUser) {
        setUser(localUser);
        setLoading(false);

        // Verify session in background — but don't wipe user on network errors
        authService
          .refreshUserData()
          .then((refreshedUser) => {
            if (refreshedUser) {
              // Got fresh data — update the user
              setUser(refreshedUser);
            } else {
              // refreshUserData returned null — session is truly gone, safe to logout
              setUser(null);
              authService.logout();
            }
          })
          .catch((err) => {
            // Network error, timeout, or Supabase hiccup — keep the local session
            // Do NOT clear the user here; they are still logged in locally
            console.warn(
              "Background refresh failed, keeping local session:",
              err,
            );
          });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    const userData = await authService.refreshUserData();
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        first_login: user?.first_login || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
