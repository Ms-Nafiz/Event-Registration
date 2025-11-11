import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // লগআউট ফাংশন অ্যাক্সেস করতে

export default function Sidebar() {
  const { logout, user, authLoading } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'ড্যাশবোর্ড', path: '/admin/dashboard', icon: '🏠' },
    { name: 'নতুন রেজিস্ট্রেশন', path: '/admin/create-entry', icon: '📝' },
    { name: 'রেজিস্ট্রেশন তালিকা', path: '/admin/list', icon: '👥' },
    { name: 'গ্রুপ ম্যানেজমেন্ট', path: '/admin/groups', icon: '📦' }, // <-- নতুন লিঙ্ক
    { name: 'প্রোফাইল', path: '/admin/profile', icon: '👤' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full shadow-lg">
      
      {/* লোগো/হেডার */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold font-bangla">বংশ অনুষ্ঠান</h1>
        <p className="text-xs text-gray-400">অ্যাডমিন প্যানেল</p>
      </div>

      {/* নেভিগেশন লিংকস */}
      <nav className="flex-grow p-4 space-y-2">
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

      {/* ফুটার/লগআউট */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm truncate mb-2">স্বাগতম, {user ? user.name : 'User'}</p>
        <button
          onClick={logout}
          // --- বাটন আপডেট ---
          disabled={authLoading}
          className={`w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150 font-medium font-bangla cursor-pointer ${
            authLoading 
              ? 'bg-red-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {authLoading ? 'লগআউট হচ্ছে...' : 'লগআউট 🚪'}
        </button>
      </div>
    </div>
  );
}