import { useState, useMemo, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { useData } from "../contexts/DataContext";
import toast from "react-hot-toast";

// parseMonth was here but unused now since generateMonths handles order

const generateMonths = () => {
  const startMonth = 7; // August (0-indexed)
  const startYear = 2025;
  const current = new Date();
  const currentYear = current.getFullYear();
  const currentMonth = current.getMonth();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const results = [];
  let y = startYear;
  let m = startMonth;

  while (y < currentYear || (y === currentYear && m <= currentMonth)) {
    results.push(`${monthNames[m]} ${y}`);
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return results.reverse(); // Newest first
};

export default function PublicDonationReportPage() {
  const { groups, members, loading: dataLoading } = useData();
  const [memberId, setMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");

  const [visitCount, setVisitCount] = useState(0);

  // Visit Counter Logic
  useEffect(() => {
    const statsRef = doc(db, "metadata", "public_donation_stats");

    // 1. Increment count if not already counted in this session
    const incrementStats = async () => {
      try {
        const sessionKey = "has_visited_donation_report";
        if (!sessionStorage.getItem(sessionKey)) {
          await setDoc(statsRef, { visitCount: increment(1) }, { merge: true });
          sessionStorage.setItem(sessionKey, "true");
        }
      } catch (error) {
        console.error("Error updating visit count:", error);
      }
    };

    incrementStats();

    // 2. Listen for real-time updates to the count
    const unsub = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setVisitCount(docSnap.data().visitCount || 0);
      }
    });

    return () => unsub();
  }, []);

  const fetchDonations = async (e) => {
    if (e) e.preventDefault();
    const searchId = memberId.trim();
    if (!searchId) return toast.error("অনুগ্রহ করে আইডি লিখুন");

    if (dataLoading?.members) {
      return toast.error(
        "সার্ভার থেকে মেম্বার তথ্য লোড হচ্ছে, একটু অপেক্ষা করুন",
      );
    }

    setLoading(true);
    setHasSearched(true);
    try {
      // 1. Find matching members from DataContext members list
      const matchingMemberIds = new Set();
      let foundMemberName = "";
      let foundMemberDisplayId = "";
      let foundGroupId = "";

      const normalizedSearch = searchId.toLowerCase();

      // We look at all members in context for matches
      (members || []).forEach((m) => {
        const mId = String(m.uniqueId || "").toLowerCase();
        const mDispId = String(m.displayId || "").toLowerCase();
        const fId = String(m.id || "").toLowerCase();

        // Check for exact match
        const isExact =
          mId === normalizedSearch ||
          mDispId === normalizedSearch ||
          fId === normalizedSearch;

        // Check for "ends with -ID" (e.g., search "123" matches "G3-123")
        const isSuffix =
          mId.endsWith("-" + normalizedSearch) ||
          mDispId.endsWith("-" + normalizedSearch);

        if (isExact || isSuffix) {
          // Add all possible ID representations to search donations
          if (m.uniqueId) matchingMemberIds.add(m.uniqueId);
          if (m.id) matchingMemberIds.add(m.id);
          if (m.displayId) matchingMemberIds.add(m.displayId);

          // Prefer the first found member's info for the header
          if (!foundMemberName) {
            foundMemberName = m.userName || m.name;
            foundMemberDisplayId = m.displayId || m.uniqueId;
            foundGroupId = m.groupid || m.groupId;
          }
        }
      });

      // Also add the raw search ID itself just in case it's stored directly
      matchingMemberIds.add(searchId);

      // 2. Fetch donations for all matching member IDs
      const donationsRef = collection(db, "donations");
      const idList = Array.from(matchingMemberIds).filter(Boolean);

      if (idList.length === 0) {
        setDonations([]);
        setMemberInfo(null);
        setLoading(false);
        return;
      }

      // Firestore 'in' query supports up to 30 values
      const batches = [];
      const batchSize = 30;
      for (let i = 0; i < idList.length; i += batchSize) {
        const chunk = idList.slice(i, i + batchSize);

        // Search in memberId field
        const q1 = query(
          donationsRef,
          where("memberId", "in", chunk),
          where("status", "==", "approved"),
        );
        batches.push(getDocs(q1));

        // Fallback: also search in memberDisplayId field if some donations use that
        const q2 = query(
          donationsRef,
          where("memberDisplayId", "in", chunk),
          where("status", "==", "approved"),
        );
        batches.push(getDocs(q2));
      }

      const snapshots = await Promise.all(batches);
      let allDonations = [];
      const seenDocIds = new Set();

      snapshots.forEach((snap) => {
        snap.forEach((doc) => {
          if (!seenDocIds.has(doc.id)) {
            allDonations.push({ id: doc.id, ...doc.data() });
            seenDocIds.add(doc.id);
          }
        });
      });

      // Sort by date desc
      allDonations.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.date?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setDonations(allDonations);

      if (allDonations.length > 0) {
        // Update member info from the actual donations if available, else from member search
        const firstDonation = allDonations[0];
        setMemberInfo({
          userName: firstDonation.userName || foundMemberName,
          memberDisplayId:
            firstDonation.memberDisplayId || foundMemberDisplayId,
          groupName:
            groups.find((g) => g.id === (firstDonation.groupId || foundGroupId))
              ?.name || "N/A",
        });
      } else {
        // If they have no donations yet, still show their info if we found the member
        setMemberInfo({
          userName: foundMemberName,
          memberDisplayId: foundMemberDisplayId,
          groupName: groups.find((g) => g.id === foundGroupId)?.name || "N/A",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("ডাটা আনতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const years = useMemo(() => {
    const ySet = new Set();
    donations.forEach((d) => {
      if (d.month) {
        const parts = d.month.split(" ");
        if (parts.length === 2) ySet.add(parts[1]);
      }
    });
    return ["All", ...Array.from(ySet).sort((a, b) => b - a)];
  }, [donations]);

  const months = [
    "All",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const filteredDonations = useMemo(() => {
    const allMonths = generateMonths();
    const results = [];

    allMonths.forEach((month) => {
      const matchYear = filterYear === "All" || month.includes(filterYear);
      const matchMonth = filterMonth === "All" || month.includes(filterMonth);

      if (matchYear && matchMonth) {
        const actualDonations = donations.filter((d) => d.month === month);
        if (actualDonations.length > 0) {
          actualDonations.forEach((d) =>
            results.push({ ...d, isVirtual: false }),
          );
        } else {
          results.push({
            id: `virtual-${month}`,
            month,
            amount: 0,
            isVirtual: true,
            status: "virtual",
          });
        }
      }
    });

    return results;
  }, [donations, filterYear, filterMonth]);

  const totalAmount = useMemo(() => {
    return filteredDonations.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0,
    );
  }, [filteredDonations]);

  const monthlySummary = useMemo(() => {
    const allMonths = generateMonths();
    const summaryMap = {};

    // Initialize all months with 0
    allMonths.forEach((m) => {
      summaryMap[m] = 0;
    });

    // Add actual donations
    donations.forEach((d) => {
      // Only count approved donations in the summaryMap if they fall within our generated months
      if (
        d.month &&
        Object.prototype.hasOwnProperty.call(summaryMap, d.month)
      ) {
        summaryMap[d.month] += Number(d.amount) || 0;
      }
    });

    // Convert to entries and sort chronologically (already handled by generateMonths being reversed)
    // However, if we want to honor year/month filters, we should filter the summary
    return allMonths
      .map((m) => [m, summaryMap[m]])
      .filter(([m]) => {
        const matchYear = filterYear === "All" || m.includes(filterYear);
        const matchMonth = filterMonth === "All" || m.includes(filterMonth);
        return matchYear && matchMonth;
      });
  }, [donations, filterYear, filterMonth]);

  const yearlySummary = useMemo(() => {
    const summary = {};
    filteredDonations.forEach((d) => {
      const year = d.month?.split(" ")[1];
      if (year) {
        if (!summary[year]) summary[year] = 0;
        summary[year] += Number(d.amount) || 0;
      }
    });
    return Object.entries(summary).sort((a, b) => b[0] - a[0]);
  }, [filteredDonations]);

  return (
    <div className="min-h-screen bg-slate-50 font-bangla pb-20">
      {/* Header */}
      <div className="bg-indigo-700 text-white pt-16 pb-32 px-6 text-center">
        <div className="inline-block px-6 py-2 bg-amber-400 text-indigo-900 rounded-2xl font-black mb-6 shadow-lg shadow-amber-400/20 animate-bounce-subtle">
          <span className="text-2xl md:text-3xl tracking-wide">
            হরকরা ফাউন্ডেশন
          </span>
        </div>
        <h1 className="text-3xl font-black mb-4">ডোনেশন রিপোর্ট চেক করুন</h1>
        <p className="opacity-90 max-w-lg mx-auto font-medium text-lg">
          মেম্বার আইডি দিয়ে সহজেই আপনার ডোনেশন রেকর্ড খুঁজে নিন
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20">
        {/* Search Box */}
        <div className="space-y-4">
          <form
            onSubmit={fetchDonations}
            className="bg-white p-2 rounded-3xl shadow-2xl flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="আইডি দিন (যেমন: 123 অথবা G3-123)"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="flex-1 bg-transparent px-6 py-4 outline-none text-lg font-bold text-slate-700 placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {loading ? "খোঁজা হচ্ছে..." : "সার্চ করুন"}
            </button>
          </form>

          <div className="flex items-center gap-2 justify-center text-sm font-bold text-slate-500 animate-fade-in">
            <span className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-[10px]">
              💡
            </span>
            <span>
              টিপস: জেনারেশন কোড (যেমন: G3-) ছাড়াই শুধু আইডি নাম্বার দিয়ে সার্চ
              করতে পারেন।
            </span>
          </div>
        </div>

        {hasSearched && !loading && donations.length === 0 && (
          <div className="bg-white p-12 rounded-3xl text-center shadow-lg border border-slate-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              কোনো ডাটা পাওয়া যায়নি
            </h3>
            <p className="text-slate-500">
              আপনার আইডিটি সঠিক কিনা পুনরায় যাচাই করুন
            </p>
          </div>
        )}

        {donations.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Member Info Card */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full">
                  মেম্বার ইনফো
                </span>
                <h2 className="text-3xl font-black text-slate-800 mt-2">
                  {memberInfo?.userName}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <p className="text-slate-500 font-bold">
                    ID:{" "}
                    <span className="text-slate-800">
                      {memberInfo?.memberDisplayId || memberId}
                    </span>
                  </p>
                  <p className="text-slate-500 font-bold">
                    Group:{" "}
                    <span className="text-slate-800">
                      {memberInfo?.groupName}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-center">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">
                  মোট ডোনেশন
                </p>
                <p className="text-3xl font-black">
                  ৳
                  {donations
                    .reduce((s, d) => s + (Number(d.amount) || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>

            {/* Filters & Export (Visual only for now) */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="flex-1 md:flex-none border-none outline-none text-sm font-bold text-slate-600 px-4 py-2 bg-transparent"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y === "All" ? "সকল বছর" : y}
                    </option>
                  ))}
                </select>
                <div className="w-px h-6 bg-slate-200"></div>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="flex-1 md:flex-none border-none outline-none text-sm font-bold text-slate-600 px-4 py-2 bg-transparent"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m === "All" ? "সকল মাস" : m}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-sm font-bold text-slate-500 italic">
                ফিল্টারড রেজাল্ট:{" "}
                <span className="text-indigo-600">
                  {filteredDonations.length}
                </span>{" "}
                ট্রানজেকশন
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year wise Summary */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span>📅</span> বছর ভিত্তিক সামারি
                </h3>
                <div className="space-y-3">
                  {yearlySummary.map(([year, amount]) => (
                    <div
                      key={year}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <span className="font-bold text-slate-600">{year}</span>
                      <span className="font-black text-slate-800">
                        ৳{amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Month wise Summary */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span>📊</span> মাস ভিত্তিক সামারি
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {monthlySummary.map(([m, amount]) => (
                    <div
                      key={m}
                      className={`flex items-center justify-between p-3 rounded-xl ${amount > 0 ? "bg-indigo-50/50 border border-indigo-100" : "bg-slate-50 opacity-60"}`}
                    >
                      <span
                        className={`font-bold text-sm ${amount > 0 ? "text-indigo-700" : "text-slate-500"}`}
                      >
                        {m}
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-black ${amount > 0 ? "text-indigo-900" : "text-slate-400"}`}
                        >
                          {amount > 0 ? `৳${amount.toLocaleString()}` : "৳০"}
                        </span>
                        {amount === 0 && (
                          <span className="ml-2 text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
                            অপরিশোধিত
                          </span>
                        )}
                        {amount > 0 && (
                          <span className="ml-2 text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
                            পরিশোধিত
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {monthlySummary.length === 0 && (
                    <p className="text-slate-400 italic text-center py-4">
                      কোনো ডাটা নেই
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed History Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-black text-slate-800 text-lg">
                  বিস্তারিত লেনদেন
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                        তারিখ
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                        মাস
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                        পরিমাণ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredDonations.map((d) => (
                      <tr
                        key={d.id}
                        className={`hover:bg-slate-50/50 transition-colors ${d.isVirtual ? "opacity-50" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-bold">
                          {d.isVirtual ? (
                            <span className="text-slate-400 italic">N/A</span>
                          ) : d.date?.toDate?.() ? (
                            d.date.toDate().toLocaleDateString("bn-BD")
                          ) : d.createdAt ? (
                            new Date(d.createdAt).toLocaleDateString("bn-BD")
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 italic">
                          {d.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black">
                          <div className="flex flex-col items-end">
                            <span
                              className={
                                d.amount > 0
                                  ? "text-slate-800"
                                  : "text-slate-400"
                              }
                            >
                              ৳{d.amount.toLocaleString()}
                            </span>
                            {d.isVirtual && (
                              <span className="text-[10px] text-rose-400 font-bold uppercase">
                                অপরিশোধিত
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-4 text-right text-sm font-black text-slate-500 uppercase"
                      >
                        ফিল্টারড মোট
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-indigo-700">
                        ৳{totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visitor Counter Footer */}
      <div className="max-w-4xl mx-auto px-6 mt-12 pb-8 border-t border-slate-200">
        <div className="flex items-center justify-center gap-2 text-slate-400 font-bold py-6">
          <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs">
            👥
          </span>
          <span className="text-sm">
            মোট ভিজিটর: <span className="text-indigo-600">{visitCount}</span>
          </span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
