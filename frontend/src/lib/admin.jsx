import { createContext, useCallback, useContext, useState } from "react";
import { adminUrl } from "./api.js";

const AdminCtx = createContext(null);
const KEY = "noorly:admintoken";

export function AdminProvider({ children }) {
  const [token, setToken] = useState(() => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } });

  const login = useCallback(async (password) => {
    const res = await fetch(adminUrl("/api/admin/login"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.token) throw new Error(j.error || "Login failed");
    setToken(j.token);
    try { localStorage.setItem(KEY, j.token); } catch {}
    return true;
  }, []);

  const logout = useCallback(() => {
    setToken("");
    try { localStorage.removeItem(KEY); } catch {}
  }, []);

  // Trigger a browser download of a whitelisted remote file via the gated proxy.
  const download = useCallback((url, name) => {
    if (!token || !url) return;
    const href = adminUrl(`/api/admin/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&token=${encodeURIComponent(token)}`);
    const a = document.createElement("a");
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }, [token]);

  return (
    <AdminCtx.Provider value={{ admin: !!token, token, login, logout, download }}>
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdmin() { return useContext(AdminCtx); }
