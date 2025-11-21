import { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation, Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitles = {
    "/admin/dashboard": "ড্যাশবোর্ড",
    "/admin/users": "ব্যবহারকারী",
    "/admin/scan": "QR স্ক্যানার",
    "/admin/create-entry": "নতুন রেজিস্ট্রেশন",
    "/admin/list": "রেজিস্ট্রেশন তালিকা",
    "/admin/groups": "গ্রুপ ম্যানেজমেন্ট",
    "/admin/profile": "প্রোফাইল",
    "/admin/donate": "ডোনেশন",
    "/admin/bulk-donate": "বাল্ক আপলোড",
    "/admin/donation-list": "ডোনেশন তালিকা",
    "/admin/contribution-summary": "চাঁদা সারাংশ",
  };

  const currentTitle = pageTitles[location.pathname] || "অ্যাডমিন প্যানেল";

  return (
    <div className="flex h-screen bg-slate-50 font-bangla overflow-hidden">
      <Sidebar
        mobileOpen={sidebarOpen}
        setMobileOpen={setSidebarOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 md:px-8 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                {currentTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Right side actions (Notification, etc. can go here) */}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              সিস্টেম সচল
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
