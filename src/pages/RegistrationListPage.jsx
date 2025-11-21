import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import toast from "react-hot-toast";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { EntryCardDocument } from "../components/EntryCardPDF";
import QRCode from "qrcode";

export default function RegistrationListPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsMap = {};
        groupsSnapshot.forEach((doc) => {
          groupsMap[doc.id] = doc.data().name;
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
            id: doc.id,
            ...docData,
            finalGroupName: groupNameResolve,
            finalTotalMembers: totalMemResolve,
          };
        });

        const dataWithQR = await Promise.all(
          data.map(async (item) => {
            const qrUrl = await QRCode.toDataURL(item.id);
            return { ...item, qrCodeUrl: qrUrl };
          })
        );

        setRegistrations(dataWithQR);
      } catch (error) {
        toast.error("ডেটা লোড করা যায়নি");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter logic
  const filteredRegistrations = registrations.filter(reg => 
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.mobile.includes(searchTerm) ||
    (reg.finalGroupName && reg.finalGroupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 font-bangla max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">রেজিস্ট্রেশন তালিকা</h2>
          <p className="text-sm text-gray-500">মোট রেজিস্ট্রেশন: {filteredRegistrations.length}</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="নাম, মোবাইল বা গ্রুপ খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">প্রতিনিধি</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">গ্রুপ</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">সদস্য</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">অতিরিক্ত সদস্য</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{reg.name}</div>
                        <div className="text-xs text-gray-400">{reg.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded text-xs">{reg.finalGroupName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                        {reg.finalTotalMembers}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {reg.members && reg.members.length > 1 ? (
                          <span title={reg.members.slice(1).map(m => m.member_name).join(", ")}>
                            {reg.members.length - 1} জন অতিরিক্ত
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          reg.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : 
                          reg.paymentStatus === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {reg.paymentStatus === "Paid" ? "পরিশোধিত" : "অপেক্ষমান"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <PDFDownloadLink
                          document={<EntryCardDocument data={{...reg, groupName: reg.finalGroupName, totalMembers: reg.finalTotalMembers}} qrCodeUrl={reg.qrCodeUrl} />}
                          fileName={`card-${reg.id}.pdf`}
                        >
                          {({ loading }) => (
                            <button className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              loading ? "bg-gray-100 text-gray-400" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            }`}>
                              {loading ? "..." : <><span>⬇</span> PDF</>}
                            </button>
                          )}
                        </PDFDownloadLink>
                      </td>
                    </tr>
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
                      <h3 className="text-sm font-bold text-gray-900">{reg.name}</h3>
                      <p className="text-xs text-gray-500">{reg.mobile}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      reg.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {reg.paymentStatus === "Paid" ? "পরিশোধিত" : "অপেক্ষমান"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <div>
                      <span className="block text-gray-400 text-[10px] uppercase">গ্রুপ</span>
                      <span className="font-medium">{reg.finalGroupName}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400 text-[10px] uppercase">সদস্য</span>
                      <span className="font-bold text-gray-800">{reg.finalTotalMembers} জন</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <PDFDownloadLink
                      document={<EntryCardDocument data={{...reg, groupName: reg.finalGroupName, totalMembers: reg.finalTotalMembers}} qrCodeUrl={reg.qrCodeUrl} />}
                      fileName={`card-${reg.id}.pdf`}
                    >
                      {({ loading }) => (
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform">
                          {loading ? "প্রসেসিং..." : "কার্ড ডাউনলোড করুন"}
                        </button>
                      )}
                    </PDFDownloadLink>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
