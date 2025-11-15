import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // AuthContext আপডেট করতে হবে
import { updateProfile, updatePassword } from "firebase/auth";
import { auth } from '../firebase'; // Firebase auth ইম্পোর্ট
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth(); // AuthContext থেকে বর্তমান ইউজার নিন

  // প্রোফাইল ফর্ম স্টেট
  const [name, setName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || ''); // ইমেইল শুধু দেখানোর জন্য
  
  // পাসওয়ার্ড ফর্ম স্টেট
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // প্রোফাইল (নাম) সাবমিট
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name === user.displayName) return; // যদি নাম পরিবর্তন না হয়

    setLoadingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: name
      });
      toast.success('প্রোফাইলের নাম আপডেট করা হয়েছে!');
      // (AuthContext স্বয়ংক্রিয়ভাবে আপডেট হয়ে যাবে)
    } catch (error) {
      toast.error('প্রোফাইল আপডেট করা যায়নি।');
      console.error(error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // পাসওয়ার্ড সাবমিট
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
      // যদি ইউজার অনেক আগে লগইন করে থাকে, তবে ফায়ারবেস নিরাপত্তার জন্য আবার লগইন করতে বলবে
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
    <div className="p-6 md:p-8 font-bangla space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800">অ্যাডমিন প্রোফাইল</h2>
      
      {/* প্রোফাইল তথ্য আপডেট কার্ড */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">প্রোফাইল তথ্য</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">নাম</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input
              type="email"
              name="email"
              value={email}
              disabled // ফায়ারবেসে ইমেইল পরিবর্তন করা জটিল, তাই ডিসেবল রাখা হলো
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="text-right">
            <button 
              type="submit" 
              disabled={loadingProfile} 
              className={`px-5 py-2 rounded-lg text-white ${loadingProfile ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loadingProfile ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
            </button>
          </div>
        </form>
      </div>

      {/* পাসওয়ার্ড পরিবর্তন কার্ড */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">পাসওয়ার্ড পরিবর্তন</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড</label>
            <input
              type="password"
              name="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type="password"
              name="password_confirmation"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div className="text-right">
            <button 
              type="submit" 
              disabled={loadingPassword} 
              className={`px-5 py-2 rounded-lg text-white ${loadingPassword ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loadingPassword ? 'সেভ হচ্ছে...' : 'পাসওয়ার্ড সেভ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}