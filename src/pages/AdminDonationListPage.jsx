import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminDonationListPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // Summary States
  const [summary, setSummary] = useState({
    topGroup: null,
    zeroDonationGroups: [],
    monthlyStats: [],
    yearlyStats: [],
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Donations
      const dQuery = query(collection(db, "donations"), orderBy("date", "desc"));
      const dSnapshot = await getDocs(dQuery);
      const dList = dSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDonations(dList);

      // 2. Fetch Groups
      const gSnapshot = await getDocs(collection(db, "groups"));
      const gList = gSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(gList);

      // 3. Calculate Summaries
      calculateSummaries(dList, gList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateSummaries = (dList, gList) => {
    const groupTotals = {};
    const monthTotals = {};
    const yearTotals = {};

    // Initialize group totals
    gList.forEach((g) => (groupTotals[g.id] = 0));

    dList.forEach((d) => {
      if (d.status === "approved") {
        const amount = Number(d.amount) || 0;

        // Group Total
        if (d.groupId) {
          groupTotals[d.groupId] = (groupTotals[d.groupId] || 0) + amount;
        }

        // Monthly Total
        if (d.month) {
          monthTotals[d.month] = (monthTotals[d.month] || 0) + amount;
        }

        // Yearly Total
        const dateObj = d.date?.toDate ? d.date.toDate() : new Date(d.createdAt);
        const year = dateObj.getFullYear();
        yearTotals[year] = (yearTotals[year] || 0) + amount;
      }
    });

    // Top Group
    let topGroupId = null;
    let maxAmount = -1;
    Object.entries(groupTotals).forEach(([gid, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        topGroupId = gid;
      }
    });
    const topGroup = gList.find((g) => g.id === topGroupId);

    // Zero Donation Groups
    const zeroGroups = gList.filter((g) => !groupTotals[g.id] || groupTotals[g.id] === 0);

    setSummary({
      topGroup: topGroup ? { ...topGroup, total: maxAmount } : null,
      zeroDonationGroups: zeroGroups,
      monthlyStats: monthTotals,
      yearlyStats: yearTotals,
    });
  };

  const handleApprove = async (id) => {
    if (!confirm("আপনি কি এই ডোনেশনটি অ্যাপ্রুভ করতে চান?")) return;
    setProcessingId(id);
    try {
      const donationRef = doc(db, "donations", id);
      await updateDoc(donationRef, {
        status: "approved",
      });

      // Update local state & Recalculate summaries
      const updatedList = donations.map((d) =>
        d.id === id ? { ...d, status: "approved" } : d
      );
      setDonations(updatedList);
      calculateSummaries(updatedList, groups);

      toast.success("ডোনেশন অ্যাপ্রুভ করা হয়েছে!");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("অ্যাপ্রুভ করা যায়নি।");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDonations = donations.filter((d) => {
    const matchMonth = filterMonth ? d.month === filterMonth : true;
    const matchGroup = filterGroup ? d.groupId === filterGroup : true;
    return matchMonth && matchGroup;
  });

  const totalAmount = filteredDonations.reduce(
    (sum, d) => sum + (Number(d.amount) || 0),
    0
  );
  const uniqueMonths = [...new Set(donations.map((d) => d.month))];

  return (
    <div className="font-bangla space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            ডোনেশন ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-gray-500">ডোনেশন স্ট্যাটাস এবং রিপোর্ট</p>
        </div>
      </div>

      {/* --- Summary Cards --- */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Group Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">
              সর্বোচ্চ ডোনেশন (গ্রুপ)
            </p>
            {summary.topGroup ? (
              <div>
                <h3 className="text-2xl font-bold">{summary.topGroup.name}</h3>
                {summary.topGroup.description && (
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {summary.topGroup.description}
                  </p>
                )}
                <p className="text-3xl font-bold mt-2">
                  ৳ {summary.topGroup.total.toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-lg">কোনো ডেটা নেই</p>
            )}
          </div>

          {/* Total Collection Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
              মোট সংগ্রহ (ফিল্টারকৃত)
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              ৳ {totalAmount.toLocaleString()}
            </h3>
            <p className="text-xs text-green-600 mt-2 font-medium">
              {filteredDonations.length} টি ট্রানজেকশন
            </p>
          </div>

          {/* Zero Donation Groups Count */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
              ডোনেশন দেয়নি (গ্রুপ)
            </p>
            <h3 className="text-3xl font-bold text-red-500">
              {summary.zeroDonationGroups.length}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              টি গ্রুপ এখনো কোনো ডোনেশন দেয়নি
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Left Column: Donation List --- */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center text-sm">
            <span className="text-gray-500 font-medium">ফিল্টার:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">সকল মাস</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">সকল গ্রুপ</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            {(filterMonth || filterGroup) && (
              <button
                onClick={() => {
                  setFilterMonth("");
                  setFilterGroup("");
                }}
                className="text-red-500 hover:text-red-700 text-xs font-bold ml-auto px-3 py-2 bg-red-50 rounded-lg"
              >
                রিসেট
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      তারিখ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      নাম ও গ্রুপ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      মাস
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      পরিমাণ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      স্ট্যাটাস
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12 text-sm text-gray-500"
                      >
                        লোড হচ্ছে...
                      </td>
                    </tr>
                  ) : filteredDonations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12 text-sm text-gray-500"
                      >
                        কোনো তথ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                          {d.date?.toDate
                            ? d.date.toDate().toLocaleDateString("bn-BD")
                            : new Date(d.createdAt).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-800">
                            {d.userName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const group = groups.find(
                                (g) => g.id === d.groupId
                              );
                              return group ? (
                                <span title={group.description}>
                                  {group.name}{" "}
                                  {group.description && (
                                    <span className="text-gray-400">
                                      ({group.description})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-red-400">
                                  অজানা গ্রুপ ({d.groupId})
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                          {d.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-indigo-600">
                          ৳ {d.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded-full ${
                              d.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {d.status === "approved" ? "অনুমোদিত" : "অপেক্ষমান"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {d.status !== "approved" && (
                            <button
                              onClick={() => handleApprove(d.id)}
                              disabled={processingId === d.id}
                              className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                              {processingId === d.id ? "..." : "Approve"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* --- Right Column: Detailed Stats --- */}
        <div className="space-y-6">
          {/* Monthly Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
              মাসিক রিপোর্ট
            </h3>
            <div className="space-y-3">
              {Object.entries(summary.monthlyStats).length > 0 ? (
                Object.entries(summary.monthlyStats).map(([month, total]) => (
                  <div
                    key={month}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">{month}</span>
                    <span className="font-bold text-gray-800">
                      ৳ {total.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs">কোনো ডেটা নেই</p>
              )}
            </div>
          </div>

          {/* Zero Donation Groups List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
              যেসব গ্রুপ ডোনেশন দেয়নি
            </h3>
            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {summary.zeroDonationGroups.length > 0 ? (
                <ul className="space-y-2">
                  {summary.zeroDonationGroups.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center gap-2 text-sm text-gray-600 bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span>
                        <span className="font-medium">{g.name}</span>
                        {g.description && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({g.description})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-600 text-sm font-medium">
                  সবাই ডোনেশন দিয়েছে! 🎉
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
