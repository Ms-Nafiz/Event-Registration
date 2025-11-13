import { useState, useEffect } from 'react';
import { db } from '../firebase'; // Firebase connection
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// স্ট্যাটাস কার্ডের জন্য একটি ছোট কম্পোনেন্ট
function StatCard({ title, value, icon, colorClass }) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${colorClass}`}
    >
      <div className={`text-4xl ${colorClass.replace("border-", "text-")}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
 const [stats, setStats] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [groupStats, setGroupStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // ১. সব গ্রুপ নিয়ে আসা (নাম জানার জন্য)
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsMap = {}; // ID -> Name ম্যাপিং
        groupsSnapshot.forEach(doc => {
          groupsMap[doc.id] = doc.data().name;
        });

        // ২. সব রেজিস্ট্রেশন নিয়ে আসা (হিসাব করার জন্য)
        const regSnapshot = await getDocs(collection(db, "registrations"));
        const registrations = regSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));

        // ৩. পরিসংখ্যান (Stats) ক্যালকুলেশন
        let totalReg = 0;
        let totalMem = 0;
        let paid = 0;
        let pending = 0;
        const groupCounts = {}; // { groupId: { regCount: 0, memCount: 0 } }

        registrations.forEach(reg => {
            totalReg++;
            const memCount = parseInt(reg.totalMembers) || 0;
            totalMem += memCount;
            
            if(reg.paymentStatus === 'Paid') paid++;
            else if(reg.paymentStatus === 'Pending') pending++;

            // গ্রুপ অনুযায়ী হিসাব
            const gid = reg.group_id;
            if(gid) {
                if(!groupCounts[gid]) groupCounts[gid] = { regCount: 0, memCount: 0 };
                groupCounts[gid].regCount++;
                groupCounts[gid].memCount += memCount;
            }
        });

        // গ্রুপ স্ট্যাটস অ্যারে তৈরি করা
        const formattedGroupStats = Object.keys(groupCounts).map(gid => ({
            id: gid,
            name: groupsMap[gid] || 'অজানা গ্রুপ', // ম্যাপ থেকে নাম বের করা
            registrations_count: groupCounts[gid].regCount,
            total_members: groupCounts[gid].memCount
        }));

        // ৪. সাম্প্রতিক রেজিস্ট্রেশন (তারিখ অনুযায়ী সর্ট করে প্রথম ৫টি)
        const sortedRecent = [...registrations].sort((a, b) => {
             // createdAt টাইমস্ট্যাম্প হ্যান্ডেল করা
             const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
             const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
             return dateB - dateA;
        }).slice(0, 5);

        // ৫. সাম্প্রতিক ডেটায় গ্রুপের নাম বসানো
        const recentWithNames = sortedRecent.map(reg => ({
            ...reg,
            groupName: groupsMap[reg.group_id] || 'N/A'
        }));

        // স্টেট আপডেট
        setStats({
            total_registrations: totalReg,
            total_members: totalMem,
            total_paid: paid,
            total_pending: pending
        });
        setGroupStats(formattedGroupStats);
        setRecentRegistrations(recentWithNames);

      } catch (error) {
        console.error(error);
        toast.error('ড্যাশবোর্ড ডেটা লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 font-bangla">ড্যাশবোর্ড লোড হচ্ছে...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 font-bangla">
      {/* --- স্ট্যাটাস কার্ড --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="মোট রেজিস্ট্রেশন" value={stats?.total_registrations || 0} icon="📄" colorClass="border-blue-500" />
        <StatCard title="মোট সদস্য" value={stats?.total_members || 0} icon="👥" colorClass="border-indigo-500" />
        <StatCard title="পরিশোধিত" value={stats?.total_paid || 0} icon="✅" colorClass="border-green-500" />
        <StatCard title="মুলতবি" value={stats?.total_pending || 0} icon="⏳" colorClass="border-yellow-500" />
      </div>

      {/* --- সাম্প্রতিক রেজিস্ট্রেশন তালিকা --- */}
      <div className="grid grid-cols-1  gap-8">
        {/* --- সাম্প্রতিক রেজিস্ট্রেশন --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">সাম্প্রতিক রেজিস্ট্রেশন</h3>
            <Link to="/admin/list" className="text-sm text-indigo-600 hover:underline">সব দেখুন &rarr;</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">গ্রুপ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">সদস্য</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRegistrations.length > 0 ? recentRegistrations.map((reg) => (
                  <tr key={reg.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{reg.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{reg.groupName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{reg.totalMembers} জন</td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">কোনো তথ্য নেই।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- গ্রুপ অনুযায়ী সারসংক্ষেপ (Group Summary) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">গ্রুপ অনুযায়ী পরিসংখ্যান</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">গ্রুপের নাম</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">রেজিস্ট্রেশন</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">মোট সদস্য</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupStats.length > 0 ? groupStats.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 text-sm text-center text-gray-700">{group.registrations_count}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold text-gray-900">{group.total_members} জন</td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">কোনো গ্রুপ ডেটা নেই।</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
