import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import Select from "react-select";
import toast from "react-hot-toast";

export default function AdminDonationListPage() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Summary States
  const [summary, setSummary] = useState({
    topGroup: null,
    topMember: null,
    participation: { donated: 0, total: 0 },
    zeroDonationGroups: [],
    nonDonatingMembers: [],
    monthlyStats: [],
    yearlyStats: [],
  });

  const [members, setMembers] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Donations
      const dQuery = query(
        collection(db, "donations"),
        orderBy("date", "desc")
      );
      const dSnapshot = await getDocs(dQuery);
      const dList = dSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDonations(dList);

      // 2. Fetch Groups
      const gSnapshot = await getDocs(collection(db, "groups"));
      const gList = gSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(gList);

      // 3. Fetch Members
      const mSnapshot = await getDocs(collection(db, "members"));
      const mList = mSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMembers(mList);

      // 4. Calculate Summaries
      calculateSummaries(dList, gList, mList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateSummaries = (dList, gList, mList) => {
    const groupTotals = {};
    const memberTotals = {};
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

        // Member Total
        if (d.memberId) {
          memberTotals[d.memberId] = (memberTotals[d.memberId] || 0) + amount;
        }

        // Monthly Total
        if (d.month) {
          monthTotals[d.month] = (monthTotals[d.month] || 0) + amount;
        }

        // Yearly Total
        const dateObj = d.date?.toDate
          ? d.date.toDate()
          : new Date(d.createdAt);
        const year = dateObj.getFullYear();
        yearTotals[year] = (yearTotals[year] || 0) + amount;
      }
    });

    // Top Group
    let topGroupId = null;
    let maxGroupAmount = -1;
    Object.entries(groupTotals).forEach(([gid, amount]) => {
      if (amount > maxGroupAmount) {
        maxGroupAmount = amount;
        topGroupId = gid;
      }
    });
    const topGroup = gList.find((g) => g.id === topGroupId);

    // Top Member
    let topMemberId = null;
    let maxMemberAmount = -1;
    Object.entries(memberTotals).forEach(([mid, amount]) => {
      if (amount > maxMemberAmount) {
        maxMemberAmount = amount;
        topMemberId = mid;
      }
    });
    const topMember = mList.find((m) => m.id === topMemberId);

    // Zero Donation Groups
    const zeroGroups = gList.filter(
      (g) => !groupTotals[g.id] || groupTotals[g.id] === 0
    );

    // Non-Donating Members
    const nonDonatingMembers = mList.filter((m) => !memberTotals[m.id]);

    setSummary({
      topGroup: topGroup ? { ...topGroup, total: maxGroupAmount } : null,
      topMember: topMember ? { ...topMember, total: maxMemberAmount } : null,
      participation: {
        donated: Object.keys(memberTotals).length,
        total: mList.length,
      },
      zeroDonationGroups: zeroGroups,
      nonDonatingMembers: nonDonatingMembers,
      monthlyStats: monthTotals,
      yearlyStats: yearTotals,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("আপনি কি নিশ্চিত যে আপনি এই ডোনেশনটি ডিলিট করতে চান?")) return;
    setProcessingId(id);
    try {
      await deleteDoc(doc(db, "donations", id));
      const updatedList = donations.filter((d) => d.id !== id);
      setDonations(updatedList);
      calculateSummaries(updatedList, groups, members);
      toast.success("ডোনেশন ডিলিট করা হয়েছে!");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("ডিলিট করা যায়নি।");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditClick = (donation) => {
    setEditingDonation({ ...donation });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingDonation) return;

    setProcessingId(editingDonation.id);
    try {
      // If member changed, find new member details
      let memberUpdates = {};
      if (editingDonation.memberId) {
        const selectedMember = members.find(
          (m) => m.id === editingDonation.memberId
        );
        if (selectedMember) {
          memberUpdates = {
            userName: selectedMember.name,
            memberDisplayId: selectedMember.displayId,
            groupId: selectedMember.groupid || editingDonation.groupId, // Use new group if available
          };
        }
      }

      const updates = {
        amount: Number(editingDonation.amount),
        month: editingDonation.month,
        status: editingDonation.status,
        memberId: editingDonation.memberId,
        ...memberUpdates,
      };

      await updateDoc(doc(db, "donations", editingDonation.id), updates);

      const updatedList = donations.map((d) =>
        d.id === editingDonation.id ? { ...d, ...updates } : d
      );
      setDonations(updatedList);
      calculateSummaries(updatedList, groups, members);

      toast.success("আপডেট সফল হয়েছে!");
      setIsEditModalOpen(false);
      setEditingDonation(null);
    } catch (error) {
      console.error("Edit error", error);
      toast.error("আপডেট করা যায়নি");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    const pendingDonations = filteredDonations.filter(
      (d) => d.status === "Pending"
    );
    if (pendingDonations.length === 0) return toast("কোনো পেন্ডিং ডোনেশন নেই।");

    if (
      !confirm(
        `${pendingDonations.length} টি পেন্ডিং ডোনেশন অ্যাপ্রুভ করতে চান?`
      )
    )
      return;

    setBulkProcessing(true);
    try {
      const batch = writeBatch(db);
      pendingDonations.forEach((d) => {
        const ref = doc(db, "donations", d.id);
        batch.update(ref, { status: "approved" });
      });
      await batch.commit();

      const updatedList = donations.map((d) =>
        pendingDonations.find((p) => p.id === d.id)
          ? { ...d, status: "approved" }
          : d
      );
      setDonations(updatedList);
      calculateSummaries(updatedList, groups, members);
      toast.success("সব পেন্ডিং ডোনেশন অ্যাপ্রুভ করা হয়েছে!");
    } catch (err) {
      console.error(err);
      toast.error("Bulk approve failed");
    } finally {
      setBulkProcessing(false);
    }
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
      calculateSummaries(updatedList, groups, members);

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
    <div className="font-bangla min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              ডোনেশন ড্যাশবোর্ড
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              সম্পূর্ণ ডোনেশন ম্যানেজমেন্ট ও রিপোর্টিং সিস্টেম
            </p>
          </div>
        </div>
      </div>

      {/* Top Stats Overview - 4 Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Collection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  মোট সংগ্রহ
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  ৳ {totalAmount.toLocaleString()}
                </h3>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">💵</span>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-bold">
              {filteredDonations.length} টি ট্রানজেকশন
            </p>
          </div>

          {/* Participation Rate */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  অংশগ্রহণ হার
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {(
                    (summary.participation.donated /
                      (summary.participation.total || 1)) *
                    100
                  ).toFixed(0)}
                  %
                </h3>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">👥</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 font-bold">
              {summary.participation.donated}/{summary.participation.total}{" "}
              সদস্য
            </p>
          </div>

          {/* Pending Count */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  পেন্ডিং
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {
                    filteredDonations.filter((d) => d.status === "Pending")
                      .length
                  }
                </h3>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">⏳</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 font-bold">
              Approval প্রয়োজন
            </p>
          </div>

          {/* Non-Donors */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  দেয়নি
                </p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">
                  {summary.nonDonatingMembers.length}
                </h3>
              </div>
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-xl">📭</span>
              </div>
            </div>
            <p className="text-xs text-red-600 font-bold">
              {summary.zeroDonationGroups.length} গ্রুপেও নেই
            </p>
          </div>
        </div>
      )}

      {/* Top Performers Section */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Top Group */}
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  সর্বোচ্চ ডোনেশন (গ্রুপ)
                </p>
              </div>
              {summary.topGroup ? (
                <>
                  <h3 className="text-2xl font-black mb-1">
                    {summary.topGroup.name}
                  </h3>
                  <p className="text-3xl font-black mt-3">
                    ৳ {summary.topGroup.total.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-white/70">কোনো ডেটা নেই</p>
              )}
            </div>
          </div>

          {/* Top Member */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  সর্বোচ্চ ডোনেশন (সদস্য)
                </p>
              </div>
              {summary.topMember ? (
                <>
                  <h3 className="text-2xl font-black mb-1">
                    {summary.topMember.name}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium mb-2">
                    ID:{" "}
                    {summary.topMember.displayId || summary.topMember.uniqueId}
                  </p>
                  <p className="text-3xl font-black">
                    ৳ {summary.topMember.total.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-white/70">কোনো ডেটা নেই</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Donation Table (Takes 3 columns) */}
        <div className="xl:col-span-3 space-y-4">
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
                className="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-2 bg-red-50 rounded-lg"
              >
                রিসেট
              </button>
            )}
          </div>

          {/* Bulk Approve Button - Separate Row */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-end">
            <button
              onClick={handleBulkApprove}
              disabled={
                bulkProcessing ||
                !filteredDonations.some((d) => d.status === "Pending")
              }
              className={`text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 ${
                filteredDonations.some((d) => d.status === "Pending")
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {bulkProcessing
                ? "প্রসেসিং..."
                : `✅ সব পেন্ডিং অ্যাপ্রুভ করুন (${
                    filteredDonations.filter((d) => d.status === "Pending")
                      .length
                  })`}
            </button>
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
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {(() => {
                              const group = groups.find(
                                (g) => g.id === d.groupId
                              );
                              return group ? (
                                <span title={group.description}>
                                  {group.name}
                                </span>
                              ) : (
                                <span className="text-red-400 italic">
                                  অজানা গ্রুপ
                                </span>
                              );
                            })()}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            {d.memberDisplayId || d.memberId}
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
                          <div className="flex justify-center gap-2">
                            {d.status !== "approved" && (
                              <button
                                onClick={() => handleApprove(d.id)}
                                disabled={processingId === d.id}
                                className="text-xs font-bold bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                title="Approve"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(d)}
                              className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                              title="Delete"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Reports - 2 Column Layout */}
        <div className="xl:col-span-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
            {/* Monthly Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <h3 className="text-sm font-black text-slate-800">
                    মাসিক রিপোর্ট
                  </h3>
                </div>
              </div>
              <div className="p-5 max-h-80 overflow-y-auto custom-scrollbar">
                {Object.entries(summary.monthlyStats).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(summary.monthlyStats).map(
                      ([month, total]) => (
                        <div
                          key={month}
                          className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group"
                        >
                          <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">
                            {month}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            ৳ {total.toLocaleString()}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl opacity-30">📭</span>
                    <p className="text-xs text-slate-400 mt-2">কোনো ডেটা নেই</p>
                  </div>
                )}
              </div>
            </div>

            {/* Non-Donating Members List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <h3 className="text-sm font-black text-slate-800">
                      ডোনেশন দেয়নি
                    </h3>
                  </div>
                  <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-black">
                    {summary.nonDonatingMembers.length}
                  </span>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {summary.nonDonatingMembers.length > 0 ? (
                  <div className="space-y-2">
                    {summary.nonDonatingMembers.map((m) => (
                      <div
                        key={m.id}
                        className="group p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm ${
                              m.gender === "Female"
                                ? "bg-pink-400"
                                : "bg-indigo-400"
                            }`}
                          >
                            {m.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                              {m.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {m.displayId || m.uniqueId}
                            </p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-5xl">�</span>
                    <p className="text-sm text-emerald-600 font-bold mt-3">
                      সব সদস্য ডোনেশন দিয়েছেন!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {isEditModalOpen && editingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">ডোনেশন এডিট করুন</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  সদস্য
                </label>
                <Select
                  options={members.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.displayId || m.uniqueId})`,
                  }))}
                  value={
                    members.find((m) => m.id === editingDonation.memberId)
                      ? {
                          value: editingDonation.memberId,
                          label: `${
                            members.find(
                              (m) => m.id === editingDonation.memberId
                            ).name
                          } (${
                            members.find(
                              (m) => m.id === editingDonation.memberId
                            ).displayId
                          })`,
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setEditingDonation({
                      ...editingDonation,
                      memberId: opt.value,
                    })
                  }
                  isDisabled
                  className="text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">
                  * সদস্য পরিবর্তন বর্তমানে বন্ধ রাখা হয়েছে
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    টাকার পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={editingDonation.amount}
                    onChange={(e) =>
                      setEditingDonation({
                        ...editingDonation,
                        amount: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    মাস
                  </label>
                  <input
                    type="text"
                    value={editingDonation.month}
                    onChange={(e) =>
                      setEditingDonation({
                        ...editingDonation,
                        month: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={editingDonation.status}
                  onChange={(e) =>
                    setEditingDonation({
                      ...editingDonation,
                      status: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingDonation.id}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
                >
                  {processingId === editingDonation.id
                    ? "সেভ হচ্ছে..."
                    : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
