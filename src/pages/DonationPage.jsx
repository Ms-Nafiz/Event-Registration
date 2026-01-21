import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { useData } from "../contexts/DataContext";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import Select from "react-select";

export default function DonationPage() {
  const { user } = useAuth();
  const { donations, members, loading: dataLoading } = useData();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("দয়া করে সঠিক পরিমাণ দিন।");
    if (!selectedMember)
      return toast.error("দয়া করে একজন সদস্য নির্বাচন করুন।");

    setLoading(true);
    try {
      const date = new Date();
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
      const currentMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      await addDoc(collection(db, "donations"), {
        memberId: selectedMember.value,
        userName: selectedMember.label.split(" (")[0], // Get name part only
        memberDisplayId: selectedMember.displayId,
        groupId: selectedMember.groupId || "N/A",
        amount: Number(amount),
        date: Timestamp.fromDate(date),
        month: currentMonth,
        paymentMethod: paymentMethod,
        status: "pending",
        recordedBy: user.uid,
        createdAt: date.toISOString(),
      });

      toast.success("ডোনেশন রিকোয়েস্ট জমা হয়েছে!");
      setAmount("");
      setSelectedMember(null);
    } catch (error) {
      console.error(error);
      toast.error("ডোনেশন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-bangla max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
              ৳
            </span>
            ডোনেশন প্যানেল
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            সদস্যদের ডোনেশন সংগ্রহ এবং ইতিহাস ম্যানেজ করুন।
          </p>
        </div>
      </div>

      {/* Top Section: Donation Form (Inline) */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>

        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
          নতুন ডোনেশন যোগ করুন
        </h2>

        <form
          onSubmit={handleDonate}
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10"
        >
          <div className="md:col-span-5">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              সদস্য নির্বাচন করুন
            </label>
            <Select
              options={members.map((m) => ({
                value: m.uniqueId || m.id,
                label: `${m.name} (${m.displayId || m.uniqueId || m.id})`,
                displayId: m.displayId || m.uniqueId || m.id,
                groupId: m.groupid || m.groupId,
              }))}
              value={selectedMember}
              onChange={setSelectedMember}
              placeholder="সদস্যের নাম বা আইডি দিয়ে খুঁজুন..."
              isSearchable
              noOptionsMessage={() => "কোনো সদস্য পাওয়া যায়নি"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  height: "48px",
                  fontSize: "15px",
                  borderRadius: "16px",
                  borderColor: state.isFocused ? "#4f46e5" : "#e2e8f0",
                  boxShadow: state.isFocused ? "0 0 0 1px #4f46e5" : "none",
                  "&:hover": { borderColor: "#4f46e5" },
                }),
                placeholder: (base) => ({ ...base, color: "#94a3b8" }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isSelected
                    ? "#4f46e5"
                    : state.isFocused
                      ? "#f8fafc"
                      : "transparent",
                }),
              }}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              টাকার পরিমাণ
            </label>
            <div className="relative group/input">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within/input:text-indigo-600 transition-colors">
                ৳
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 h-[48px] text-lg font-bold border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              পেমেন্ট মাধ্যম
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 h-[48px] bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              <option value="manual">নগদ / ক্যাশ</option>
              <option value="bkash">বিকাশ</option>
              <option value="nagad">নগদ</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group/btn active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>ডোনেট</span>
                  <svg
                    className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Section: Donation History */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-xl font-bold">
              📋
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                ডোনেশন হিস্ট্রি
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                সর্বশেষ {donations.length} টি তথ্য
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <span className="px-4 py-1.5 bg-white rounded-xl shadow-sm text-sm font-black text-indigo-600 border border-slate-100 italic">
              TOTAL: {donations.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-50">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  তারিখ
                </th>
                <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  সদস্য ও আইডি
                </th>
                <th className="px-8 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                  মাস
                </th>
                <th className="px-8 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                  পরিমাণ
                </th>
                <th className="px-8 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  স্ট্যাটাস
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {dataLoading.donations ? (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-slate-400">
                        ইতিহাস লোড হচ্ছে...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-3xl">
                        🏜️
                      </div>
                      <p className="text-slate-400 font-black">
                        কোনো ডোনেশন রেকর্ড পাওয়া যায়নি
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                donations.map((d, index) => (
                  <tr
                    key={d.id}
                    className="group hover:bg-slate-50/80 transition-all duration-300"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {d.date?.toDate
                            ? d.date.toDate().toLocaleDateString("bn-BD")
                            : new Date(d.createdAt).toLocaleDateString("bn-BD")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {d.date?.toDate
                            ? d.date.toDate().toLocaleTimeString("bn-BD", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                          {d.userName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800">
                            {d.userName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                              {d.memberDisplayId || d.uniqueId}
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded lowercase">
                              @{d.groupId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                      {d.month}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <span className="text-lg font-black text-indigo-600 tabular-nums">
                        ৳{d.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <span
                          className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all duration-300
                          ${
                            d.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600"
                              : "bg-amber-50 text-amber-700 border-amber-100 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500"
                          }`}
                        >
                          {d.status === "approved" ? "Success" : "Pending"}
                        </span>
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
  );
}
