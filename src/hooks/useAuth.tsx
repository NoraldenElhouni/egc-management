import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services/authService";
import { UserData } from "../lib/userStorage";

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

        // Optional: Verify session in background
        authService
          .refreshUserData()
          .then((refreshedUser) => {
            if (refreshedUser) {
              setUser(refreshedUser);
            }
          })
          .catch(() => {
            // Session invalid, clear everything
            setUser(null);
            authService.logout();
          });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const userData = await authService.login(email, password);
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await authService.refreshUserData();
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
