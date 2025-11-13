import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('স্বাগতম! লগইন সফল হয়েছে।');
      navigate('/admin/dashboard'); // ড্যাশবোর্ডে রিডাইরেক্ট
    } catch (error) {
      console.error(error);
      // ফায়ারবেসের এরর মেসেজ হ্যান্ডেলিং
      if (error.code === 'auth/invalid-credential') {
        toast.error('ইমেইল বা পাসওয়ার্ড ভুল।');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('অনেকবার ভুল চেষ্টা করেছেন। কিছুক্ষণ পর চেষ্টা করুন।');
      } else {
        toast.error('লগইন ব্যর্থ হয়েছে: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-bangla">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center border-b pb-4">
          অ্যাডমিন লগইন
        </h2>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="********"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'লগইন হচ্ছে...' : 'প্রবেশ করুন'}
          </button>
        </form>

        <div className="text-sm text-center pt-4 border-t mt-4">
          অ্যাকাউন্ট নেই?{' '}
          <Link to="/admin/register" className="font-medium text-indigo-600 hover:text-indigo-500">
             এখানে রেজিস্ট্রেশন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}