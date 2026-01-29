import { useState, useEffect, lazy, Suspense } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Select from "react-select";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
const FamilyTreeView = lazy(() => import("../components/FamilyTreeView"));

// Custom styles for react-select to match the app theme
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#f8fafc", // bg-slate-50
    borderColor: state.isFocused ? "#6366f1" : "#e2e8f0", // border-slate-200 / focus:ring-indigo-500
    borderRadius: "0.75rem", // rounded-xl
    padding: "0.25rem",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(99, 102, 241, 0.2)" : "none",
    "&:hover": {
      borderColor: "#6366f1",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
        ? "#f1f5f9"
        : "white",
    color: state.isSelected ? "white" : "#1e293b",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    cursor: "pointer",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#eff6ff",
    borderRadius: "0.5rem",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "0.75rem",
  }),
};

export default function FamilyMembersPage() {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [generationFilter, setGenerationFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'tree'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportGroups, setExportGroups] = useState([]);
  const [exportGenerations, setExportGenerations] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form State
  const initialFormData = {
    name: "",
    fatherId: "",
    motherId: "",
    spouseIds: [],
    childrenIds: [],
    generation: 1,
    phone: "",
    address: "",
    gender: "Male",
    groupid: "",
    birthYear: "",
    deathYear: "",
    alive: true,
    profession: "",
    photoUrl: "",
    birthdate: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    // Fetch Members
    const qMembers = query(
      collection(db, "members"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribeMembers = onSnapshot(qMembers, (querySnapshot) => {
      const membersData = [];
      querySnapshot.forEach((doc) => {
        membersData.push({ id: doc.id, ...doc.data() });
      });
      setMembers(membersData);
    });

    // Fetch Groups
    const qGroups = query(collection(db, "groups"), orderBy("name"));
    const unsubscribeGroups = onSnapshot(
      qGroups,
      (querySnapshot) => {
        const groupsData = [];
        querySnapshot.forEach((doc) => {
          groupsData.push({ id: doc.id, ...doc.data() });
        });
        setGroups(groupsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        toast.error("সদস্য বা গ্রুপ তালিকা লোড করতে সমস্যা হয়েছে।");
        setLoading(false);
      },
    );

    return () => {
      unsubscribeMembers();
      unsubscribeGroups();
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, generationFilter, groupFilter]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("সদস্যের নাম আবশ্যক");

    try {
      // Calculate generation based on father/mother
      let calcGen = parseInt(formData.generation);
      if (formData.fatherId || formData.motherId) {
        const parent = members.find(
          (m) =>
            m.uniqueId === formData.fatherId ||
            m.uniqueId === formData.motherId,
        );
        if (parent) {
          calcGen = (parent.generation || 0) + 1;
        }
      }

      const dataToSave = {
        ...formData,
        generation: calcGen,
        birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
        deathYear: formData.deathYear ? parseInt(formData.deathYear) : null,
        updatedAt: serverTimestamp(),
      };

      if (editingMember) {
        // Update displayId if generation changed
        const newDisplayId = `G${calcGen}-${
          editingMember.uniqueId.split("-")[1]
        }`;
        await updateDoc(doc(db, "members", editingMember.id), {
          ...dataToSave,
          displayId: newDisplayId,
        });
        toast.success("সদস্য তথ্য সফলভাবে আপডেট করা হয়েছে!");
      } else {
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const uniqueId = "M-" + randomId;
        const displayId = `G${calcGen}-${randomId}`;

        await addDoc(collection(db, "members"), {
          ...dataToSave,
          uniqueId: uniqueId,
          displayId: displayId,
          createdAt: serverTimestamp(),
          importSource: "manual_entry",
        });
        toast.success("সদস্য সফলভাবে যোগ করা হয়েছে!");
      }

      closeModal();
    } catch (error) {
      console.error("Error saving member:", error);
      toast.error("তথ্য সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    }
  };

  const handleDelete = (member) => {
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteDoc(doc(db, "members", memberToDelete.id));
      toast.success("সদস্য সফলভাবে মুছে ফেলা হয়েছে।");
      setMemberToDelete(null);
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error("মুছে ফেলতে ব্যর্থ হয়েছে।");
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || "",
      fatherId: member.fatherId || "",
      motherId: member.motherId || "",
      spouseIds: member.spouseIds || [],
      childrenIds: member.childrenIds || [],
      generation: member.generation || 1,
      phone: member.phone || "",
      address: member.address || "",
      gender: member.gender || "Male",
      groupid: member.groupid || "",
      birthYear: member.birthYear || "",
      deathYear: member.deathYear || "",
      alive: member.alive !== undefined ? member.alive : true,
      profession: member.profession || "",
      photoUrl: member.photoUrl || "",
      birthdate: member.birthdate || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData(initialFormData);
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.uniqueId
        ?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.phone?.toString().includes(searchTerm);

    const matchesGeneration =
      generationFilter === "all" ||
      member.generation?.toString() === generationFilter;

    // Helper to get group ID safely
    const mGroupId = member.groupid || member.groupId;

    // Robust matching logic
    let matchesGroup = groupFilter === "all";
    if (!matchesGroup) {
      // 1. Check direct ID match (loose equality for string/number diffs)
      if (mGroupId == groupFilter) matchesGroup = true;
      // 2. Check if member has Group Name stored instead of ID
      else {
        const selectedGroup = groups.find((g) => g.id == groupFilter);
        if (
          selectedGroup &&
          mGroupId &&
          selectedGroup.name.trim().toLowerCase() ===
            mGroupId.toString().trim().toLowerCase()
        ) {
          matchesGroup = true;
        }
      }
    }

    return matchesSearch && matchesGeneration && matchesGroup;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const generations = [
    ...new Set(members.map((m) => m.generation?.toString())),
  ].sort((a, b) => a - b);

  const downloadSample = () => {
    const data = [
      {
        Name: "শরিফুল ইসলাম",
        Gender: "Male",
        "Birth Year": 1950,
        Profession: "Farmer",
        Alive: "true",
        Phone: "017XXXXXXXX",
        Address: "ঢাকা, বাংলাদেশ",
        Generation: 1,
      },
      {
        Name: "আরিফুল ইসলাম",
        "Father ID": "M-XXXXXX",
        Gender: "Male",
        "Birth Year": 1980,
        Profession: "Teacher",
        Alive: "true",
        Phone: "018XXXXXXXX",
        Address: "ঢাকা, বাংলাদেশ",
        Generation: 2,
        "Spouse IDs": "M-YYYYYY",
        "Children IDs": "M-ZZZZZZ",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "family_members_sample.xlsx");
    toast.success("স্যাম্পল ফাইল ডাউনলোড হচ্ছে...");
  };

  const handleExportExcel = (type) => {
    const workbook = XLSX.utils.book_new();

    const mapMember = (m) => ({
      ID: m.displayId || m.uniqueId,
      নাম: m.name,
      লিঙ্গ: m.gender === "Male" ? "পুরুষ" : "মহিলা",
      মোবাইল: m.phone || "-",
      ঠিকানা: m.address || "-",
      জেনারেশন: m.generation,
      পিতা: members.find((f) => f.uniqueId === m.fatherId)?.name || "-",
      মাতা: members.find((mo) => mo.uniqueId === m.motherId)?.name || "-",
      পেশা: m.profession || "-",
      "জন্ম সাল": m.birthYear || "-",
      জীবিত: m.alive ? "হ্যাঁ" : "না",
      "মৃত্যু সাল": m.deathYear || "-",
      গ্রুপ:
        groups.find((g) => g.id == m.groupid || g.name == m.groupid)?.name ||
        m.groupid ||
        "-",
    });

    // 1. Filter by selected groups
    let filteredForExport = members;
    if (exportGroups.length > 0) {
      filteredForExport = filteredForExport.filter((m) => {
        const mGid = m.groupid || m.groupId;
        return exportGroups.includes(mGid?.toString());
      });
    }

    // 2. Filter by selected generations
    if (exportGenerations.length > 0) {
      filteredForExport = filteredForExport.filter((m) =>
        exportGenerations.includes(m.generation?.toString()),
      );
    }

    if (filteredForExport.length === 0) {
      return toast.error("সিলেক্ট করা ফিল্টার অনুযায়ী কোনো সদস্য পাওয়া যায়নি।");
    }

    if (type === "all") {
      const data = filteredForExport.map(mapMember);
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Members");
    } else if (type === "group") {
      const groupsToProcess = exportGroups.length > 0 
        ? groups.filter(g => exportGroups.includes(g.id.toString()) || exportGroups.includes(g.name))
        : groups;

      groupsToProcess.forEach((group) => {
        const groupMembers = filteredForExport.filter(
          (m) => m.groupid == group.id || m.groupid == group.name,
        );
        if (groupMembers.length > 0) {
          const data = groupMembers.map(mapMember);
          const worksheet = XLSX.utils.json_to_sheet(data);
          const sheetName = group.name.replace(/[\[\]\*\?\/\\]/g, "").substring(0, 31);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || `Group ${group.id}`);
        }
      });
    } else if (type === "generation") {
      const gensToProcess = exportGenerations.length > 0
        ? exportGenerations.sort((a, b) => a - b)
        : [...new Set(filteredForExport.map((m) => m.generation?.toString()))]
            .filter(Boolean)
            .sort((a, b) => a - b);
      
      gensToProcess.forEach((gen) => {
        const genMembers = filteredForExport.filter((m) => m.generation?.toString() === gen);
        if (genMembers.length > 0) {
          const data = genMembers.map(mapMember);
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, `Generation ${gen}`);
        }
      });
    }

    XLSX.writeFile(
      workbook,
      `family_members_${type}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("এক্সেল ফাইল ডাউনলোড হচ্ছে...");
    setIsExportModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="font-bangla space-y-6">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              বংশ সদস্য ও ফ্যামিলি ট্রি
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বংশের ইতিহাস এবং জেনারেশন পরিচালনা করুন
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                টেবিল ভিউ
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  viewMode === "tree"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                ফ্যামিলি ট্রি
              </button>
            </div>

            <button
              onClick={downloadSample}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
              title="স্যাম্পল ফাইল ডাউনলোড"
            >
              📥
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2.5 bg-green-50 text-green-600 border border-green-100 rounded-xl font-bold text-sm hover:bg-green-100 transition-all flex items-center gap-2"
              title="এক্সপোর্ট করুন"
            >
              <span>📊</span> এক্সপোর্ট
            </button>

            <Link
              to="/admin/bulk-members-upload"
              className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>📂</span> বাল্ক আপলোড
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>+</span> সদস্য যোগ
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-50">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="নাম, আইডি বা মোবাইল..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full text-sm transition-all"
            />
          </div>
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-600"
          >
            <option value="all">সব জেনারেশন</option>
            {generations.map((gen) => (
              <option key={gen} value={gen}>
                জেনারেশন {gen}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-600"
          >
            <option value="all">সব গ্রুপ</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.description ? `- ${group.description}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content View */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    সদস্যের তথ্য
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    পিতা-মাতা
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    জীবনকাল ও পেশা
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    জেনারেশন
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    যোগাযোগ ও ঠিকানা
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paginatedMembers.map((member) => {
                  const father = members.find(
                    (m) => m.uniqueId === member.fatherId,
                  );
                  const mother = members.find(
                    (m) => m.uniqueId === member.motherId,
                  );

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              member.gender === "Female"
                                ? "bg-pink-50 text-pink-600"
                                : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {member.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              {member.name}
                              {(!member.alive || member.deathYear) && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded italic">
                                  মৃত
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                              {member.displayId || member.uniqueId}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {(() => {
                                const mGroupId =
                                  member.groupid || member.groupId;
                                if (!mGroupId) return "গ্রুপ নেই";
                                const g = groups.find(
                                  (gp) =>
                                    gp.id == mGroupId || gp.name == mGroupId,
                                );
                                return g
                                  ? `গ্রুপ: ${g.name}`
                                  : `গ্রুপ: ${mGroupId}`;
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            পিতা:
                          </span>
                          {father ? (
                            <span className="text-slate-800 font-medium">
                              {father.name}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">
                              জানা নেই
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            মাতা:
                          </span>
                          {mother ? (
                            <span className="text-slate-800 font-medium">
                              {mother.name}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">
                              জানা নেই
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">
                          {member.birthYear ? member.birthYear : "????"} -{" "}
                          {member.alive && !member.deathYear
                            ? "বর্তমান"
                            : member.deathYear || "????"}
                        </div>
                        <div className="text-xs text-indigo-600 font-bold mt-1">
                          {member.profession || "পেশা উল্লেখ নেই"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100">
                          ধাপ {member.generation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700 font-medium">
                          {member.phone || "-"}
                        </div>
                        <div
                          className="text-xs text-slate-400 mt-1 max-w-[180px] truncate"
                          title={member.address}
                        >
                          {member.address || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingMember(member)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="বিস্তারিত দেখুন"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="সম্পাদন করুন"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(member)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ডিলিট করুন"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredMembers.length > 0 && (
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  মোট সদস্য:{" "}
                  <span className="text-slate-800 font-bold">
                    {filteredMembers.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-medium">
                    প্রতি পাতায়:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700 shadow-sm"
                  >
                    {[10, 25, 50, 100].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-indigo-600">
                    {currentPage}
                  </span>
                  <span className="text-slate-300 mx-1">/</span>
                  <span className="text-sm font-bold text-slate-500">
                    {totalPages || 1}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {filteredMembers.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              কোনো সদস্য পাওয়া যায়নি
            </div>
          )}
        </div>
      ) : (
        <Suspense fallback={<div className="p-6">🌳 ট্রি লোড হচ্ছে...</div>}>
          <FamilyTreeView members={members} />
        </Suspense>
      )}

      {/* Manual Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">
                {editingMember
                  ? "সদস্য তথ্য আপডেট করুন"
                  : "নতুন সদস্য যোগ করুন"}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6"
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
              </button>
            </div>

            <form
              onSubmit={handleAddMember}
              className="p-8 space-y-6 overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    সদস্যের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="নাম লিখুন"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    লিঙ্গ
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Male">পুরুষ</option>
                    <option value="Female">মহিলা</option>
                  </select>
                </div>

                {/* Group Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    গ্রুপ (Group)
                  </label>
                  <select
                    value={formData.groupid}
                    onChange={(e) =>
                      setFormData({ ...formData, groupid: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="">বাছাই করুন</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}{" "}
                        {group.description ? `- ${group.description}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    পিতার নাম
                  </label>
                  <Select
                    options={members
                      .filter(
                        (m) =>
                          m.gender === "Male" &&
                          (!formData.groupid ||
                            m.groupid == formData.groupid ||
                            m.groupId == formData.groupid),
                      )
                      .map((m) => ({
                        value: m.uniqueId,
                        label: `${m.name} (${m.displayId || m.uniqueId}) ${
                          m.generation ? `- G${m.generation}` : ""
                        }`,
                      }))}
                    value={
                      formData.fatherId
                        ? {
                            value: formData.fatherId,
                            label:
                              (members.find(
                                (m) => m.uniqueId === formData.fatherId,
                              )?.name || "") +
                              ` (${
                                members.find(
                                  (m) => m.uniqueId === formData.fatherId,
                                )?.displayId || formData.fatherId
                              })`,
                          }
                        : null
                    }
                    onChange={(option) =>
                      setFormData({
                        ...formData,
                        fatherId: option ? option.value : "",
                      })
                    }
                    isSearchable
                    placeholder="পিতা খুঁজুন..."
                    styles={customSelectStyles}
                    noOptionsMessage={() => "কোনো সদস্য পাওয়া যায়নি"}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    মাতার নাম
                  </label>
                  <Select
                    options={members
                      .filter(
                        (m) =>
                          m.gender === "Female" &&
                          (!formData.groupid ||
                            m.groupid == formData.groupid ||
                            m.groupId == formData.groupid),
                      )
                      .map((m) => ({
                        value: m.uniqueId,
                        label: `${m.name} (${m.displayId || m.uniqueId}) ${
                          m.generation ? `- G${m.generation}` : ""
                        }`,
                      }))}
                    value={
                      formData.motherId
                        ? {
                            value: formData.motherId,
                            label:
                              (members.find(
                                (m) => m.uniqueId === formData.motherId,
                              )?.name || "") +
                              ` (${
                                members.find(
                                  (m) => m.uniqueId === formData.motherId,
                                )?.displayId || formData.motherId
                              })`,
                          }
                        : null
                    }
                    onChange={(option) =>
                      setFormData({
                        ...formData,
                        motherId: option ? option.value : "",
                      })
                    }
                    isSearchable
                    placeholder="মাতা খুঁজুন..."
                    styles={customSelectStyles}
                    noOptionsMessage={() => "কোনো সদস্য পাওয়া যায়নি"}
                  />
                </div>

                {/* Profession */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    পেশা (Profession)
                  </label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) =>
                      setFormData({ ...formData, profession: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="উদাঃ কৃষক, শিক্ষক"
                  />
                </div>

                {/* Birth Year */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    জন্ম সাল (Birth Year)
                  </label>
                  <input
                    type="number"
                    value={formData.birthYear}
                    onChange={(e) =>
                      setFormData({ ...formData, birthYear: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="1950"
                  />
                </div>

                {/* Birthdate */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    জন্ম তারিখ (Birthdate)
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdate: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                {/* Alive Status */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    জীবিত কি না?
                  </label>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, alive: true, deathYear: "" })
                      }
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        formData.alive
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      হ্যাঁ
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, alive: false })}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        !formData.alive
                          ? "bg-indigo-600 text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      না
                    </button>
                  </div>
                </div>

                {/* Death Year */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    মৃত্যু সাল (যদি থাকে)
                  </label>
                  <input
                    type="number"
                    disabled={formData.alive}
                    value={formData.deathYear}
                    onChange={(e) =>
                      setFormData({ ...formData, deathYear: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                    placeholder="2020"
                  />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="017XXXXXXXX"
                  />
                </div>

                {/* Generation */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    জেনারেশন (যদি পিতা-মাতা না থাকে)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={formData.fatherId || formData.motherId}
                    value={formData.generation}
                    onChange={(e) =>
                      setFormData({ ...formData, generation: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                  />
                  {(formData.fatherId || formData.motherId) && (
                    <p className="text-[10px] text-indigo-600 font-medium mt-1">
                      * পিতা/মাতা বাছাই করলে জেনারেশন অটোমেটিক হিসেব হবে
                    </p>
                  )}
                </div>

                {/* Photo URL */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">
                    ছবি লিঙ্ক (Photo URL)
                  </label>
                  <input
                    type="text"
                    value={formData.photoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, photoUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              {/* Advanced Linkage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-indigo-600 ml-1">
                    স্বামী/স্ত্রী (Spouse)
                  </label>
                  <Select
                    isMulti
                    options={members
                      .filter(
                        (m) =>
                          m.uniqueId !== editingMember?.uniqueId &&
                          (!formData.groupid ||
                            m.groupid == formData.groupid ||
                            m.groupId == formData.groupid),
                      )
                      .map((m) => ({
                        value: m.uniqueId,
                        label: `${m.name} (${m.displayId || m.uniqueId})`,
                      }))}
                    value={formData.spouseIds.map((id) => {
                      const m = members.find((x) => x.uniqueId === id);
                      return {
                        value: id,
                        label: (m?.name || id) + ` (${m?.displayId || id})`,
                      };
                    })}
                    onChange={(options) =>
                      setFormData({
                        ...formData,
                        spouseIds: options ? options.map((o) => o.value) : [],
                      })
                    }
                    isSearchable
                    placeholder="স্বামী/স্ত্রী খুঁজুন..."
                    styles={customSelectStyles}
                    noOptionsMessage={() => "কোনো সদস্য পাওয়া যায়নি"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-indigo-600 ml-1">
                    সন্তানসন্ততি (Children)
                  </label>
                  <Select
                    isMulti
                    options={members
                      .filter(
                        (m) =>
                          m.uniqueId !== editingMember?.uniqueId &&
                          (!formData.groupid ||
                            m.groupid == formData.groupid ||
                            m.groupId == formData.groupid),
                      )
                      .map((m) => ({
                        value: m.uniqueId,
                        label: `${m.name} (${m.displayId || m.uniqueId})`,
                      }))}
                    value={formData.childrenIds.map((id) => {
                      const m = members.find((x) => x.uniqueId === id);
                      return {
                        value: id,
                        label: (m?.name || id) + ` (${m?.displayId || id})`,
                      };
                    })}
                    onChange={(options) =>
                      setFormData({
                        ...formData,
                        childrenIds: options ? options.map((o) => o.value) : [],
                      })
                    }
                    isSearchable
                    placeholder="সন্তান খুঁজুন..."
                    styles={customSelectStyles}
                    noOptionsMessage={() => "কোনো সদস্য পাওয়া যায়নি"}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  ঠিকানা
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="ঠিকানা লিখুন"
                  rows="2"
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Viewing Member Profile Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setViewingMember(null)}
          ></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            {/* Header / Profile Cover */}
            <div className="relative h-32 bg-indigo-600 shrink-0">
              <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
                {viewingMember.photoUrl ? (
                  <img
                    src={viewingMember.photoUrl}
                    alt={viewingMember.name}
                    className="w-24 h-24 rounded-[1.25rem] object-cover"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-[1.25rem] flex items-center justify-center text-4xl font-black text-white ${
                      viewingMember.gender === "Female"
                        ? "bg-pink-500"
                        : "bg-indigo-500"
                    }`}
                  >
                    {viewingMember.name?.charAt(0)}
                  </div>
                )}
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all"
              >
                <svg
                  className="w-5 h-5"
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
              </button>
            </div>

            <div className="pt-16 p-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">
                    {viewingMember.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 uppercase tracking-wider">
                      {viewingMember.displayId || viewingMember.uniqueId}
                    </span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
                      ধাপ {viewingMember.generation}
                    </span>
                    {viewingMember.groupid && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                        {viewingMember.groupid}
                      </span>
                    )}
                  </div>
                </div>
                {!viewingMember.alive && (
                  <div className="px-4 py-1.5 bg-slate-900 text-slate-100 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    মৃত
                  </div>
                )}
              </div>

              {/* Stats / Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    পেশা
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingMember.profession || "উল্লেখ নেই"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    জন্ম সাল
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingMember.birthYear || "অজানা"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    জন্ম তারিখ
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingMember.birthdate || "অজানা"}
                  </p>
                </div>
                {!viewingMember.alive && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      মৃত্যু সাল
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {viewingMember.deathYear || "অজানা"}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    মোবাইল
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {viewingMember.phone || "নেই"}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ঠিকানা
                  </p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    {viewingMember.address || "বিবরণ নেই"}
                  </p>
                </div>
              </div>

              {/* Family Links */}
              <div className="mt-12 space-y-8">
                {/* Parents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                      পিতামাতা
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">
                          পিতা
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {members.find(
                            (m) => m.uniqueId === viewingMember.fatherId,
                          )?.name || (
                            <span className="text-slate-300 italic">অজানা</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400">
                          মাতা
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {members.find(
                            (m) => m.uniqueId === viewingMember.motherId,
                          )?.name || (
                            <span className="text-slate-300 italic">অজানা</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spouses */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2">
                      স্বামী/স্ত্রী
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingMember.spouseIds?.length > 0 ? (
                        viewingMember.spouseIds.map((sid) => {
                          const spouse = members.find(
                            (m) => m.uniqueId === sid,
                          );
                          return (
                            <div
                              key={sid}
                              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100"
                            >
                              {spouse?.name || sid}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          কোনো তথ্য নেই
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Children */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest border-b border-emerald-50 pb-2">
                    সন্তানসন্ততি
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingMember.childrenIds?.length > 0 ? (
                      viewingMember.childrenIds.map((cid) => {
                        const child = members.find((m) => m.uniqueId === cid);
                        return (
                          <div
                            key={cid}
                            className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-100 text-center"
                          >
                            {child?.name || cid}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        কোনো তথ্য নেই
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 shrink-0 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingMember(null)}
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setMemberToDelete(null)}
          ></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center animate-pulse text-3xl">
                  ⚠️
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">
                সদস্য ডিলিট করুন?
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                আপনি কি নিশ্চিতভাবে{" "}
                <span className="font-bold text-slate-800">
                  {memberToDelete.name}
                </span>{" "}
                এর সকল তথ্য স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা সম্ভব
                হবে না।
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                >
                  হ্যাঁ, ডিলিট করুন
                </button>
                <button
                  onClick={() => setMemberToDelete(null)}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                >
                  না, ফিরে যান
                </button>
              </div>
            </div>
            {/* Decorative bottom bar */}
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-600"></div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setIsExportModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">
                    অ্যাডভান্সড এক্সপোর্ট
                  </h3>
                  <p className="text-slate-500 text-sm">
                    নির্দিষ্ট গ্রুপ এবং জেনারেশন সিলেক্ট করে ডাউনলোড করুন
                  </p>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-all"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>

              <div className="space-y-8">
                {/* Group Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      👥 গ্রুপ বাছাই করুন
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                        {exportGroups.length}/{groups.length}
                      </span>
                    </label>
                    <button
                      onClick={() =>
                        setExportGroups(
                          exportGroups.length === groups.length
                            ? []
                            : groups.map((g) => g.id.toString()),
                        )
                      }
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {exportGroups.length === groups.length
                        ? "সব বাদ দিন"
                        : "সব সিলেক্ট করুন"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => {
                          const gid = group.id.toString();
                          setExportGroups((prev) =>
                            prev.includes(gid)
                              ? prev.filter((i) => i !== gid)
                              : [...prev, gid],
                          );
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          exportGroups.includes(group.id.toString())
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-200"
                        }`}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generation Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      🌳 জেনারেশন বাছাই করুন
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                        {exportGenerations.length}/{generations.length}
                      </span>
                    </label>
                    <button
                      onClick={() =>
                        setExportGenerations(
                          exportGenerations.length === generations.length
                            ? []
                            : generations,
                        )
                      }
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {exportGenerations.length === generations.length
                        ? "সব বাদ দিন"
                        : "সব সিলেক্ট করুন"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generations.map((gen) => (
                      <button
                        key={gen}
                        onClick={() => {
                          const sGen = gen.toString();
                          setExportGenerations((prev) =>
                            prev.includes(sGen)
                              ? prev.filter((i) => i !== sGen)
                              : [...prev, sGen],
                          );
                        }}
                        className={`w-12 h-12 rounded-xl text-xs font-black transition-all border flex items-center justify-center ${
                          exportGenerations.includes(gen.toString())
                            ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                            : "bg-slate-50 text-slate-600 border-slate-100 hover:border-amber-200"
                        }`}
                      >
                        G{gen}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Modes */}
                <div className="pt-8 border-t border-slate-100">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-wider block mb-4">
                    📥 এক্সপোর্ট ফরম্যাট
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleExportExcel("all")}
                      className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-3xl flex flex-col items-center gap-2 group transition-all"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        📄
                      </span>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-xs">
                          সব এক সিটে
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Single Sheet
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExportExcel("group")}
                      className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 rounded-3xl flex flex-col items-center gap-2 group transition-all"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        📑
                      </span>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-xs">
                          গ্রুপ ভিত্তিক আলাদা
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Multiple Sheets
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExportExcel("generation")}
                      className="p-4 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-100 rounded-3xl flex flex-col items-center gap-2 group transition-all"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">
                        📚
                      </span>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-xs">
                          জেনারেশন ভিত্তিক আলাদা
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Multiple Sheets
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 shrink-0 border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs font-bold text-slate-400">
                *{exportGroups.length === 0 && exportGenerations.length === 0
                  ? "কোনো ফিল্টার না দিলে সব ডাটা আসবে"
                  : "সিলেক্ট করা ফিল্টার প্রয়োগ হবে"}
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95"
              >
                বন্ধ করুন
              </button>
            </div>
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500"></div>
          </div>
        </div>
      )}
    </div>
  );
}
