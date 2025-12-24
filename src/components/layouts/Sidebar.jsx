import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Fragment } from "react";

<<<<<<< HEAD
const SidebarContent = ({
  collapsed,
  setCollapsed,
  isMobile,
  setMobileOpen,
}) => {
  const { logout, user, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = userData?.role || "user";

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  const allNavItems = [
    {
      name: "ড্যাশবোর্ড",
      path: "/admin/dashboard",
      icon: "🏠",
      roles: ["admin", "user"],
    },
    {
      name: "প্রোফাইল",
      path: "/admin/profile",
      icon: "👤",
      roles: ["admin", "user"],
    },

    // Admin Only
    { name: "স্ক্যানার", path: "/admin/scan", icon: "📷", roles: ["admin"] },
    {
      name: "নতুন এন্ট্রি",
      path: "/admin/create-entry",
      icon: "📝",
      roles: ["admin"],
    },
    { name: "রেজিস্ট্রেশন", path: "/admin/list", icon: "👥", roles: ["admin"] },
    { name: "গ্রুপ", path: "/admin/groups", icon: "📦", roles: ["admin"] },
    { name: "ব্যবহারকারী", path: "/admin/users", icon: "⚙️", roles: ["admin"] },

    // Donation
    {
      name: "বাল্ক আপলোড",
      path: "/admin/bulk-donate",
      icon: "📤",
      roles: ["admin"],
    },
    {
      name: "ডোনেশন লিস্ট",
      path: "/admin/donation-list",
      icon: "💰",
      roles: ["admin"],
    },
    {
      name: "চাঁদা সারাংশ",
      path: "/admin/contribution-summary",
      icon: "📊",
      roles: ["admin"],
    },
    {
      name: "ডোনেশন দিন",
      path: "/admin/donate",
      icon: "💸",
      roles: ["admin", "user"],
    },
  ];

  const allowedNavItems = allNavItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div
      className={`
      flex flex-col h-full transition-all duration-300 ease-in-out
      bg-slate-900 text-white shadow-xl
      ${collapsed ? "w-20" : "w-72"}
    `}
    >
=======
const SidebarContent = ({ collapsed, setCollapsed, isMobile, setMobileOpen }) => {
  const { logout, user, userData, authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = userData?.role || 'user';

  const handleLogout = async () => {
      await logout();
      navigate('/admin/login');
  };

  const allNavItems = [
    { name: "ড্যাশবোর্ড", path: "/admin/dashboard", icon: "🏠", roles: ["admin", "user"] },
    { name: "প্রোফাইল", path: "/admin/profile", icon: "👤", roles: ["admin", "user"] },
    
    // Admin Only
    { name: "স্ক্যানার", path: "/admin/scan", icon: "📷", roles: ["admin"] },
    { name: "নতুন এন্ট্রি", path: "/admin/create-entry", icon: "📝", roles: ["admin"] },
    { name: "রেজিস্ট্রেশন", path: "/admin/list", icon: "👥", roles: ["admin"] },
    { name: "গ্রুপ", path: "/admin/groups", icon: "📦", roles: ["admin"] },
    { name: "ব্যবহারকারী", path: "/admin/users", icon: "⚙️", roles: ["admin"] },
    
    // Donation
    { name: "বাল্ক আপলোড", path: "/admin/bulk-donate", icon: "📤", roles: ["admin"] },
    { name: "ডোনেশন লিস্ট", path: "/admin/donation-list", icon: "💰", roles: ["admin"] },
    { name: "ডোনেশন দিন", path: "/admin/donate", icon: "💸", roles: ["admin", "user"] },
  ];

  const allowedNavItems = allNavItems.filter(item => item.roles.includes(userRole));

  return (
    <div className={`
      flex flex-col h-full transition-all duration-300 ease-in-out
      bg-slate-900 text-white shadow-xl
      ${collapsed ? "w-20" : "w-72"}
    `}>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/50 relative">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              B
            </div>
            <div>
<<<<<<< HEAD
              <h1 className="text-lg font-bold font-bangla tracking-wide text-white">
                বংশ ইভেন্ট
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                অ্যাডমিন প্যানেল
              </p>
=======
              <h1 className="text-lg font-bold font-bangla tracking-wide text-white">বংশ ইভেন্ট</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">অ্যাডমিন প্যানেল</p>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
            B
          </div>
        )}

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white text-slate-600 rounded-full shadow-md flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all z-50 border border-slate-100"
          >
            {collapsed ? (
<<<<<<< HEAD
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
=======
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {allowedNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`
                flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
<<<<<<< HEAD
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
=======
                ${isActive 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-100 z-0"></div>
              )}
<<<<<<< HEAD

              <span
                className={`relative z-10 text-xl transition-transform duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              >
=======
              
              <span className={`relative z-10 text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                {item.icon}
              </span>

              {!collapsed && (
<<<<<<< HEAD
                <span
                  className={`relative z-10 ml-3 font-medium font-bangla text-sm whitespace-nowrap transition-all duration-300`}
                >
                  {item.name}
                </span>
              )}

=======
                <span className={`relative z-10 ml-3 font-medium font-bangla text-sm whitespace-nowrap transition-all duration-300`}>
                  {item.name}
                </span>
              )}
              
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
<<<<<<< HEAD
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
            {user?.displayName?.charAt(0) || "U"}
          </div>

          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.displayName || "User"}
              </p>
=======
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.displayName || 'User'}</p>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="লগআউট"
            >
<<<<<<< HEAD
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
=======
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default function Sidebar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}) {
  return (
    <Fragment>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        ></div>

        <div
          className={`absolute top-0 left-0 bottom-0 w-72 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            collapsed={false}
            isMobile={true}
            setMobileOpen={setMobileOpen}
          />
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
=======
export default function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  return (
    <Fragment>
      {/* Mobile Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        
        <div className={`absolute top-0 left-0 bottom-0 w-72 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent collapsed={false} isMobile={true} setMobileOpen={setMobileOpen} />
          <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 z-30">
<<<<<<< HEAD
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobile={false}
        />
=======
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} />
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      </div>
    </Fragment>
  );
}
