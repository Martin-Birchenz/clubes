import { createContext, useContext, useState } from "react";
import api from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cd_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { token, user: loggedUser } = data.data;

    localStorage.setItem("cd_token", token);
    localStorage.setItem("cd_user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem("cd_token");
    localStorage.removeItem("cd_user");
    sessionStorage.removeItem("cd_impersonate_tenant_id");
    setUser(null);
  };

  const hasModule = (moduleCode) => {
    if (!user) return false;
    if (["superadmin", "club_admin"].includes(user.roleCode)) return true;
    const modules = user.permissions?.modules || [];
    return modules.includes("all") || modules.includes(moduleCode);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, logout, hasModule }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
