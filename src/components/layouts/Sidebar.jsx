import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Fragment } from 'react';

/**
 * SidebarContent component
 * এটি শুধু সাইডবারের ভেতরের ডিজাইন (এটি পরিবর্তন করা হয়নি)
 */
const SidebarContent = () => {
  const { logout, user, authLoading } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'ড্যাশবোর্ড', path: '/admin/dashboard', icon: '🏠' },
    { name: 'স্ক্যানার', path: '/admin/scan', icon: '📷' },
    { name: 'নতুন রেজিস্ট্রেশন', path: '/admin/create-entry', icon: '📝' },
    { name: 'রেজিস্ট্রেশন তালিকা', path: '/admin/list', icon: '👥' },
    { name: 'গ্রুপ ম্যানেজমেন্ট', path: '/admin/groups', icon: '📦' },
    { name: 'প্রোফাইল', path: '/admin/profile', icon: '👤' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg">
      {/* হেডার */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold font-bangla">বংশ অনুষ্ঠান</h1>
        <p className="text-xs text-gray-400">অ্যাডমিন প্যানেল</p>
      </div>
      
      {/* নেভিগেশন */}
      <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 rounded-lg font-medium transition duration-150 ${
              location.pathname === item.path
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span className="font-bangla">{item.name}</span>
          </Link>
        ))}
      </nav>
      
      {/* ফুটার */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm truncate mb-2">স্বাগতম, {user ? user.displayName : 'অ্যাডমিন'}</p>
        <button
          onClick={logout}
          disabled={authLoading}
          className={`w-full py-2 px-4 text-white rounded-lg transition duration-150 font-medium font-bangla ${
            authLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {authLoading ? 'লগআউট হচ্ছে...' : 'লগআউট 🚪'}
        </button>
      </div>
    </div>
  );
};


/**
 * এটি মূল Sidebar কম্পোনেন্ট
 * (এখানে মূল পরিবর্তনটি করা হয়েছে)
 */
export default function Sidebar({ mobileOpen, setMobileOpen }) {
  return (
    <Fragment>
      {/* --- মোবাইল ভিউ (সঠিক z-index এবং width সহ) --- */}
      <div 
        className={`
          fixed inset-0 z-40 md:hidden 
          ${mobileOpen ? 'block' : 'hidden'} 
        `}
      >
        {/* ১. ব্যাকড্রপ (কালো আভা) 
           এটি z-40 তে থাকবে এবং ক্লিক করলে সাইডবার বন্ধ করবে।
           এটি এখন আর কোনো কিছু দিয়ে ঢাকা থাকবে না।
        */}
        <div 
          onClick={() => setMobileOpen(false)} 
          className="absolute inset-0 bg-black bg-opacity-50"
          aria-hidden="true"
        ></div>

        {/* ২. স্লাইডিং কন্টেন্ট 
           এটি z-50 তে থাকবে (ব্যাকড্রপের উপরে)
           এবং এর নির্দিষ্ট width: w-64 থাকবে।
        */}
        <div 
          className={`
            relative z-50 h-full w-64 
            transition-transform duration-300 ease-in-out
            ${mobileOpen ? 'transform translate-x-0' : 'transform -translate-x-full'}
          `}
        >
          <SidebarContent />
        </div>
      </div>

      {/* --- ডেস্কটপ ভিউ (স্থায়ী) --- */}
      <div className="hidden md:flex md:flex-shrink-0">
        <SidebarContent />
      </div>
    </Fragment>
  );
}