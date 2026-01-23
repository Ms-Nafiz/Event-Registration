import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";

export default function FamilySummaryPage() {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Members
    const qMembers = query(collection(db, "members"));
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
        toast.error("ডাটা লোড করতে সমস্যা হয়েছে।");
        setLoading(false);
      },
    );

    return () => {
      unsubscribeMembers();
      unsubscribeGroups();
    };
  }, []);

  // Calculate Summary Data
  const summaryData = groups.map((group) => {
    const groupMembers = members.filter((m) => {
      const mGroupId = m.groupid || m.groupId;
      return (
        mGroupId == group.id ||
        (mGroupId &&
          group.name &&
          mGroupId.toString().trim().toLowerCase() ===
            group.name.toString().trim().toLowerCase())
      );
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      total: groupMembers.length,
      male: groupMembers.filter((m) => m.gender === "Male").length,
      female: groupMembers.filter((m) => m.gender === "Female").length,
    };
  });

  const grandTotal = summaryData.reduce((acc, curr) => acc + curr.total, 0);
  const totalMale = summaryData.reduce((acc, curr) => acc + curr.male, 0);
  const totalFemale = summaryData.reduce((acc, curr) => acc + curr.female, 0);

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
              বংশ ও সদস্য সারাংশ
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              সকল গ্রুপের সদস্যদের পরিসংখ্যান একনজরে দেখুন
            </p>
          </div>
          <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="text-center px-4 border-r border-indigo-100">
              <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest">
                মোট সদস্য
              </p>
              <p className="text-xl font-black text-indigo-700">{grandTotal}</p>
            </div>
            <div className="text-center px-4 border-r border-indigo-100">
              <p className="text-[10px] uppercase font-black text-blue-400 tracking-widest">
                পুরুষ
              </p>
              <p className="text-xl font-black text-blue-700">{totalMale}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] uppercase font-black text-pink-400 tracking-widest">
                মহিলা
              </p>
              <p className="text-xl font-black text-pink-700">{totalFemale}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  গ্রুপের নাম
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  মোট সদস্য
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  পুরুষ
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  মহিলা
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  বিবরণ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {summaryData.map((data) => (
                <tr
                  key={data.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                        {data.name?.charAt(0)}
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {data.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">
                      {data.total}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold border border-blue-100">
                      {data.male}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-sm font-bold border border-pink-100">
                      {data.female}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p
                      className="text-xs text-slate-500 font-medium line-clamp-1"
                      title={data.description}
                    >
                      {data.description || "-"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="bg-slate-50/80 font-bold">
              <tr>
                <td className="px-6 py-4 text-sm text-slate-800">সর্বমোট</td>
                <td className="px-6 py-4 text-center text-sm text-indigo-700">
                  {grandTotal}
                </td>
                <td className="px-6 py-4 text-center text-sm text-blue-700">
                  {totalMale}
                </td>
                <td className="px-6 py-4 text-center text-sm text-pink-700">
                  {totalFemale}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {summaryData.length === 0 && (
          <div className="py-20 text-center text-slate-400 italic font-bangla">
            কোনো গ্রুপ পাওয়া যায়নি
          </div>
        )}
      </div>

      {/* Grid view for visual breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData
          .filter((d) => d.total > 0)
          .map((data) => (
            <div
              key={data.id}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-125 duration-500 opacity-50"></div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {data.name}
              </h3>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-xs font-bold text-slate-500">
                    মোট সদস্য
                  </span>
                  <span className="text-sm font-black text-slate-800">
                    {data.total}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 text-center">
                    <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">
                      পুরুষ
                    </p>
                    <p className="text-lg font-black text-blue-600">
                      {data.male}
                    </p>
                  </div>
                  <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/50 text-center">
                    <p className="text-[10px] font-bold text-pink-400 uppercase mb-1">
                      মহিলা
                    </p>
                    <p className="text-lg font-black text-pink-600">
                      {data.female}
                    </p>
                  </div>
                </div>

                {/* Attendance/Ratio simplified indicator */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(data.male / data.total) * 100}%` }}
                  ></div>
                  <div
                    className="h-full bg-pink-500"
                    style={{ width: `${(data.female / data.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>
                    পুরুষ {Math.round((data.male / data.total) * 100)}%
                  </span>
                  <span>
                    মহিলা {Math.round((data.female / data.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
