// src/pages/VerifyEmail.jsx

import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
    const { user, logout, resendVerificationEmail } = useAuth();
    
    // যদি ইউজার ভেরিফাইড হয়ে যায়, তাকে ড্যাশবোর্ডে পাঠান
    if (user && user.email_verified_at) {
        return <Navigate to="/dashboard" replace />;
    }

    // যদি ইউজার লগইন করা না থাকে, লগইনে পাঠান
    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    const handleResend = () => {
        resendVerificationEmail();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-bangla">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    📩 আপনার ইমেইল ভেরিফাই করুন
                </h2>
                <p className="text-gray-600 mb-6">
                    অ্যাডমিন প্যানেল ব্যবহার করার আগে, অনুগ্রহ করে আপনার ইমেইল ইনবক্স চেক করুন। আমরা আপনাকে একটি ভেরিফিকেশন লিংক পাঠিয়েছি।
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    (আপনার ইমেইল: <strong>{user.email}</strong>)
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleResend}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        লিংকটি আবার পাঠান
                    </button>
                    <button
                        onClick={logout}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                    >
                        লগআউট
                    </button>
                </div>
            </div>
        </div>
    );
}