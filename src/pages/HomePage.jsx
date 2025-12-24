import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function StatCard({ title, value, icon, gradient, delay }) {
  return (
    <div
      className={`relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}
      ></div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-lg`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Separate component for group card to use useState
function GroupCard({ group, idx }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
      {/* Group Header - Clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {group.name}
            </p>
            <p className="text-xs text-gray-400">
              {group.registrations_count} রেজিস্ট্রেশন
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-indigo-600">
              {group.total_members}
            </p>
            <p className="text-[10px] text-gray-400 uppercase">সদস্য</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4 animate-fade-in">
          {/* Demographics */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <span>👥</span> লিঙ্গ ভিত্তিক বিভাজন
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">ছেলে/পুরুষ</p>
                <p className="text-lg font-bold text-blue-700">
                  {group.demographics.male}
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-2 text-center border border-pink-100">
                <p className="text-xs text-pink-600 font-medium">মেয়ে/মহিলা</p>
                <p className="text-lg font-bold text-pink-700">
                  {group.demographics.female}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
                <p className="text-xs text-green-600 font-medium">শিশু</p>
                <p className="text-lg font-bold text-green-700">
                  {group.demographics.children}
                </p>
              </div>
            </div>
          </div>

          {/* T-Shirt Sizes */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <span>👕</span> টি-শার্ট সাইজ প্রয়োজনীয়তা
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(group.tshirtSizes).map(
                ([size, count]) =>
                  count > 0 && (
                    <div
                      key={size}
                      className="bg-white rounded-lg p-2 text-center border border-gray-200"
                    >
                      <p className="text-xs text-gray-600 font-medium">
                        {size}
                      </p>
                      <p className="text-base font-bold text-gray-800">
                        {count}
                      </p>
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsMap = {};
        groupsSnapshot.forEach((doc) => {
          groupsMap[doc.id] = doc.data().name;
        });

        const regSnapshot = await getDocs(collection(db, "registrations"));
        const registrations = regSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let totalReg = 0;
        let totalMem = 0;
        let paid = 0;
        let pending = 0;
        const groupCounts = {};

        registrations.forEach((reg) => {
          totalReg++;
          const memCount = parseInt(reg.totalMembers) || 0;
          totalMem += memCount;

          if (reg.paymentStatus === "Paid") paid++;
          else if (reg.paymentStatus === "Pending") pending++;

          const gid = reg.group_id;
          if (gid) {
            if (!groupCounts[gid]) {
              groupCounts[gid] = {
                regCount: 0,
                memCount: 0,
                demographics: { male: 0, female: 0, children: 0 },
                tshirtSizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0, NA: 0 },
              };
            }
            groupCounts[gid].regCount++;
            groupCounts[gid].memCount += memCount;

            // Process members array for demographics and t-shirt sizes
            if (reg.members && Array.isArray(reg.members)) {
              reg.members.forEach((member) => {
                // Count by gender
                if (member.gender === "Male") {
                  groupCounts[gid].demographics.male++;
                } else if (member.gender === "Female") {
                  groupCounts[gid].demographics.female++;
                } else if (member.gender === "Child") {
                  groupCounts[gid].demographics.children++;
                }

                // Count by t-shirt size
                const size = member.t_shirt_size || "NA";
                if (groupCounts[gid].tshirtSizes[size] !== undefined) {
                  groupCounts[gid].tshirtSizes[size]++;
                }
              });
            }
          }
        });

        const formattedGroupStats = Object.keys(groupCounts).map((gid) => ({
          id: gid,
          name: groupsMap[gid] || "অজানা গ্রুপ",
          registrations_count: groupCounts[gid].regCount,
          total_members: groupCounts[gid].memCount,
          demographics: groupCounts[gid].demographics,
          tshirtSizes: groupCounts[gid].tshirtSizes,
        }));

        const sortedRecent = [...registrations]
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
            const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
            return dateB - dateA;
          })
          .slice(0, 5);

        const recentWithNames = sortedRecent.map((reg) => ({
          ...reg,
          groupName: groupsMap[reg.group_id] || "N/A",
        }));

        setStats({
          total_registrations: totalReg,
          total_members: totalMem,
          total_paid: paid,
          total_pending: pending,
        });
        setGroupStats(formattedGroupStats);
        setRecentRegistrations(recentWithNames);
        const statsRef = doc(db, "stats", "page_views");
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setTotalViews(statsSnap.data().count);
        }
      } catch (error) {
        console.error(error);
        toast.error("ড্যাশবোর্ড ডেটা লোড করা যায়নি।");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen font-bangla text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-2"></div>
        ড্যাশবোর্ড লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 font-bangla max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ড্যাশবোর্ড</h1>
          <p className="text-sm text-gray-500 mt-1">
            আপনার ইভেন্টের সামগ্রিক অবস্থা
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-gray-400">আজকের তারিখ</p>
          <p className="text-sm font-semibold text-gray-700">
            {new Date().toLocaleDateString("bn-BD", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="মোট লিংক ভিজিট"
          value={totalViews}
          icon="👁️"
          gradient="from-purple-500 to-indigo-500"
          delay={0}
        />
        <StatCard
          title="মোট রেজিস্ট্রেশন"
          value={stats?.total_registrations || 0}
          icon="📄"
          gradient="from-blue-500 to-cyan-500"
          delay={100}
        />
        <StatCard
          title="মোট সদস্য"
          value={stats?.total_members || 0}
          icon="👥"
          gradient="from-emerald-500 to-teal-500"
          delay={200}
        />
        <StatCard
          title="পেমেন্ট স্ট্যাটাস"
          value={`${stats?.total_paid || 0} / ${stats?.total_pending || 0}`}
          icon="💰"
          gradient="from-orange-500 to-amber-500"
          delay={300}
        />
      </div>

      {/* Recent Registrations - Full Width */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            সাম্প্রতিক রেজিস্ট্রেশন
          </h3>
          <Link
            to="/admin/list"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
          >
            সব দেখুন &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  নাম
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  গ্রুপ
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  সদস্য
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  স্ট্যাটাস
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {recentRegistrations.length > 0 ? (
                recentRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {reg.name}
                      </div>
                      <div className="text-xs text-gray-400">{reg.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs">
                        {reg.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-700">
                      {reg.totalMembers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          reg.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {reg.paymentStatus === "Paid"
                          ? "পরিশোধিত"
                          : "অপেক্ষমান"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-400 text-sm"
                  >
                    কোনো তথ্য নেই।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Group Stats - Full Width with All Details Visible */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            গ্রুপ ভিত্তিক বিস্তারিত পরিসংখ্যান
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            প্রতিটি গ্রুপের সম্পূর্ণ তথ্য
          </p>
        </div>
        <div className="p-6">
          {groupStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupStats.map((group, idx) => (
                <div
                  key={group.id}
                  className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-indigo-200"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-md">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-800">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {group.registrations_count} রেজিস্ট্রেশন •{" "}
                          {group.total_members} সদস্য
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Demographics */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-3 flex items-center gap-1">
                      <span>👥</span> লিঙ্গ ভিত্তিক বিভাজন
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
                        <p className="text-xs text-blue-600 font-semibold mb-1">
                          ছেলে/পুরুষ
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {group.demographics.male}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-3 text-center border border-pink-200">
                        <p className="text-xs text-pink-600 font-semibold mb-1">
                          মেয়ে/মহিলা
                        </p>
                        <p className="text-2xl font-bold text-pink-700">
                          {group.demographics.female}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
                        <p className="text-xs text-green-600 font-semibold mb-1">
                          শিশু
                        </p>
                        <p className="text-2xl font-bold text-green-700">
                          {group.demographics.children}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* T-Shirt Sizes */}
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-3 flex items-center gap-1">
                      <span>👕</span> টি-শার্ট সাইজ প্রয়োজনীয়তা
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(group.tshirtSizes).map(([size, count]) =>
                        count > 0 ? (
                          <div
                            key={size}
                            className="bg-white rounded-lg p-2 text-center border-2 border-gray-200 hover:border-indigo-300 transition-colors"
                          >
                            <p className="text-xs text-gray-600 font-bold">
                              {size}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                              {count}
                            </p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 text-sm">
              কোনো গ্রুপ ডেটা নেই।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
