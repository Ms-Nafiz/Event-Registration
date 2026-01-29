import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "../firebase";
import { useData } from "../contexts/DataContext";
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
import ConfirmModal from "../components/common/ConfirmModal";
import {
  CurrencyIcon,
  UsersIcon,
  ClockIcon,
  EmptyIcon,
} from "../components/common/Icons";

export default function AdminDonationListPage() {
  const { donations, groups, members, loading: dataLoading } = useData();
  const loading =
    dataLoading.donations || dataLoading.groups || dataLoading.members;
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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [filterMonth, setFilterMonth] = useState("");
  const [filterGroup, setFilterGroup] = useState("");

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary", // danger, success, primary
  });

  useEffect(() => {
    if (!dataLoading.donations && !dataLoading.groups && !dataLoading.members) {
      calculateSummaries(donations, groups, members);
    }
  }, [donations, groups, members, dataLoading]);

  const calculateSummaries = (dList, gList, mList) => {
    if (!dList || !gList || !mList) return;
    const groupTotals = {};
    const memberTotals = {};
    const monthTotals = {};
    const yearTotals = {};

    // Initialize group totals
    gList.forEach((g) => (groupTotals[g.id] = 0));

    dList.forEach((d) => {
      const status = d.status?.toLowerCase();
      if (status === "approved") {
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
      (g) => !groupTotals[g.id] || groupTotals[g.id] === 0,
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

  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "ডিলিট নিশ্চিত করুন",
      message:
        "আপনি কি নিশ্চিত যে আপনি এই ডোনেশনটি ডিলিট করতে চান? এই কাজটি আর ফেরত নেওয়া যাবে না।",
      type: "danger",
      onConfirm: async () => {
        setProcessingId(id);
        try {
          await deleteDoc(doc(db, "donations", id));
          toast.success("ডোনেশন ডিলিট করা হয়েছে!");
        } catch (error) {
          console.error("Error deleting:", error);
          toast.error("ডিলিট করা যায়নি।");
        } finally {
          setProcessingId(null);
        }
      },
    });
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
          (m) => m.id === editingDonation.memberId,
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
      (d) => d.status?.toLowerCase() !== "approved",
    );
    if (pendingDonations.length === 0)
      return toast.error("কোনো পেন্ডিং ডোনেশন নেই।");

    setConfirmConfig({
      isOpen: true,
      title: "বাল্ক অ্যাপ্রুভ নিশ্চিত করুন",
      message: `${pendingDonations.length} টি পেন্ডিং ডোনেশন একসাথে অ্যাপ্রুভ করতে চান?`,
      type: "success",
      onConfirm: async () => {
        setBulkProcessing(true);
        try {
          // Chunking into batches of 500 (Firestore limit)
          const CHUNK_SIZE = 500;
          for (let i = 0; i < pendingDonations.length; i += CHUNK_SIZE) {
            const chunk = pendingDonations.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach((d) => {
              const ref = doc(db, "donations", d.id);
              batch.update(ref, { status: "approved" });
            });
            await batch.commit();
          }

          toast.success("সব পেন্ডিং ডোনেশন অ্যাপ্রুভ করা হয়েছে!");
        } catch (err) {
          console.error(err);
          toast.error("Bulk approve failed");
        } finally {
          setBulkProcessing(false);
        }
      },
    });
  };

  const handleApprove = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: "অ্যাপ্রুভ নিশ্চিত করুন",
      message: "আপনি কি নিশ্চিত যে আপনি এই ডোনেশনটি অ্যাপ্রুভ করতে চান?",
      type: "success",
      onConfirm: async () => {
        setProcessingId(id);
        try {
          const donationRef = doc(db, "donations", id);
          await updateDoc(donationRef, {
            status: "approved",
          });

          toast.success("ডোনেশন অ্যাপ্রুভ করা হয়েছে!");
        } catch (error) {
          console.error("Error approving:", error);
          toast.error("অ্যাপ্রুভ করা যায়নি।");
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const parseMonth = (monthStr) => {
    if (!monthStr) return new Date(0);
    const months = [
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
    const parts = monthStr.split(" ");
    if (parts.length !== 2) return new Date(0);
    const mIdx = months.indexOf(parts[0]);
    return new Date(parts[1], mIdx);
  };

  const sortedMonths = useMemo(() => {
    if (!donations) return [];
    return [...new Set(donations.map((d) => d.month))]
      .filter(Boolean)
      .sort((a, b) => parseMonth(b) - parseMonth(a));
  }, [donations]);

  const lastTwoMonths = sortedMonths.slice(0, 2);

  const filteredDonations = useMemo(() => {
    if (!donations) return [];
    return donations.filter((d) => {
      const matchMonth = filterMonth
        ? d.month === filterMonth
        : lastTwoMonths.includes(d.month);
      const matchGroup = filterGroup ? d.groupId === filterGroup : true;
      return matchMonth && matchGroup;
    });
  }, [donations, filterMonth, filterGroup, lastTwoMonths]);

  const totalAmount = filteredDonations.reduce(
    (sum, d) =>
      sum +
      (d.status?.toLowerCase() === "approved" ? Number(d.amount) || 0 : 0),
    0,
  );

  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDonations.slice(start, start + pageSize);
  }, [filteredDonations, currentPage]);

  const totalPages = Math.ceil(filteredDonations.length / pageSize);

  const uniqueMonths = sortedMonths;

  return (
    <div className="font-bangla min-h-screen bg-slate-50 p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-10 text-center md:text-left">
        <div className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full animate-fade-in">
          ম্যানেজমেন্ট ড্যাশবোর্ড
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight animate-fade-in animate-delay-100">
          ডোনেশন{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            তালিকা
          </span>
        </h1>
        <p className="mt-3 text-lg text-slate-500 font-medium animate-fade-in animate-delay-200">
          আপনার ইভেন্টের সকল ডোনেশন সংগ্রহ ও পরিসংখ্যান এখানে দেখুন।
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* Top Summaries: Performers & Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              {/* Top Member */}
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">
                    🏆 শীর্ষ দাতা (সদস্য)
                  </p>
                  {summary.topMember ? (
                    <>
                      <h4 className="text-xl font-black truncate">
                        {summary.topMember.name}
                      </h4>
                      <p className="text-3xl font-black mt-2">
                        ৳{summary.topMember.total.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xl font-bold opacity-50">N/A</p>
                  )}
                </div>
              </div>

              {/* Top Group */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-200 mb-1">
                    🚩 শীর্ষ গ্রুপ
                  </p>
                  {summary.topGroup ? (
                    <>
                      <h4 className="text-xl font-black truncate">
                        {summary.topGroup.name}
                      </h4>
                      <p className="text-3xl font-black mt-2">
                        ৳{summary.topGroup.total.toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xl font-bold opacity-50">N/A</p>
                  )}
                </div>
              </div>

              {/* Participation */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    অংশগ্রহণ হার
                  </p>
                  <span className="text-lg font-black text-slate-800">
                    {(
                      (summary.participation.donated /
                        (summary.participation.total || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(summary.participation.donated / (summary.participation.total || 1)) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold">
                  {summary.participation.donated} /{" "}
                  {summary.participation.total} সদস্য দান করেছেন
                </p>
              </div>
            </div>

            {/* Monthly Donation Summary Row */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs flex items-center gap-2">
                  <span className="w-2 h-4 bg-indigo-600 rounded-full"></span>
                  মাসিক ডোনেশন সামারি
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(summary.monthlyStats)
                  .sort((a, b) => parseMonth(b[0]) - parseMonth(a[0]))
                  .slice(0, 6)
                  .map(([month, total]) => (
                    <div
                      key={month}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {month}
                      </p>
                      <p className="text-lg font-black text-slate-800 mt-1">
                        ৳{total.toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Collection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    নির্বাচিত সংগ্রহ
                  </p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">
                    ৳{totalAmount.toLocaleString()}
                  </h3>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    পেন্ডিং ডোনেশন
                  </p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">
                    {
                      filteredDonations.filter(
                        (d) => d.status?.toLowerCase() !== "approved",
                      ).length
                    }
                  </h3>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-indigo-500">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    মোট ট্রানজেকশন
                  </p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">
                    {filteredDonations.length}
                  </h3>
                </div>
              </div>
              {/* Search & Actions Bar */}
              <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-lg border border-white/50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex shrink-0">
                    <select
                      value={filterMonth}
                      onChange={(e) => {
                        setFilterMonth(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-4 pr-10 py-2.5 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">শেষ ২ মাস</option>
                      {uniqueMonths.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex shrink-0">
                    <select
                      value={filterGroup}
                      onChange={(e) => {
                        setFilterGroup(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-4 pr-10 py-2.5 bg-slate-50 border-0 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="">সকল গ্রুপ</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={
                      bulkProcessing ||
                      !filteredDonations.some(
                        (d) => d.status?.toLowerCase() !== "approved",
                      )
                    }
                    className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all duration-300 shadow-md flex items-center gap-2 ${
                      filteredDonations.some(
                        (d) => d.status?.toLowerCase() !== "approved",
                      )
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-200 hover:scale-105 active:scale-95"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {bulkProcessing ? "প্রসেসিং..." : "সব অ্যাপ্রুভ করুন"}
                  </button>
                </div>
              </div>

              {/* Premium Table Card */}
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="group px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          তারিখ
                        </th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          সদস্য ও গ্রুপ
                        </th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                          পরিমাণ
                        </th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">
                          স্ট্যাটাস
                        </th>
                        <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">
                          অ্যাকশন
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <tr key={i} className="animate-pulse">
                            <td
                              colSpan="5"
                              className="px-8 py-6 h-16 bg-slate-50/20"
                            ></td>
                          </tr>
                        ))
                      ) : paginatedDonations.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                              <EmptyIcon />
                              <p className="text-sm font-bold text-slate-500">
                                এই সময়ে কোনো ডোনেশন তথ্য নেই!
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedDonations.map((d) => (
                          <tr
                            key={d.id}
                            className="group hover:bg-slate-50/50 transition-colors duration-200"
                          >
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-600 bg-slate-100/50 px-3 py-1 rounded-lg">
                                {d.date?.toDate
                                  ? d.date.toDate().toLocaleDateString("bn-BD")
                                  : new Date(d.createdAt).toLocaleDateString(
                                      "bn-BD",
                                    )}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800">
                                  {d.userName}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">
                                    {groups.find((g) => g.id === d.groupId)
                                      ?.name || "N/A"}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    ID: {d.memberDisplayId || d.memberId}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className="text-lg font-black text-indigo-600 tracking-tight">
                                ৳{d.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  d.status?.toLowerCase() === "approved"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
                                }`}
                              >
                                {d.status?.toLowerCase() === "approved"
                                  ? "অনুমোদিত"
                                  : "অপেক্ষমান"}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                {d.status?.toLowerCase() !== "approved" && (
                                  <button
                                    onClick={() => handleApprove(d.id)}
                                    className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200 hover:scale-110 active:scale-90 transition-transform"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditClick(d)}
                                  className="w-8 h-8 flex items-center justify-center bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200 hover:scale-110 active:scale-90 transition-transform"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => handleDelete(d.id)}
                                  className="w-8 h-8 flex items-center justify-center bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 hover:scale-110 active:scale-90 transition-transform"
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400">
                      পৃষ্ঠা {currentPage} (মোট {totalPages})
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        পূর্ববর্তী
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                      >
                        পরবর্তী
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
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
                              (m) => m.id === editingDonation.memberId,
                            ).name
                          } (${
                            members.find(
                              (m) => m.id === editingDonation.memberId,
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
                  <option value="pending">Pending</option>
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
      {/* Custom Confirmation Modal */}
      <ConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
