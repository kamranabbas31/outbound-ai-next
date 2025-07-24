"use client";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "@/store/authSlice";
import { RootState } from "@/store/store";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();

  const reduxUser = useSelector((state: RootState) => state.auth.user);
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (reduxUser) {
      setUserState(reduxUser);
      setIsAuthenticated(true);
    } else {
      setUserState(null);
      setIsAuthenticated(false);
    }
  }, [reduxUser]);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("login", {
        body: { username, password },
      });
      console.log({ data });
      if (error) throw new Error(error.message);

      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const user = parsed.user;
      dispatch(setUser({ id: user.id, username: user.username }));
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const signup = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke("signup", {
        body: JSON.stringify({ username, password }),
      });

      if (error) throw new Error(error.message);
      return true;
    } catch (err) {
      console.error("Signup error:", err);
      return false;
    }
  };

  const logout = () => {
    dispatch(clearUser());
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
