import React, { createContext, useContext, useEffect, useState } from "react";
import useCartStore from "../store/cartStore";
const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_BACKEND_URL || "";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((s) => s.clearCart);
  // Load session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          console.log("Fetched user data:", data);
          setUser(data);
        }
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error((await res.json()).error || "Login failed");
    }

    // Some backends return the user in the signin response, however the
    // authoritative session user is the `/users/me` endpoint (cookie-based).
    // Fetch `/users/me` to ensure we have the same data the server recognizes.
    await res.json().catch(() => null);
    try {
      const meRes = await fetch(`${API_BASE}/users/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!meRes.ok) throw new Error("Failed to load session");
      const me = await meRes.json();
      setUser(me);
      return me;
    } catch (err) {
      // Fallback: try to parse signin response body for user
      const data = await res.json().catch(() => ({}));
      setUser(data.user || null);
      return data.user || null;
    }
  }

  async function register({ name, email, password }) {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      throw new Error((await res.json()).error || "Registration failed");
    }

    await res.json().catch(() => null);
    try {
      const meRes = await fetch(`${API_BASE}/users/me`, {
        method: "GET",
        credentials: "include",
      });
      if (!meRes.ok) throw new Error("Failed to load session");
      const me = await meRes.json();
      setUser(me);
      return me;
    } catch (err) {
      const data = await res.json().catch(() => ({}));
      setUser(data.user || null);
      return data.user || null;
    }
  }

  async function logout() {
    await fetch(`${API_BASE}/users/logout`, {
      method: "POST",
      credentials: "include",
    });

    clearCart();
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
