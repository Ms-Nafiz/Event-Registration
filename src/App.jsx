import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// --- লেআউট এবং অ্যাডমিন পেজ ---
import DashboardLayout from "./components/layouts/DashboardLayout";
import AdminDashboardHome from "./pages/HomePage";
import RegistrationListPage from "./pages/RegistrationListPage";
import Login from "./components/Login";
import Register from "./components/Register";
// import VerifyEmail from "./pages/VerifyEmail"; // Unused in main.jsx
import GroupsPage from "./pages/GroupsPage";
import ProfilePage from "./pages/ProfilePage";
import ScanQRPage from "./pages/ScanQRPage";
import UserManagementPage from "./pages/UserManagementPage";
import Unauthorized from "./pages/Unauthorized";
import DonationPage from "./pages/DonationPage";
import AdminDonationUploadPage from "./pages/AdminDonationUploadPage";
<<<<<<< HEAD
import AdminRegistrationUploadPage from "./pages/AdminRegistrationUploadPage";
import AdminDonationListPage from "./pages/AdminDonationListPage";
import ContributionSummaryPage from "./pages/ContributionSummaryPage";

// --- পাবলিক পেজ ---
import PublicEventRegistration from "./pages/RegistrationFormPage";

// ১. গেস্ট রুট: লগইন করা থাকলে ড্যাশবোর্ডে পাঠাবে
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>লোড হচ্ছে...</div>;
  return user ? <Navigate to="/admin/dashboard" replace /> : children;
}

// ২. প্রোটেক্টেড রুট: লগইন না থাকলে লগইন পেজে পাঠাবে
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userData, loading } = useAuth();

  // ১. লোডিং অবস্থায় কিছুই রেন্ডার করবেন না বা লোডার দেখান
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        লোড হচ্ছে...
      </div>
    );
  }

  // ২. ইউজার না থাকলে লগইনে পাঠান
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // ৩. রোল চেক
  if (
    allowedRoles.length > 0 &&
    userData &&
    !allowedRoles.includes(userData.role)
  ) {
    return <Unauthorized />;
  }

  return children;
=======
import AdminDonationListPage from "./pages/AdminDonationListPage";

// --- পাবলিক পেজ ---
import PublicEventRegistration from "./pages/RegistrationFormPage";

// ১. গেস্ট রুট: লগইন করা থাকলে ড্যাশবোর্ডে পাঠাবে
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>লোড হচ্ছে...</div>;
  return user ? <Navigate to="/admin/dashboard" replace /> : children;
}

// ২. প্রোটেক্টেড রুট: লগইন না থাকলে লগইন পেজে পাঠাবে
function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, userData, loading } = useAuth();

    // ১. লোডিং অবস্থায় কিছুই রেন্ডার করবেন না বা লোডার দেখান
    if (loading) {
        return <div className="h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
    }

    // ২. ইউজার না থাকলে লগইনে পাঠান
    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    // ৩. রোল চেক
    if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
        return <Unauthorized />;
    }

    return children;
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
}

function App() {
  return (
    <Routes>
      {/* ১. পাবলিক রুট */}
      <Route path="/event-registration" element={<PublicEventRegistration />} />
      <Route path="/" element={<Login />} />

      {/* ২. লগইন/রেজিস্টার (গেস্ট রুট) */}
      <Route
        path="/admin/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/admin/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />

      {/* ================================================= */}
      {/* ৩. প্রোটেক্টেড রুটস (রোল ভিত্তিক) */}
      {/* ================================================= */}

      <Route path="/admin" element={<DashboardLayout />}>
        {/* ক. সবার জন্য (Admin + User) */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <AdminDashboardHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* খ. শুধুমাত্র অ্যাডমিনদের জন্য (Only Admin) */}
        <Route
          path="scan"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ScanQRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="create-entry"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PublicEventRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="list"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RegistrationListPage />
            </ProtectedRoute>
          }
        />
        <Route
<<<<<<< HEAD
          path="bulk-registration"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRegistrationUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
=======
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
          path="groups"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        {/* Donation Routes */}
        <Route
          path="donate"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <DonationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="bulk-donate"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDonationUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="donation-list"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDonationListPage />
            </ProtectedRoute>
          }
        />
<<<<<<< HEAD
        <Route
          path="contribution-summary"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ContributionSummaryPage />
            </ProtectedRoute>
          }
        />
=======
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      </Route>

      {/* ভুল লিংকে গেলে রিডাইরেক্ট */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
