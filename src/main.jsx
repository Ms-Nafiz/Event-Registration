import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css'

// --- লেআউট এবং অ্যাডমিন পেজ ---
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminDashboardHome from './pages/HomePage'; // HomePage কে নতুন নাম দিলাম
import RegistrationListPage from './pages/RegistrationListPage';
import AdminLogin from './components/Login'; // Login কে নতুন নাম দিলাম
import AdminRegister from './components/Register'; // Register কে নতুন নাম দিলাম
import VerifyEmail from './pages/VerifyEmail';
import GroupsPage from './pages/GroupsPage'; // <-- নতুন ইম্পোর্ট
import ProfilePage from './pages/ProfilePage'; // <-- নতুন ইম্পোর্ট

// --- পাবলিক পেজ ---
import PublicEventRegistration from './pages/RegistrationFormPage'; // এই পেজটিই আমরা পাবলিক করবো

// --- প্রোটেক্টেড রুট (অ্যাডমিন) ---
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>লোড হচ্ছে...</div>;
    if (!user) return <Navigate to="/admin/login" replace />; // লগইন পেজে পাঠান
    if (!user.email_verified_at) return <Navigate to="/verify-email" replace />;
    return children;
}

// --- গেস্ট রুট (অ্যাডমিন লগইন/রেজিস্টার) ---
function GuestRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div>লোড হচ্ছে...</div>;
    // লগইন করা থাকলে অ্যাডমিন ড্যাশবোর্ডে পাঠান
    return user ? <Navigate to="/admin/dashboard" replace /> : children;
}

function AppRouter() {
    
    // --- অ্যাডমিন প্যানেলের রুটসমূহ ---
    const AdminRoutes = () => (
        <ProtectedRoute>
            <DashboardLayout>
                <Routes>
                    <Route path="/dashboard" element={<AdminDashboardHome />} />
                    <Route path="/list" element={<RegistrationListPage />} />
                    {/* অ্যাডমিন প্যানেলের ভেতরেও একটি রেজিস্টার ফর্ম রাখা যেতে পারে */}
                    <Route path="/create-entry" element={<PublicEventRegistration />} /> 
                    <Route path="/groups" element={<GroupsPage />} /> {/* <-- নতুন রুট */}
                    <Route path="/profile" element={<ProfilePage />} /> {/* <-- নতুন রুট */}
                </Routes>
            </DashboardLayout>
        </ProtectedRoute>
    );

    return (
        <Routes>
            {/* ============================================= */}
            {/* ১. পাবলিক ইভেন্ট রেজিস্ট্রেশন রুট */}
            {/* ============================================= */}
            <Route 
                path="/event-registration" 
                element={<PublicEventRegistration />} 
            />
            <Route path="/" element={<GuestRoute><AdminLogin /></GuestRoute>} />

            {/* ============================================= */}
            {/* ২. অ্যাডমিন প্যানেল রুট */}
            {/* ============================================= */}
            
            {/* অ্যাডমিন লগইন এবং ভেরিফিকেশন রুট */}
            <Route path="/admin/login" element={<GuestRoute><AdminLogin /></GuestRoute>} />
            <Route path="/admin/register" element={<GuestRoute><AdminRegister /></GuestRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} /> 
            
            {/* প্রোটেক্টেড অ্যাডমিন ড্যাশবোর্ড রুট */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            
            {/* যদি কেউ শুধু /admin লেখে, তাকে ড্যাশবোর্ডে পাঠানো */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            
        </Routes>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <AppRouter />
                <Toaster position="top-right" />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);