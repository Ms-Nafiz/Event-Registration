import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ContributionSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [groupSummaries, setGroupSummaries] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalRegistrations: 0,
    totalMembers: 0,
    totalPaid: 0,
    totalPaidAmount: 0,
    totalPaidMembers: 0,
    totalPending: 0,
    totalPendingAmount: 0,
    totalPendingMembers: 0,
    totalWaived: 0,
    totalWaivedAmount: 0,
    totalWaivedMembers: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch groups
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsMap = {};
        groupsSnapshot.forEach((doc) => {
          groupsMap[doc.id] = {
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            totalRegistrations: 0,
            totalMembers: 0,
            paidCount: 0,
            paidAmount: 0,
            pendingCount: 0,
            pendingAmount: 0,
            waivedCount: 0,
            waivedAmount: 0,
          };
        });

        // Fetch registrations
        const registrationsSnapshot = await getDocs(
          collection(db, "registrations")
        );

        let totalRegs = 0;
        let totalMems = 0;
        let totalPaidAmount = 0;
        let totalPendingAmount = 0;
        let totalWaivedAmount = 0;
        let paidCount = 0;
        let pendingCount = 0;
        let waivedCount = 0;
        let paidMembers = 0;
        let pendingMembers = 0;
        let waivedMembers = 0;

        registrationsSnapshot.forEach((doc) => {
          const data = doc.data();
          const groupId = data.group_id;
          const paymentStatus = data.paymentStatus || "Pending";
          const amount = parseFloat(data.contributeAmount || 0);
          const memberCount = data.totalMembers || data.total_members || 0;

          if (groupsMap[groupId]) {
            groupsMap[groupId].totalRegistrations++;
            groupsMap[groupId].totalMembers += memberCount;

            if (paymentStatus === "Paid") {
              groupsMap[groupId].paidCount++;
              groupsMap[groupId].paidAmount += amount;
              paidCount++;
              totalPaidAmount += amount;
              paidMembers += memberCount;
            } else if (paymentStatus === "Pending") {
              groupsMap[groupId].pendingCount++;
              groupsMap[groupId].pendingAmount += amount;
              pendingCount++;
              totalPendingAmount += amount;
              pendingMembers += memberCount;
            } else if (paymentStatus === "Waived") {
              groupsMap[groupId].waivedCount++;
              groupsMap[groupId].waivedAmount += amount;
              waivedCount++;
              totalWaivedAmount += amount;
              waivedMembers += memberCount;
            }
          }

          totalRegs++;
          totalMems += memberCount;
        });

        // Convert to array and sort by total registrations
        const summaries = Object.values(groupsMap).sort(
          (a, b) => b.totalRegistrations - a.totalRegistrations
        );

        setGroupSummaries(summaries);
        setOverallStats({
          totalRegistrations: totalRegs,
          totalMembers: totalMems,
          totalPaid: paidCount,
          totalPaidAmount: totalPaidAmount,
          totalPaidMembers: paidMembers,
          totalPending: pendingCount,
          totalPendingAmount: totalPendingAmount,
          totalPendingMembers: pendingMembers,
          totalWaived: waivedCount,
          totalWaivedAmount: totalWaivedAmount,
          totalWaivedMembers: waivedMembers,
          totalAmount: totalPaidAmount + totalPendingAmount + totalWaivedAmount,
        });
      } catch (error) {
        console.error(error);
        toast.error("ডেটা লোড করা যায়নি");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-bangla max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">চাঁদা সারাংশ</h2>
          <p className="text-sm text-gray-500 mt-1">
            গ্রুপ অনুযায়ী চাঁদা সংগ্রহের বিস্তারিত তথ্য
          </p>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#4F46E5] rounded-2xl p-6 text-white shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold tracking-wider uppercase opacity-80 mb-1">
            মোট চাঁদা
          </h3>
          <p className="text-4xl font-extrabold tracking-tight">
            ৳{overallStats.totalAmount.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded-lg">
            <span>{overallStats.totalRegistrations} রেজিস্ট্রেশন</span>
            <span className="opacity-40">|</span>
            <span>{overallStats.totalMembers} জন সদস্য</span>
          </div>
        </div>

        <div className="bg-[#059669] rounded-2xl p-6 text-white shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold tracking-wider uppercase opacity-80 mb-1">
            পরিশোধিত চাঁদা
          </h3>
          <p className="text-4xl font-extrabold tracking-tight">
            ৳{overallStats.totalPaidAmount.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded-lg">
            <span>{overallStats.totalPaid} রেজিস্ট্রেশন</span>
            <span className="opacity-40">|</span>
            <span>{overallStats.totalPaidMembers} জন সদস্য</span>
          </div>
        </div>

        <div className="bg-[#D97706] rounded-2xl p-6 text-white shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold tracking-wider uppercase opacity-80 mb-1">
            অপেক্ষমান চাঁদা
          </h3>
          <p className="text-4xl font-extrabold tracking-tight">
            ৳{overallStats.totalPendingAmount.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded-lg">
            <span>{overallStats.totalPending} রেজিস্ট্রেশন</span>
            <span className="opacity-40">|</span>
            <span>{overallStats.totalPendingMembers} জন সদস্য</span>
          </div>
        </div>

        <div className="bg-[#7C3AED] rounded-2xl p-6 text-white shadow-xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold tracking-wider uppercase opacity-80 mb-1">
            মওকুফ চাঁদা
          </h3>
          <p className="text-4xl font-extrabold tracking-tight">
            ৳{overallStats.totalWaivedAmount.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold bg-white/10 w-fit px-2 py-1 rounded-lg">
            <span>{overallStats.totalWaived} রেজিস্ট্রেশন</span>
            <span className="opacity-40">|</span>
            <span>{overallStats.totalWaivedMembers} জন সদস্য</span>
          </div>
        </div>
      </div>

      {/* Group-wise Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            গ্রুপ অনুযায়ী বিস্তারিত
          </h3>
        </div>

        {groupSummaries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            কোনো তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      গ্রুপ নাম
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      মোট চাঁদা
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      পরিশোধিত
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      অপেক্ষমান
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      মওকুফ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      রেজি.
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      সদস্য
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {groupSummaries.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {group.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-black text-gray-900">
                          ৳
                          {(
                            group.paidAmount +
                            group.pendingAmount +
                            group.waivedAmount
                          ).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-black text-green-700">
                            ৳{group.paidAmount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">
                            {group.paidCount} রেজিস্ট্রেশন
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-black text-amber-600">
                            ৳{group.pendingAmount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">
                            {group.pendingCount} রেজিস্ট্রেশন
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-black text-purple-700">
                            ৳{group.waivedAmount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">
                            {group.waivedCount} রেজিস্ট্রেশন
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {group.totalRegistrations}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-gray-700">
                          {group.totalMembers}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-black text-gray-900 uppercase">
                      সর্বমোট
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                      ৳{overallStats.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-black text-green-700">
                      <div>
                        ৳{overallStats.totalPaidAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] opacity-70">
                        {overallStats.totalPaid} রেজি. |{" "}
                        {overallStats.totalPaidMembers} জন
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-black text-amber-600">
                      <div>
                        ৳{overallStats.totalPendingAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] opacity-70">
                        {overallStats.totalPending} রেজি. |{" "}
                        {overallStats.totalPendingMembers} জন
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-black text-purple-700">
                      <div>
                        ৳{overallStats.totalWaivedAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] opacity-70">
                        {overallStats.totalWaived} রেজি. |{" "}
                        {overallStats.totalWaivedMembers} জন
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-black text-gray-900">
                      {overallStats.totalRegistrations}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-black text-gray-900">
                      {overallStats.totalMembers}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {groupSummaries.map((group) => (
                <div key={group.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {group.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-indigo-50/50 p-2 rounded-lg">
                      <span className="block text-indigo-600 text-[10px] font-bold uppercase mb-1">
                        মোট চাঁদা
                      </span>
                      <span className="font-black text-indigo-700 text-sm">
                        ৳
                        {(
                          group.paidAmount +
                          group.pendingAmount +
                          group.waivedAmount
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                      <span className="block text-green-600 text-[10px] font-bold uppercase mb-1">
                        পরিশোধিত
                      </span>
                      <span className="font-black text-green-700">
                        ৳{group.paidAmount.toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-0.5">
                        {group.paidCount} রেজিস্ট্রেশন
                      </span>
                    </div>
                    <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <span className="block text-amber-600 text-[10px] font-bold uppercase mb-1">
                        অপেক্ষমান
                      </span>
                      <span className="font-black text-amber-700">
                        ৳{group.pendingAmount.toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-0.5">
                        {group.pendingCount} রেজিস্ট্রেশন
                      </span>
                    </div>
                    <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                      <span className="block text-purple-600 text-[10px] font-bold uppercase mb-1">
                        মওকুফ
                      </span>
                      <span className="font-black text-purple-700">
                        ৳{group.waivedAmount.toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-gray-400 mt-0.5">
                        {group.waivedCount} রেজিস্ট্রেশন
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-[10px] font-bold text-gray-400 uppercase pt-1 px-1">
                    <span>
                      রেজিস্ট্রেশন:{" "}
                      <span className="text-gray-900">
                        {group.totalRegistrations}
                      </span>
                    </span>
                    <span>
                      সদস্য:{" "}
                      <span className="text-gray-900">
                        {group.totalMembers}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
