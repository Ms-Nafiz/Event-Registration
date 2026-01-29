import { useState, useMemo } from "react";
import { useData } from "../contexts/DataContext";
import Select from "react-select";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

// Register fonts for PDF (Bangla support)
// Kalpurush is often more reliable for Bengali PDF generation in react-pdf
Font.register({
  family: "BengaliFont",
  src: "/fonts/Kalpurush.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: "BengaliFont",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
    color: "#334155",
    fontFamily: "BengaliFont",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 8,
    fontWeight: "bold",
    fontFamily: "BengaliFont",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    padding: 8,
    alignItems: "center",
    fontFamily: "BengaliFont",
  },
  colDate: { width: "12%", fontSize: 9, color: "#475569" },
  colName: {
    width: "42%",
    fontSize: 9,
    color: "#475569",
  },
  colGroup: { width: "18%", fontSize: 9, color: "#475569" },
  colMonth: { width: "12%", fontSize: 9, color: "#475569" },
  colAmount: {
    width: "18%",
    fontSize: 9,
    textAlign: "right",
    color: "#475569",
  },

  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    fontFamily: "BengaliFont",
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
    color: "#1e293b",
    fontFamily: "BengaliFont",
  },
});

const safeBangla = (text = "") =>
  text
    .replace(":", ":\u00A0") // non-breaking space
    .normalize("NFC");

const parseMonth = (monthStr) => {
  if (!monthStr) return 0;
  const parts = monthStr.split(" ");
  if (parts.length < 2) return 0;
  const [m, y] = parts;
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
  const monthIndex = monthNames.indexOf(m);
  return new Date(parseInt(y), monthIndex).getTime();
};

// PDF Document Component - Grouped by Family
const DonationPDF = ({ data, totalAmount, month, groupName }) => {
  // Group donations by group name
  const groupedData = data.reduce((acc, donation) => {
    const group = donation.groupName || "N/A";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(donation);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Donation Report</Text>
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 10, color: "#64748b" }}>
            Filter: {month || "All Months"} | {groupName || "All Groups"}
          </Text>
        </View>

        {/* Iterate through each group */}
        {Object.entries(groupedData).map(([group, donations], groupIndex) => {
          const subtotal = donations.reduce(
            (sum, d) => sum + (Number(d.amount) || 0),
            0,
          );

          return (
            <View key={groupIndex} style={{ marginBottom: 10 }}>
              {/* Group Header - Simple */}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  marginBottom: 3,
                  fontFamily: "BengaliFont",
                }}
              >
                {group}
              </Text>

              {/* Table Header for this group */}
              <View style={styles.header}>
                <Text style={styles.colDate}>Date</Text>
                <Text style={styles.colName}>Member Name</Text>
                <Text style={styles.colMonth}>Month</Text>
                <Text style={styles.colAmount}>Amount</Text>
              </View>

              {/* Donations for this group */}
              {donations.map((d, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.colDate}>
                    {d.date && typeof d.date.toDate === "function"
                      ? d.date.toDate().toLocaleDateString()
                      : d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString()
                        : "N/A"}
                  </Text>
                  <Text style={styles.colName}>
                    {safeBangla(d.userName || "N/A")}
                  </Text>
                  <Text style={styles.colMonth}>{d.month || "N/A"}</Text>
                  <Text style={styles.colAmount}>৳{d.amount}</Text>
                </View>
              ))}

              {/* Subtotal - Simple */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 3,
                  paddingTop: 5,
                  borderTopWidth: 1,
                  borderTopColor: "#000000",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 9,
                    fontWeight: "bold",
                    textAlign: "right",
                    paddingRight: 10,
                    fontFamily: "BengaliFont",
                  }}
                >
                  Sub-Total:
                </Text>
                <Text
                  style={{
                    width: "15%",
                    fontSize: 9,
                    fontWeight: "bold",
                    textAlign: "right",
                    fontFamily: "BengaliFont",
                  }}
                >
                  ৳{subtotal.toLocaleString()}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Grand Total - Simple */}
        <View
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 2,
            borderTopColor: "#000000",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "bold",
              textAlign: "right",
              fontFamily: "BengaliFont",
            }}
          >
            Grand Total: ৳{totalAmount.toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default function DonationReportPage() {
  const { donations, groups, loading: dataLoading } = useData();
  const loading = dataLoading.donations || dataLoading.groups;

  const [filterMonth, setFilterMonth] = useState([]);
  const [filterGroup, setFilterGroup] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  const [activeTab, setActiveTab] = useState("details"); // 'details' or 'summary'

  const fileNameBase = useMemo(() => {
    const monthLabel =
      filterMonth && filterMonth.length > 0
        ? filterMonth.map((m) => m.label).join("_")
        : "All";
    const gName =
      (groups || []).find((g) => g.id === filterGroup)?.name || "All";
    return `Donation_Report_${monthLabel}_${gName}`;
  }, [filterMonth, filterGroup, groups]);

  // 1. Stable months options for the Select component
  const uniqueMonths = useMemo(() => {
    if (!donations) return [];
    const months = [...new Set(donations.map((d) => d.month))].filter(Boolean);
    return months
      .sort((a, b) => parseMonth(b) - parseMonth(a))
      .map((m) => ({ value: m, label: m }));
  }, [donations]);

  // 2. Enrich donations with group names
  const enrichedDonations = useMemo(() => {
    if (!donations || !groups) return [];
    return donations.map((d) => ({
      ...d,
      groupName: Array.isArray(groups)
        ? groups.find((g) => g.id === d.groupId)?.name || "N/A"
        : "N/A",
    }));
  }, [donations, groups]);

  // 3. Memoized filtering logic
  const filteredData = useMemo(() => {
    return enrichedDonations.filter((d) => {
      // Multi-month filter logic - handle null/empty array from react-select
      const matchMonth =
        filterMonth && filterMonth.length > 0
          ? filterMonth.some((m) => m?.value === d.month)
          : true;

      const matchGroup = filterGroup ? d.groupId === filterGroup : true;

      // Safely check status
      const statusStr = String(d.status || "").toLowerCase();
      const isApproved = statusStr === "approved";

      return matchMonth && matchGroup && isApproved;
    });
  }, [enrichedDonations, filterMonth, filterGroup]);

  // 4. Memoized totals
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const summaryData = useMemo(() => {
    if (!enrichedDonations || !groups) return { groups: [], months: [] };

    // Filter donations by approved status (consistent with details)
    const approvedDonations = enrichedDonations.filter(
      (d) => String(d.status || "").toLowerCase() === "approved",
    );

    // Get months to display
    let selectedMonths = [];
    if (filterMonth && filterMonth.length > 0) {
      selectedMonths = filterMonth
        .map((m) => m.value)
        .sort((a, b) => parseMonth(b) - parseMonth(a));
    } else {
      selectedMonths = [...new Set(approvedDonations.map((d) => d.month))]
        .filter(Boolean)
        .sort((a, b) => parseMonth(b) - parseMonth(a));
    }

    if (selectedMonths.length === 0) return { groups: [], months: [] };

    const groupMap = {};
    groups.forEach((g) => {
      groupMap[g.id] = {
        name: g.name,
        id: g.id,
        monthlyTotals: {},
        total: 0,
      };
      selectedMonths.forEach((m) => {
        groupMap[g.id].monthlyTotals[m] = 0;
      });
    });

    approvedDonations.forEach((d) => {
      if (groupMap[d.groupId] && selectedMonths.includes(d.month)) {
        const amt = Number(d.amount) || 0;
        groupMap[d.groupId].monthlyTotals[d.month] += amt;
        groupMap[d.groupId].total += amt;
      }
    });

    // For now showing all groups that have at least one donation in any month
    const groupsWithDonations = Object.values(groupMap)
      .filter((g) => g.total > 0)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return {
      groups: groupsWithDonations,
      months: selectedMonths,
    };
  }, [enrichedDonations, groups, filterMonth]);

  const getFormattedDate = (d) => {
    if (d.date && typeof d.date.toDate === "function") {
      return d.date.toDate().toLocaleDateString("bn-BD");
    }
    if (d.createdAt) {
      return new Date(d.createdAt).toLocaleDateString("bn-BD");
    }
    return "N/A";
  };

  const handleExportExcel = () => {
    try {
      const exportData = filteredData.map((d) => ({
        তারিখ: getFormattedDate(d),
        নাম: d.userName,
        আইডি: d.memberDisplayId || d.memberId,
        গ্রুপ: d.groupName,
        মাস: d.month,
        পরিমাণ: d.amount,
        স্ট্যাটাস: d.status,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Donations");

      XLSX.writeFile(wb, `${fileNameBase}.xlsx`);
      toast.success("এক্সেল ফাইল ডাউনলোড শুরু হয়েছে");
    } catch (error) {
      console.error(error);
      toast.error("এক্সেল এক্সপোর্ট করতে সমস্যা হয়েছে");
    }
  };

  const handleExportPDF = async () => {
    if (filteredData.length === 0) return toast.error("কোনো ডাটা পাওয়া যায়নি");
    setIsGeneratingPDF(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const doc = (
        <DonationPDF
          data={filteredData}
          totalAmount={totalAmount}
          month={
            filterMonth && filterMonth.length > 0
              ? filterMonth.map((m) => m.label).join(", ")
              : "All Months"
          }
          groupName={
            (groups || []).find((g) => g.id === filterGroup)?.name ||
            "All Groups"
          }
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileNameBase}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF ডাউনলোড শুরু হয়েছে");
    } catch (error) {
      console.error("PDF Error:", error);
      toast.error("PDF তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsGeneratingPDF(false);
    }
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
      {/* Header & Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              ডোনেশন রিপোর্ট
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বিস্তারিত ডোনেশন রিপোর্ট এবং এক্সপোর্ট
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <Select
                isMulti
                options={uniqueMonths}
                value={filterMonth}
                onChange={(val) => {
                  setFilterMonth(val);
                  setCurrentPage(1);
                }}
                placeholder="মাস নির্বাচন করুন..."
                className="text-sm font-bold text-slate-700"
                classNamePrefix="select"
              />
            </div>

            <select
              value={filterGroup}
              onChange={(e) => {
                setFilterGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">সকল গ্রুপ</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <span>📊</span> Excel
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isGeneratingPDF}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-lg shadow-rose-200 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>প্রস্তুত হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>📄</span>
                    <span>PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">
            মোট ডোনেশন
          </p>
          <p className="text-3xl font-black mt-2">
            ৳{totalAmount.toLocaleString()}
          </p>
          <p className="text-xs mt-4 opacity-70">
            নির্বাচিত ফিল্টারের ভিত্তিতে
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            ট্রানজেকশন সংখ্যা
          </p>
          <p className="text-3xl font-black mt-2 text-slate-800">
            {filteredData.length}
          </p>
          <p className="text-xs mt-4 text-emerald-600 font-bold">
            সকল ডাটা অনুমোদিত
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            গড় ডোনেশন
          </p>
          <p className="text-3xl font-black mt-2 text-slate-800">
            ৳
            {filteredData.length > 0
              ? Math.round(totalAmount / filteredData.length).toLocaleString()
              : 0}
          </p>
          <p className="text-xs mt-4 text-slate-400 italic">প্রতি ট্রানজেকশন</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "details"
              ? "bg-white text-indigo-600 shadow-md shadow-indigo-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
          }`}
        >
          বিস্তারিত তালিকা
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "summary"
              ? "bg-white text-indigo-600 shadow-md shadow-indigo-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
          }`}
        >
          গ্রুপ ও মাস ভিত্তিক সামারি
        </button>
      </div>

      {/* Detailed Table Tab */}
      {activeTab === "details" && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    তারিখ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    সদস্য
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    গ্রুপ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                    মাস
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                    পরিমাণ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedData.map((d, i) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {getFormattedDate(d)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-800">
                        {d.userName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ID: {d.memberDisplayId || d.memberId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase">
                        {d.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 italic">
                      {d.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-slate-800">
                      ৳{d.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              {paginatedData.length > 0 && (
                <tfoot className="bg-slate-50/80 font-black">
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-right text-sm text-slate-600 uppercase"
                    >
                      মোট
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-indigo-700">
                      ৳{totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {filteredData.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              কোনো ডাটা পাওয়া যায়নি
            </div>
          )}

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
      )}

      {/* Group & Month Summary Tab */}
      {activeTab === "summary" && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">
                    গ্রুপের নাম
                  </th>
                  {summaryData.months.map((m) => (
                    <th
                      key={m}
                      className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-xs font-bold text-indigo-600 uppercase tracking-widest font-black">
                    মোট
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaryData.groups.map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50">
                      {group.name}
                    </td>
                    {summaryData.months.map((m) => (
                      <td
                        key={m}
                        className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600 tabular-nums"
                      >
                        {group.monthlyTotals[m] > 0
                          ? `৳${group.monthlyTotals[m].toLocaleString()}`
                          : "-"}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-indigo-700 tabular-nums">
                      ৳{group.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 font-black">
                <tr>
                  <td className="px-6 py-4 text-left text-sm text-slate-600 uppercase sticky left-0 bg-slate-50/80">
                    সর্বমোট
                  </td>
                  {summaryData.months.map((m) => {
                    const colTotal = summaryData.groups.reduce(
                      (sum, g) => sum + (g.monthlyTotals[m] || 0),
                      0,
                    );
                    return (
                      <td
                        key={m}
                        className="px-6 py-4 text-right text-sm text-slate-800 tabular-nums"
                      >
                        ৳{colTotal.toLocaleString()}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-right text-sm text-indigo-700 tabular-nums">
                    ৳{totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {summaryData.groups.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              কোনো সামারি ডাটা পাওয়া যায়নি
            </div>
          )}
        </div>
      )}
    </div>
  );
}
