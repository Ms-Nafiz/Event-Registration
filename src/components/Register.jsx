// src/components/Register.jsx

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const { register, authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(name, email, password, passwordConfirmation);
      // রেজিস্ট্রেশন সফল হলে ভেরিফাই পেজে পাঠান
      navigate("/verify-email");
      toast.success(
        "🎉 রেজিস্ট্রেশন সফল! অনুগ্রহ করে আপনার ইমেইল ভেরিফাই করুন।",
        { className: "font-bangla" }
      );
    } catch (error) {
      if (error.response && error.response.status === 422) {
        // ভ্যালিডেশন ত্রুটি
        const errors = error.response.data.errors;
        toast.error(Object.values(errors)[0][0] || "ফর্মের ডেটা ভুল আছে।", {
          className: "font-bangla",
        });
      } else {
        toast.error("❌ রেজিস্ট্রেশনে ত্রুটি হয়েছে।", {
          className: "font-bangla",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-bangla">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center border-b pb-4">
          অ্যাডমিন রেজিস্ট্রেশন
        </h2>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              নাম
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড নিশ্চিত করুন
            </label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            // --- বাটন আপডেট ---
            disabled={authLoading}
            className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none cursor-pointer ${
              authLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {authLoading ? "রেজিস্টার করা হচ্ছে..." : "রেজিস্টার"}
          </button>
        </form>

        <div className="text-sm text-center pt-4 border-t mt-4">
          <Link
            to="/admin/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
