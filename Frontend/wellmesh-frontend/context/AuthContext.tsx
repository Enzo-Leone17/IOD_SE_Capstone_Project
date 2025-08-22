// context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import api from "@/lib/axios";
import FullPageLoader from "@/components/FullPageLoader";

type User = {
  id: number;
  role: string;
  email: string;
  username: string;
  image_url: string;
  phone: string;
  is_verified: boolean;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  loading: boolean;
  setLoading: (state: boolean) => void;
  setUser: (user: User | null) => void;
};

let externalSetLoading: ((state: boolean) => void) | null = null;
export const authLoadingHandler = (state: boolean) => {
  if (externalSetLoading) externalSetLoading(state);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  externalSetLoading = setLoading;

  useEffect(() => {
    const savedUser = Cookies.get("user");
    const savedAccess = Cookies.get("accessToken");
    const savedRefresh = Cookies.get("refreshToken");

    if (savedUser && savedAccess && savedRefresh) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setAccessToken(savedAccess);
        setRefreshToken(savedRefresh);
      } catch (err) {
        console.error("❌ Invalid user cookie, clearing:", savedUser);
        Cookies.remove("user");
        if (err instanceof Error) console.error(err.message);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const newUser = res.data.user || null;
      if(!res){
        throw new Error("Unable to login");
      }

      setUser(newUser);
      setAccessToken(res.data.accessToken || null);
      setRefreshToken(res.data.refreshToken || null);

      // ✅ Only save valid data into cookies
      if (newUser) Cookies.set("user", JSON.stringify(newUser), { expires: 1 });
      if (res.data.accessToken) {
        Cookies.set("accessToken", res.data.accessToken, { expires: 1 });
      }
      if (res.data.refreshToken) {
        Cookies.set("refreshToken", res.data.refreshToken, { expires: 1 });
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      }
    }
  };

  const logout = async () => {
    try {
      const refresh = Cookies.get("refreshToken");
      const res = await api.post("/auth/logout", { refreshToken: refresh });
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);

      Cookies.remove("user");
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      if (!res) throw new Error("Unable to logout, reseting");
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refresh = Cookies.get("refreshToken");
      if (!refresh) return false;

      const res = await api.post(
        "/auth/token/refresh",
        { refreshToken: refresh },
        { headers: { Authorization: `Bearer ${Cookies.get("accessToken")}` } }
      );

      const newUser = res.data.user || null;
      setUser(newUser);
      setAccessToken(res.data.accessToken || null);
      setRefreshToken(res.data.refreshToken || null);

      // ✅ Only save valid data into cookies
      if (newUser) Cookies.set("user", JSON.stringify(newUser), { expires: 1 });
      if (res.data.accessToken)
        Cookies.set("accessToken", res.data.accessToken, { expires: 1 });
      if (res.data.refreshToken)
        Cookies.set("refreshToken", res.data.refreshToken, { expires: 1 });

      return true;
    } catch (err) {
      console.error("❌ Failed to refresh token:", err);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        refreshTokens,
        loading,
        setLoading,
        setUser,
      }}
    >
      {loading && <FullPageLoader />}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
