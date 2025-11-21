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
    totalPending: 0,
    totalPendingAmount: 0,
    totalWaived: 0,
    totalWaivedAmount: 0,
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
            } else if (paymentStatus === "Pending") {
              groupsMap[groupId].pendingCount++;
              groupsMap[groupId].pendingAmount += amount;
              pendingCount++;
              totalPendingAmount += amount;
            } else if (paymentStatus === "Waived") {
              groupsMap[groupId].waivedCount++;
              groupsMap[groupId].waivedAmount += amount;
              waivedCount++;
              totalWaivedAmount += amount;
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
          totalPending: pendingCount,
          totalPendingAmount: totalPendingAmount,
          totalWaived: waivedCount,
          totalWaivedAmount: totalWaivedAmount,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">মোট রেজিস্ট্রেশন</h3>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold">
            {overallStats.totalRegistrations}
          </p>
          <p className="text-xs opacity-75 mt-1">
            মোট সদস্য: {overallStats.totalMembers} জন
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">পরিশোধিত</h3>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overallStats.totalPaid}</p>
          <p className="text-xs opacity-75 mt-1">
            রেজিস্ট্রেশন (৳{overallStats.totalPaidAmount.toLocaleString()})
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">অপেক্ষমান</h3>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overallStats.totalPending}</p>
          <p className="text-xs opacity-75 mt-1">
            রেজিস্ট্রেশন (৳{overallStats.totalPendingAmount.toLocaleString()})
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium opacity-90">মওকুফ</h3>
            <svg
              className="w-8 h-8 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-bold">{overallStats.totalWaived}</p>
          <p className="text-xs opacity-75 mt-1">
            রেজিস্ট্রেশন (৳{overallStats.totalWaivedAmount.toLocaleString()})
          </p>
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      গ্রুপ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      রেজিস্ট্রেশন
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      সদস্য
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      পরিশোধিত
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      অপেক্ষমান
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      মওকুফ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      মোট চাঁদা
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
                        <div className="text-sm font-medium text-gray-900">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {group.description}
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-semibold text-green-700">
                            {group.paidCount}
                          </div>
                          <div className="text-xs text-gray-500">
                            ৳{group.paidAmount.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-semibold text-yellow-700">
                            {group.pendingCount}
                          </div>
                          <div className="text-xs text-gray-500">
                            ৳{group.pendingAmount.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm">
                          <div className="font-semibold text-purple-700">
                            {group.waivedCount}
                          </div>
                          <div className="text-xs text-gray-500">
                            ৳{group.waivedAmount.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ৳
                          {(
                            group.paidAmount +
                            group.pendingAmount +
                            group.waivedAmount
                          ).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      সর্বমোট
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                      {overallStats.totalRegistrations}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                      {overallStats.totalMembers}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-green-700">
                      <div>{overallStats.totalPaid}</div>
                      <div className="text-[10px] opacity-70">
                        ৳{overallStats.totalPaidAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-yellow-700">
                      <div>{overallStats.totalPending}</div>
                      <div className="text-[10px] opacity-70">
                        ৳{overallStats.totalPendingAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-purple-700">
                      <div>{overallStats.totalWaived}</div>
                      <div className="text-[10px] opacity-70">
                        ৳{overallStats.totalWaivedAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                      ৳{overallStats.totalAmount.toLocaleString()}
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
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="block text-gray-400 text-[10px] uppercase">
                        রেজিস্ট্রেশন
                      </span>
                      <span className="font-bold text-gray-800">
                        {group.totalRegistrations}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="block text-gray-400 text-[10px] uppercase">
                        সদস্য
                      </span>
                      <span className="font-bold text-gray-800">
                        {group.totalMembers}
                      </span>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <span className="block text-green-600 text-[10px] uppercase">
                        পরিশোধিত
                      </span>
                      <span className="font-bold text-green-700">
                        {group.paidCount} (৳{group.paidAmount.toLocaleString()})
                      </span>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-lg">
                      <span className="block text-yellow-600 text-[10px] uppercase">
                        অপেক্ষমান
                      </span>
                      <span className="font-bold text-yellow-700">
                        {group.pendingCount} (৳
                        {group.pendingAmount.toLocaleString()})
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">মোট চাঁদা</span>
                      <span className="text-sm font-bold text-gray-900">
                        ৳
                        {(
                          group.paidAmount +
                          group.pendingAmount +
                          group.waivedAmount
                        ).toLocaleString()}
                      </span>
                    </div>
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
