import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState(null);
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      if (error.response && error.response.status === 422) {
        toast.error('লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড ভুল।', { className: 'font-bangla' });
      } else {
        // অন্যান্য ত্রুটি হ্যান্ডেল করুন
        console.error("Login failed:", error); 
        toast.error('একটি ত্রুটি সংঘটিত হয়েছে', { className: 'font-bangla' });
      }
    }
  };

  return (
    // সম্পূর্ণ স্ক্রিনকে ঢেকে মাঝখানে আনার জন্য
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-kalpurush">
      
      {/* কার্ড কন্টেইনার */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        
        <h2 className="text-3xl font-extrabold text-gray-900 text-center border-b pb-4">
          অনুষ্ঠানে লগইন
        </h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* ইমেইল ফিল্ড */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল অ্যাড্রেস
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="আপনার ইমেইল দিন"
            />
          </div>
          
          {/* পাসওয়ার্ড ফিল্ড */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              পাসওয়ার্ড
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="আপনার পাসওয়ার্ড দিন"
            />
          </div>
          
          {/* ত্রুটি বার্তা (Error Message)
          {errors && errors.email && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="text-sm font-medium">{errors.email[0]}</p>
            </div>
          )}
           */}
          {/* লগইন বাটন */}
          <button
            type="submit"
            // --- বাটন আপডেট ---
            disabled={authLoading} 
            className={`w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none cursor-pointer ${
              authLoading
                ? 'bg-indigo-400 cursor-not-allowed' // লোডিং স্টাইল
                : 'bg-indigo-600 hover:bg-indigo-700' // ডিফল্ট স্টাইল
            }`}
          >
            {authLoading ? 'লোড হচ্ছে...' : 'প্রবেশ করুন'}
          </button>
        </form>

        {/* রেজিস্ট্রেশন লিংক */}
        <div className="text-sm text-center pt-4 border-t mt-4">
            নতুন আকাউন্ট করুন?{' '}
            <Link to="/admin/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                এখানে রেজিস্ট্রেশন করুন
            </Link>
        </div>
      </div>
    </div>
  );
}