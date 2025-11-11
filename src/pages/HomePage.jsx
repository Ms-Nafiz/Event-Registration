import { useState, useEffect } from "react";
import api from "../api"; // Axios instance
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// স্ট্যাটাস কার্ডের জন্য একটি ছোট কম্পোনেন্ট
function StatCard({ title, value, icon, colorClass }) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${colorClass}`}
    >
      <div className={`text-4xl ${colorClass.replace("border-", "text-")}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  // --- Notun State ---
  const [groupStats, setGroupStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // একবারে দুটি API কল করুন
        const [statsRes, recentRes, groupStatsRes] = await Promise.all([
          api.get("/api/admin/stats"), // নতুন পরিসংখ্যান API
          api.get("/api/registrations?limit=5"), // শুধু ৫টি সাম্প্রতিক ডেটা
          api.get("/api/admin/group-stats"),
        ]);

        setStats(statsRes.data);
        setRecentRegistrations(recentRes.data.data); // .data কারণ এটি paginated
        setGroupStats(groupStatsRes.data);
      } catch (error) {
        toast.error("ড্যাশবোর্ড ডেটা লোড করা যায়নি।", {
          className: "font-bangla",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 font-bangla">ড্যাশবোর্ড লোড হচ্ছে...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 font-bangla">
      {/* --- স্ট্যাটাস কার্ড সেকশন --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="মোট রেজিস্ট্রেশন"
          value={stats?.total_registrations || 0}
          icon="📄"
          colorClass="border-blue-500"
        />
        <StatCard
          title="মোট সদস্য"
          value={stats?.total_members || 0}
          icon="👥"
          colorClass="border-indigo-500"
        />
        <StatCard
          title="পরিশোধিত"
          value={stats?.total_paid || 0}
          icon="✅"
          colorClass="border-green-500"
        />
        <StatCard
          title="মুলতবি"
          value={stats?.total_pending || 0}
          icon="⏳"
          colorClass="border-yellow-500"
        />
      </div>

      {/* --- সাম্প্রতিক রেজিস্ট্রেশন তালিকা --- */}
      <div className="grid grid-cols-1  gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              সাম্প্রতিক রেজিস্ট্রেশন
            </h3>
            <Link
              to="/admin/list"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
            >
              সব দেখুন &rarr;
            </Link>
          </div>

          {/* টেবিল */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    নাম
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    গ্রুপ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    সদস্য
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    স্ট্যাটাস
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {reg.name}
                        </p>
                        <p className="text-sm text-gray-500">{reg.mobile}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {reg.group?.name || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {reg.total_members} জন
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reg.payment_status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : reg.payment_status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reg.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      এখনও কোনো রেজিস্ট্রেশন হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* --- Column 2: Group Summary (Notun Table) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">গ্রুপ ভিত্তিক রেজিস্ট্রেশন </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">গ্রুপ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মোট রেজিস্ট্রেশন</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মোট সদস্য</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupStats.length > 0 ? groupStats.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{group.registrations_count}</td>
                    {/* Laravel 'withSum' er result string hisebe pathay, tai '|| 0' diye parse kora hocche */}
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{parseInt(group.registrations_sum_total_members || 0)} জন</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                      কোন গ্রুপ ডাটা পাওয়া যাইনি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
