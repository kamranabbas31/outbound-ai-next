"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "@/store/authSlice";
import { RootState } from "@/store/store";
import { useLoginMutation, useRegisterMutation } from "@/generated/graphql";

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (
    email: string,
    username: string,
    password: string
  ) => Promise<boolean>;
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

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();

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
      const { data, errors } = await loginMutation({
        variables: {
          data: {
            username,
            password,
          },
        },
      });

      if (errors || !data?.login?.accessToken) throw new Error("Login failed");

      // Save accessToken to secure cookie/localStorage if needed
      // Example:
      localStorage.setItem("accessToken", data.login.accessToken);

      // Optionally decode token to get user info or use another query
      dispatch(setUser({ id: data.login.user.id, username }));

      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const signup = async (
    email: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const { data, errors } = await registerMutation({
        variables: {
          data: {
            email,
            username,
            password,
          },
        },
      });

      if (errors || !data?.register?.user) throw new Error("Signup failed");

      const { id, username: uname } = data.register.user;
      dispatch(setUser({ id, username: uname }));

      return true;
    } catch (err) {
      console.error("Signup error:", err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
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
