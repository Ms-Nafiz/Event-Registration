import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { EntryCardDocument } from "../components/EntryCardPDF";
import QRCode from "qrcode";
import React from "react";

// Deferred PDF component to prevent re-renders on every page action
const DeferredPDFDownload = React.memo(({ reg }) => {
  const [ready, setReady] = React.useState(false);

  if (!ready) {
    return (
      <button
        onClick={() => setReady(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
      >
        <span>⬇</span> PDF
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <EntryCardDocument
          data={{
            ...reg,
            groupName: reg.finalGroupName,
            totalMembers: reg.finalTotalMembers,
          }}
          qrCodeUrl={reg.qrCodeUrl}
        />
      }
      fileName={`card-${reg.registrationId || reg.id}.pdf`}
    >
      {({ loading, url, error, blob }) => {
        if (loading) {
          return (
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-400">
              ...
            </button>
          );
        }
        return (
          <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
            <span>✅</span> ডাউনলোড
          </button>
        );
      }}
    </PDFDownloadLink>
  );
});

// Mobile version of the same optimization
const DeferredPDFDownloadMobile = React.memo(({ reg }) => {
  const [ready, setReady] = React.useState(false);

  if (!ready) {
    return (
      <button
        onClick={() => setReady(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
      >
        কার্ড ডাউনলোড করুন
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <EntryCardDocument
          data={{
            ...reg,
            groupName: reg.finalGroupName,
            totalMembers: reg.finalTotalMembers,
          }}
          qrCodeUrl={reg.qrCodeUrl}
        />
      }
      fileName={`card-${reg.registrationId || reg.id}.pdf`}
    >
      {({ loading }) => (
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform">
          {loading ? "প্রসেসিং..." : "✅ ডাউনলোড শুরু করুন"}
        </button>
      )}
    </PDFDownloadLink>
  );
});

export default function RegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [groups, setGroups] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(null);

  // Modals visibility
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditRegModal, setShowEditRegModal] = useState(false);

  // Form states
  const [editFormData, setEditFormData] = useState({
    member_name: "",
    gender: "",
    age: "",
    t_shirt_size: "",
  });
  const [addMemberFormData, setAddMemberFormData] = useState({
    member_name: "",
    gender: "Male",
    age: "",
    t_shirt_size: "L",
  });
  const [editRegFormData, setEditRegFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    contributeAmount: "",
  });
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsList = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(groupsList);

        const groupsMap = {};
        groupsList.forEach((group) => {
          groupsMap[group.id] = group.name;
        });

        const q = query(
          collection(db, "registrations"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          const groupNameResolve =
            docData.groupName || groupsMap[docData.group_id] || "N/A";
          const totalMemResolve =
            docData.totalMembers || docData.total_members || 0;

          return {
            ...docData, // ✅ প্রথমে docData spread করা
            firebaseDocId: doc.id, // ✅ Firebase doc ID আলাদা field এ
            registrationId: docData.id, // ✅ Custom HF-xxxxx ID
            finalGroupName: groupNameResolve,
            finalTotalMembers: totalMemResolve,
          };
        });

        const dataWithQR = await Promise.all(
          data.map(async (item) => {
            // ✅ Custom HF-xxxxx ID দিয়ে QR code তৈরি
            const qrUrl = await QRCode.toDataURL(
              item.registrationId || item.id
            );
            return { ...item, qrCodeUrl: qrUrl };
          })
        );

        setRegistrations(dataWithQR);
      } catch {
        toast.error("ডেটা লোড করা যায়নি");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Open edit modal
  const openEditModal = (reg, memberIndex) => {
    setSelectedReg(reg);
    setSelectedMemberIndex(memberIndex);
    const member = reg.members[memberIndex];
    setEditFormData({
      member_name: member.member_name || "",
      gender: member.gender || "",
      age: member.age || "",
      t_shirt_size: member.t_shirt_size || "",
    });
    setShowEditModal(true);
  };

  // Handle edit member
  const handleEditMember = async () => {
    try {
      const updatedMembers = [...selectedReg.members];
      updatedMembers[selectedMemberIndex] = editFormData;

      const updateData = {
        members: updatedMembers,
      };

      if (selectedMemberIndex === 0) {
        updateData.name = editFormData.member_name;
      }

      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
      await updateDoc(regRef, updateData);

      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? {
                ...r,
                members: updatedMembers,
                ...(selectedMemberIndex === 0 && {
                  name: editFormData.member_name,
                }),
              }
            : r
        )
      );

      toast.success("সদস্য সফলভাবে আপডেট করা হয়েছে!");
      setShowEditModal(false);
    } catch (error) {
      console.error(error);
      toast.error("আপডেট ব্যর্থ হয়েছে।");
    }
  };

  // Open Add Member Modal
  const openAddMemberModal = (reg) => {
    setSelectedReg(reg);
    setAddMemberFormData({
      member_name: "",
      gender: "Male",
      age: "",
      t_shirt_size: "L",
    });
    setShowAddMemberModal(true);
  };

  // Handle Add Member
  const handleAddMember = async () => {
    try {
      if (!addMemberFormData.member_name) {
        toast.error("সদস্যের নাম আবশ্যক");
        return;
      }

      const updatedMembers = [
        ...(selectedReg.members || []),
        addMemberFormData,
      ];
      const newTotalMembers = updatedMembers.length;

      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
      await updateDoc(regRef, {
        members: updatedMembers,
        totalMembers: newTotalMembers,
      });

      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? {
                ...r,
                members: updatedMembers,
                totalMembers: newTotalMembers,
                finalTotalMembers: newTotalMembers,
              }
            : r
        )
      );

      toast.success("নতুন সদস্য যুক্ত করা হয়েছে!");
      setShowAddMemberModal(false);
    } catch (error) {
      console.error(error);
      toast.error("সদস্য যুক্ত করতে সমস্যা হয়েছে।");
    }
  };

  // Open Edit Registration Modal
  const openEditRegModal = (reg) => {
    setSelectedReg(reg);
    setEditRegFormData({
      name: reg.name || "",
      mobile: reg.mobile || "",
      email: reg.email || "",
      contributeAmount: reg.contributeAmount || "",
    });
    setShowEditRegModal(true);
  };

  // Handle Edit Registration
  const handleEditRegistration = async () => {
    try {
      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);

      // Update main registration data
      const updateData = {
        name: editRegFormData.name,
        mobile: editRegFormData.mobile,
        email: editRegFormData.email,
        contributeAmount: editRegFormData.contributeAmount,
      };

      // Also update the name of the first member if it exists
      let updatedMembers = [...(selectedReg.members || [])];
      if (updatedMembers.length > 0) {
        updatedMembers[0] = {
          ...updatedMembers[0],
          member_name: editRegFormData.name,
        };
        updateData.members = updatedMembers;
      }

      await updateDoc(regRef, updateData);

      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? {
                ...r,
                ...updateData,
              }
            : r
        )
      );

      toast.success("রেজিস্ট্রেশন তথ্য সফলভাবে আপডেট করা হয়েছে!");
      setShowEditRegModal(false);
    } catch (error) {
      console.error(error);
      toast.error("আপডেট ব্যর্থ হয়েছে।");
    }
  };

  // Open delete modal
  const openDeleteModal = (reg, memberIndex) => {
    setSelectedReg(reg);
    setSelectedMemberIndex(memberIndex);
    setShowDeleteModal(true);
  };

  // Open payment modal
  const openPaymentModal = (reg) => {
    setSelectedReg(reg);
    setShowPaymentModal(true);
  };

  // Handle payment status update
  const handlePaymentStatusUpdate = async (newStatus) => {
    try {
      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
      await updateDoc(regRef, {
        paymentStatus: newStatus,
      });

      // Update local state
      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? { ...r, paymentStatus: newStatus }
            : r
        )
      );

      toast.success(
        newStatus === "Paid"
          ? "পেমেন্ট সফলভাবে পরিশোধিত হিসেবে চিহ্নিত করা হয়েছে!"
          : newStatus === "Waived"
          ? "পেমেন্ট মওকুফ হিসেবে চিহ্নিত করা হয়েছে!"
          : "পেমেন্ট অপেক্ষমান হিসেবে চিহ্নিত করা হয়েছে!"
      );
      setShowPaymentModal(false);
    } catch (error) {
      console.error(error);
      toast.error("আপডেট ব্যর্থ হয়েছে।");
    }
  };

  // Open group modal
  const openGroupModal = (reg) => {
    setSelectedReg(reg);
    setSelectedGroupId(reg.group_id || "");
    setShowGroupModal(true);
  };

  // Handle group update
  const handleGroupUpdate = async () => {
    try {
      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
      await updateDoc(regRef, {
        group_id: selectedGroupId,
      });

      const updatedGroupName =
        groups.find((g) => g.id === selectedGroupId)?.name || "N/A";

      // Update local state
      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? {
                ...r,
                group_id: selectedGroupId,
                finalGroupName: updatedGroupName,
              }
            : r
        )
      );

      toast.success("গ্রুপ সফলভাবে আপডেট করা হয়েছে!");
      setShowGroupModal(false);
    } catch (error) {
      console.error(error);
      toast.error("গ্রুপ আপডেট ব্যর্থ হয়েছে।");
    }
  };

  // Handle Toggle Check-in
  const handleToggleCheckIn = async (reg) => {
    const isConfirm = window.confirm(
      reg.checkedIn
        ? `আপনি কি ${reg.name}-এর চেক-ইন বাতিল করতে চান?`
        : `আপনি কি ${reg.name}-কে চেক-ইন করাতে চান?`
    );

    if (!isConfirm) return;

    try {
      const newStatus = !reg.checkedIn;
      const regRef = doc(db, "registrations", reg.firebaseDocId);

      await updateDoc(regRef, {
        checkedIn: newStatus,
        checkInTime: newStatus ? new Date() : null,
      });

      // Update local state
      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === reg.firebaseDocId
            ? {
                ...r,
                checkedIn: newStatus,
                checkInTime: newStatus ? new Date() : null,
              }
            : r
        )
      );

      toast.success(
        newStatus
          ? `${reg.name} সফলভাবে চেক-ইন করা হয়েছে!`
          : `${reg.name} চেক-ইন বাতিল করা হয়েছে!`
      );
    } catch (error) {
      console.error(error);
      toast.error("চেক-ইন স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।");
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    try {
      // ✅ If deleting main member (index 0), delete entire registration
      if (selectedMemberIndex === 0) {
        const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
        await deleteDoc(regRef);

        // Remove from local state
        setRegistrations(
          registrations.filter(
            (r) => r.firebaseDocId !== selectedReg.firebaseDocId
          )
        );

        toast.success("মূল সদস্য এবং সকল তথ্য মুছে ফেলা হয়েছে!");
        setShowDeleteModal(false);
        return;
      }

      // ✅ For other members, just remove from array
      const updatedMembers = selectedReg.members.filter(
        (_, idx) => idx !== selectedMemberIndex
      );
      const newTotalMembers = updatedMembers.length;

      const regRef = doc(db, "registrations", selectedReg.firebaseDocId);
      await updateDoc(regRef, {
        members: updatedMembers,
        totalMembers: newTotalMembers,
      });

      // Update local state
      setRegistrations(
        registrations.map((r) =>
          r.firebaseDocId === selectedReg.firebaseDocId
            ? {
                ...r,
                members: updatedMembers,
                totalMembers: newTotalMembers,
                finalTotalMembers: newTotalMembers,
              }
            : r
        )
      );

      toast.success("সদস্য সফলভাবে মুছে ফেলা হয়েছে!");
      setShowDeleteModal(false);
    } catch (error) {
      console.error(error);
      toast.error("ডিলিট ব্যর্থ হয়েছে।");
    }
  };

  // Filter logic
  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.mobile.includes(searchTerm) ||
      (reg.finalGroupName &&
        reg.finalGroupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 font-bangla max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            রেজিস্ট্রেশন তালিকা
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-3">
            <span>মোট রেজিস্ট্রেশন: {filteredRegistrations.length}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>
              মোট সদস্য:{" "}
              {filteredRegistrations.reduce(
                (acc, reg) => acc + (reg.finalTotalMembers || 0),
                0
              )}
            </span>
          </p>
        </div>

        {/* Actions & Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/admin/bulk-registration"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition shadow-sm"
          >
            <span>📁</span> বাল্ক আপলোড
          </Link>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="নাম, মোবাইল বা গ্রুপ খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">ডেটা লোড হচ্ছে...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            কোনো তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      প্রতিনিধি
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      গ্রুপ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      সদস্য
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      অতিরিক্ত সদস্য
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      স্ট্যাটাস
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      এন্ট্রি
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredRegistrations.map((reg) => (
                    <>
                      <tr
                        key={reg.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {reg.name}
                            <button
                              onClick={() => openEditRegModal(reg)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                              title="তথ্য সম্পাদনা"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-xs text-gray-400">
                            {reg.mobile}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openGroupModal(reg)}
                            className="group flex items-center gap-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 py-1 px-2 rounded text-xs transition-colors"
                          >
                            <span>{reg.finalGroupName}</span>
                            <svg
                              className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                          {reg.finalTotalMembers}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {reg.members && reg.members.length > 0 ? (
                            <button
                              onClick={() =>
                                setExpandedRow(
                                  expandedRow === reg.id ? null : reg.id
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                            >
                              <span>{reg.members.length} সদস্য</span>
                              <svg
                                className={`w-3 h-3 transition-transform ${
                                  expandedRow === reg.id ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => openPaymentModal(reg)}
                            className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                              reg.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-700"
                                : reg.paymentStatus === "Waived"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {reg.paymentStatus === "Paid"
                              ? "পরিশোধিত"
                              : reg.paymentStatus === "Waived"
                              ? "মওকুফ"
                              : "অপেক্ষমান"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleCheckIn(reg)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all shadow-sm ${
                              reg.checkedIn
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {reg.checkedIn ? "✅ Entered" : "❌ No Entry"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <DeferredPDFDownload reg={reg} />
                        </td>
                      </tr>

                      {/* Expanded Member List Row */}
                      {expandedRow === reg.id && reg.members && (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-gray-600 uppercase">
                                  সদস্য তালিকা
                                </p>
                                <button
                                  onClick={() => openAddMemberModal(reg)}
                                  className="flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-[10px] font-bold transition-colors"
                                >
                                  <span>➕</span> সদস্য যুক্ত করুন
                                </button>
                              </div>
                              {reg.members.map((member, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">
                                      {member.member_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {member.gender} • {member.age} বছর •
                                      টি-শার্ট: {member.t_shirt_size}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => openEditModal(reg, idx)}
                                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      সম্পাদনা
                                    </button>
                                    <button
                                      onClick={() => openDeleteModal(reg, idx)}
                                      className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      মুছুন
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredRegistrations.map((reg) => (
                <div key={reg.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {reg.name}
                      </h3>
                      <p className="text-xs text-gray-500">{reg.mobile}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => openPaymentModal(reg)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          reg.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : reg.paymentStatus === "Waived"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {reg.paymentStatus === "Paid"
                          ? "পরিশোধিত"
                          : reg.paymentStatus === "Waived"
                          ? "মওকুফ"
                          : "অপেক্ষমান"}
                      </button>

                      <button
                        onClick={() => handleToggleCheckIn(reg)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                          reg.checkedIn
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white border-gray-200 text-gray-500"
                        }`}
                      >
                        {reg.checkedIn ? "✅ এন্ট্রি হয়েছে" : "🔘 এন্ট্রি নেই"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <div>
                      <span className="block text-gray-400 text-[10px] uppercase">
                        গ্রুপ
                      </span>
                      <span className="font-medium">{reg.finalGroupName}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400 text-[10px] uppercase">
                        সদস্য
                      </span>
                      <span className="font-bold text-gray-800">
                        {reg.finalTotalMembers} জন
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <DeferredPDFDownloadMobile reg={reg} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              সদস্য তথ্য সম্পাদনা
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  নাম
                </label>
                <input
                  type="text"
                  value={editFormData.member_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      member_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  লিঙ্গ
                </label>
                <select
                  value={editFormData.gender}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="Male">ছেলে/পুরুষ</option>
                  <option value="Female">মেয়ে/মহিলা</option>
                  <option value="Child">শিশু</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বয়স
                </label>
                <input
                  type="text"
                  value={editFormData.age}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, age: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  টি-শার্ট সাইজ
                </label>
                <select
                  value={editFormData.t_shirt_size}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      t_shirt_size: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="NA">NA (শিশু)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleEditMember}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                সদস্য মুছে ফেলুন?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                আপনি কি নিশ্চিত এই সদস্যকে মুছে ফেলতে চান? এই কাজটি
                পূর্বাবস্থায় ফিরানো যাবে না।
              </p>
              {selectedReg && selectedMemberIndex !== null && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                  <p className="text-sm font-medium text-gray-800">
                    {selectedReg.members[selectedMemberIndex]?.member_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedReg.members[selectedMemberIndex]?.gender} •{" "}
                    {selectedReg.members[selectedMemberIndex]?.age} বছর
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteMember}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Status Modal */}
      {showPaymentModal && selectedReg && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                পেমেন্ট স্ট্যাটাস আপডেট করুন
              </h3>
              <p className="text-sm text-gray-500 mb-2">{selectedReg.name}</p>
              <p className="text-xs text-gray-400 mb-6">{selectedReg.mobile}</p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 mb-2">বর্তমান স্ট্যাটাস</p>
                <span
                  className={`px-3 py-1.5 inline-flex text-sm font-semibold rounded-full ${
                    selectedReg.paymentStatus === "Paid"
                      ? "bg-green-100 text-green-700"
                      : selectedReg.paymentStatus === "Waived"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedReg.paymentStatus === "Paid"
                    ? "পরিশোধিত"
                    : selectedReg.paymentStatus === "Waived"
                    ? "মওকুফ"
                    : "অপেক্ষমান"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handlePaymentStatusUpdate("Paid")}
                disabled={selectedReg.paymentStatus === "Paid"}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedReg.paymentStatus === "Paid"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                }`}
              >
                ✓ পরিশোধিত হিসেবে চিহ্নিত করুন
              </button>

              <button
                onClick={() => handlePaymentStatusUpdate("Pending")}
                disabled={selectedReg.paymentStatus === "Pending"}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedReg.paymentStatus === "Pending"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95"
                }`}
              >
                ⏳ অপেক্ষমান হিসেবে চিহ্নিত করুন
              </button>

              <button
                onClick={() => handlePaymentStatusUpdate("Waived")}
                disabled={selectedReg.paymentStatus === "Waived"}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedReg.paymentStatus === "Waived"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                }`}
              >
                💸 মওকুফ হিসেবে চিহ্নিত করুন
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Group Update Modal */}
      {showGroupModal && selectedReg && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                <svg
                  className="h-6 w-6 text-indigo-600"
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                গ্রুপ পরিবর্তন করুন
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                নিচে থেকে নতুন গ্রুপটি নির্বাচন করুন
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  গ্রুপ নির্বাচন করুন
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">গ্রুপ নির্বাচন করুন</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} - {group.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowGroupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleGroupUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4 font-bangla">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              নতুন সদস্য যুক্ত করুন
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addMemberFormData.member_name}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      member_name: e.target.value,
                    })
                  }
                  placeholder="সদস্যের নাম লিখুন"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  লিঙ্গ
                </label>
                <select
                  value={addMemberFormData.gender}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      gender: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Male">ছেলে/পুরুষ</option>
                  <option value="Female">মেয়ে/মহিলা</option>
                  <option value="Child">শিশু</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  বয়স
                </label>
                <input
                  type="text"
                  value={addMemberFormData.age}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      age: e.target.value,
                    })
                  }
                  placeholder="বয়স লিখুন"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  টি-শার্ট সাইজ
                </label>
                <select
                  value={addMemberFormData.t_shirt_size}
                  onChange={(e) =>
                    setAddMemberFormData({
                      ...addMemberFormData,
                      t_shirt_size: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="NA">NA (শিশু)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleAddMember}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                যুক্ত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Registration Modal */}
      {showEditRegModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4 font-bangla">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              রেজিস্ট্রেশন তথ্য সম্পাদনা
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  প্রতিনিধির নাম
                </label>
                <input
                  type="text"
                  value={editRegFormData.name}
                  onChange={(e) =>
                    setEditRegFormData({
                      ...editRegFormData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={editRegFormData.mobile}
                  onChange={(e) =>
                    setEditRegFormData({
                      ...editRegFormData,
                      mobile: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ইমেইল
                </label>
                <input
                  type="email"
                  value={editRegFormData.email}
                  onChange={(e) =>
                    setEditRegFormData({
                      ...editRegFormData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  চাঁদার পরিমাণ
                </label>
                <input
                  type="number"
                  value={editRegFormData.contributeAmount}
                  onChange={(e) =>
                    setEditRegFormData({
                      ...editRegFormData,
                      contributeAmount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditRegModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleEditRegistration}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
