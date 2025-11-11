// src/pages/ProfilePage.jsx
import { useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, authLoading } = useAuth(); // AuthContext থেকে ইউজার তথ্য

  // প্রোফাইল ফর্ম স্টেট
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
  });
  
  // পাসওয়ার্ড ফর্ম স্টেট
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  // প্রোফাইল সাবমিট
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/user/profile-information', profileForm);
      toast.success(response.data.message, { className: 'font-bangla' });
      // (ঐচ্ছিক: AuthContext-এ ইউজার তথ্য আপডেট করা)
    } catch (error) {
      toast.error('প্রোফাইল আপডেট করা যায়নি।', { className: 'font-bangla' });
    }
  };

  // পাসওয়ার্ড সাবমিট
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/user/password', passwordForm);
      toast.success(response.data.message, { className: 'font-bangla' });
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.current_password?.[0] || 'পাসওয়ার্ড পরিবর্তন করা যায়নি।';
      toast.error(errorMsg, { className: 'font-bangla' });
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
              value={profileForm.name}
              onChange={handleProfileChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input
              type="email"
              name="email"
              value={profileForm.email}
              onChange={handleProfileChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div className="text-right">
            <button type="submit" disabled={authLoading} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              সেভ করুন
            </button>
          </div>
        </form>
      </div>

      {/* পাসওয়ার্ড পরিবর্তন কার্ড */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">পাসওয়ার্ড পরিবর্তন</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">বর্তমান পাসওয়ার্ড</label>
            <input
              type="password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড</label>
            <input
              type="password"
              name="password"
              value={passwordForm.password}
              onChange={handlePasswordChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type="password"
              name="password_confirmation"
              value={passwordForm.password_confirmation}
              onChange={handlePasswordChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div className="text-right">
            <button type="submit" disabled={authLoading} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              পাসওয়ার্ড সেভ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}