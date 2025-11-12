// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false); // <-- এটি login/register/logout এর জন্য

  useEffect(() => {
    // অ্যাপ লোড হলে ইউজার তথ্য আনার চেষ্টা
    api
      .get("/api/user")
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const getCsrfToken = async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
    } catch (error) {
      console.error("CSRF Token fetch failed:", error); // দেখুন এখানে কোনো এরর আসে কিনা
    }
  };

  const login = async (email, password) => {
    setAuthLoading(true); // <-- লোডার চালু
    try {
      await getCsrfToken();
      await api.post("/api/login", { email, password });
      const response = await api.get("/api/user");
      setUser(response.data);
    } catch (error) {
      throw error; // ত্রুটিটি কম্পোনেন্টে ফেরত পাঠান
    } finally {
      setAuthLoading(false); // <-- লোডার বন্ধ
    }
  };

  const register = async (name, email, password, password_confirmation) => {
    setAuthLoading(true); // <-- লোডার চালু
    try {
      await getCsrfToken();
      await api.post("/register", {
        name,
        email,
        password,
        password_confirmation,
      });
      const response = await api.get("/api/user");
      setUser(response.data);
    } catch (error) {
      throw error; // ত্রুটিটি কম্পোনেন্টে ফেরত পাঠান
    } finally {
      setAuthLoading(false); // <-- লোডার বন্ধ
    }
  };

  const logout = async () => {
    setAuthLoading(true); // <-- লোডার চালু
    try {
      await api.post("/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthLoading(false); // <-- লোডার বন্ধ
    }
  };

  // --- নতুন ফাংশন ---
  // ভেরিফিকেশন ইমেইল আবার পাঠানোর জন্য
  const resendVerificationEmail = async () => {
    try {
      await api.post("/email/verification-notification");
      toast.success("📬 নতুন ভেরিফিকেশন লিংক পাঠানো হয়েছে!", {
        className: "font-bangla",
      });
    } catch (error) {
      toast.error("❌ লিংক পাঠাতে সমস্যা হয়েছে।", { className: "font-bangla" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading, // প্রাথমিক লোডিং
        authLoading, // নতুন অ্যাকশন লোডিং
        resendVerificationEmail,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
