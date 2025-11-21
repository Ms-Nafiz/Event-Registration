import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword } from "firebase/auth";
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();

  const [name, setName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name === user.displayName) return;

    setLoadingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: name
      });
      toast.success('প্রোফাইলের নাম আপডেট করা হয়েছে!');
    } catch (error) {
      toast.error('প্রোফাইল আপডেট করা যায়নি।');
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('পাসওয়ার্ড দুটি মিলছে না!');
    }
    if (newPassword.length < 6) {
      return toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
    }

    setLoadingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        toast.error('এটি একটি সংবেদনশীল কাজ। অনুগ্রহ করে লগআউট করে আবার লগইন করুন।');
      } else {
        toast.error('পাসওয়ার্ড পরিবর্তন করা যায়নি।');
      }
      console.error(error);
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="p-4 md:p-8 font-bangla max-w-4xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-800">প্রোফাইল সেটিংস</h2>
        <p className="text-sm text-gray-500">আপনার ব্যক্তিগত তথ্য এবং নিরাপত্তা সেটিংস</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-indigo-600 border-4 border-white shadow-lg">
              {user.displayName?.charAt(0) || 'U'}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{user.displayName || 'অজানা ব্যবহারকারী'}</h3>
            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              অ্যাডমিন
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Info Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-800">সাধারণ তথ্য</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পুরো নাম</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">ইমেইল পরিবর্তন করা সম্ভব নয়।</p>
                </div>
                <div className="pt-2 text-right">
                  <button 
                    type="submit" 
                    disabled={loadingProfile} 
                    className={`px-6 py-2 rounded-lg text-white font-medium shadow-sm transition-all ${
                      loadingProfile ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                    }`}
                  >
                    {loadingProfile ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Password Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-800">পাসওয়ার্ড পরিবর্তন</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="একই পাসওয়ার্ড আবার লিখুন"
                  />
                </div>
                <div className="pt-2 text-right">
                  <button 
                    type="submit" 
                    disabled={loadingPassword} 
                    className={`px-6 py-2 rounded-lg text-white font-medium shadow-sm transition-all ${
                      loadingPassword ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                    }`}
                  >
                    {loadingPassword ? 'সেভ হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}