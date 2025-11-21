import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [groupId, setGroupId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // গ্রুপ লোড
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const snapshot = await getDocs(collection(db, "groups"));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGroups(list);
        if(list.length > 0) setGroupId(list[0].id);
      } catch (error) {
        console.error(error);
      }
    };
    fetchGroups();
  }, []);

  // --- ১. মোবাইল নম্বর ইনপুট হ্যান্ডলার ---
  const handleMobileChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 11) {
        setMobile(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bdMobileRegex = /^01[3-9]\d{8}$/;

    if (!bdMobileRegex.test(mobile)) {
        return toast.error('দয়া করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
    }

    if (password !== confirmPassword) return toast.error('পাসওয়ার্ড মিলছে না!');
    if (password.length < 6) return toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
    if (!groupId) return toast.error('দয়া করে একটি গ্রুপ নির্বাচন করুন।');

    setLoading(true);
    
    try {
      await register(name, email, password, mobile, groupId);
      
      toast.success('রেজিস্ট্রেশন সফল!', {
        duration: 6000,
        icon: '✅'
      });
      
      navigate('/admin/dashboard'); 
      
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে।');
      } else {
        toast.error('রেজিস্ট্রেশন ব্যর্থ: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-bangla">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 text-center border-b pb-4">
          ব্যবহারকারী নিবন্ধন
        </h2>
        <p className="text-xs text-center text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
          রেজিস্ট্রেশন করার পর আপনি সরাসরি ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
        </p>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">নাম</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">মোবাইল নম্বর</label>
            <input 
                type="text"
                value={mobile} 
                onChange={handleMobileChange}
                required 
                placeholder="017XXXXXXXX" 
                className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500" 
            />
            <p className="text-xs text-gray-400 mt-1">অবশ্যই ১১ ডিজিট হতে হবে</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">গ্রুপ / দল</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-indigo-500 bg-white">
                {groups.length === 0 && <option>গ্রুপ লোড হচ্ছে...</option>}
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.description}-{g.name}</option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">নিশ্চিত করুন</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow font-bold transition">
            {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'নিবন্ধন করুন'}
          </button>
        </form>

        <div className="text-sm text-center pt-4 border-t">
          অ্যাকাউন্ট আছে? <Link to="/admin/login" className="text-indigo-600 font-bold">লগইন করুন</Link>
        </div>
      </div>
    </div>
  );
}