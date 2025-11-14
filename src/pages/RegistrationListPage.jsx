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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ১. প্রথমে সব গ্রুপ নিয়ে আসুন (নাম ম্যাপ করার জন্য)
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const groupsMap = {};
        groupsSnapshot.forEach((doc) => {
          // ID কে key এবং Name কে value হিসেবে রাখা হলো
          groupsMap[doc.id] = doc.data().name;
        });
        // ২. এবার রেজিস্ট্রেশন ডেটা আনুন
        const q = query(
          collection(db, "registrations"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();

          // গ্রুপের নাম বের করা (যদি ডেটায় সরাসরি না থাকে, তবে ID দিয়ে ম্যাপ থেকে বের করা)
          const groupNameResolve =
            docData.groupName || groupsMap[docData.group_id] || "N/A";

          // সদস্য সংখ্যা ঠিক করা (বানান ভিন্ন হতে পারে তাই দুটি চেক করা)
          const totalMemResolve =
            docData.totalMembers || docData.total_members || 0;

          return {
            id: doc.id,
            ...docData,
            // আমরা ফিক্সড ভ্যালুগুলো এখানে সেট করে দিচ্ছি
            finalGroupName: groupNameResolve,
            finalTotalMembers: totalMemResolve,
          };
        });

        // প্রতিটি ডেটার জন্য QR কোড তৈরি করা (PDF এর জন্য)
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

  return (
    <div className="p-6 md:p-8 font-bangla">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        📜 রেজিস্ট্রেশন তালিকা
      </h2>

      {/* --- Table --- */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        {loading && (
          <div className="p-6 text-center text-gray-500">লোড হচ্ছে...</div>
        )}

        {!loading && registrations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            এখনও কোনো রেজিস্ট্রেশন হয়নি।
          </div>
        )}

        {!loading && registrations.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  প্রতিনিধি (Rep)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  গ্রুপ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  মোট সদস্য
                </th>

                {/* === নতুন কলাম === */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  অতিরিক্ত সদস্য
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  পেমেন্ট স্ট্যাটাস
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  {/* Protinidhi-r tottho */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {reg.name}
                    </p>
                    <p className="text-sm text-gray-500">{reg.mobile}</p>
                  </td>

                  {/* Group */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {reg.finalGroupName || "N/A"}
                    </p>
                  </td>

                  {/* Mot Sodossho */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {reg.finalTotalMembers} জন
                    </p>
                  </td>

                  {/* অতিরিক্ত সদস্য তালিকা */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {reg.members && reg.members.length > 1 ? (
                      <ul className="list-disc list-inside">
                        {reg.members.slice(1).map((m, i) => (
                          <li key={i}>{m.member_name}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-xs">নেই</span>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reg.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-800"
                          : reg.paymentStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {reg.paymentStatus}
                    </span>
                  </td>

                  {/* Action Button */}
                  {/* ডাউনলোড বাটন */}
                  <td className="px-6 py-4 text-right">
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
                      fileName={`card-${reg.id}.pdf`}
                    >
                      {({ loading }) => (
                        <button
                          className={`
          flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer
          ${
            loading
              ? "border-gray-300 text-gray-400 bg-gray-50"
              : "border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100"
          }
        `}
                        >
                          {loading ? (
                            "লোডিং..."
                          ) : (
                            <>
                              {/* ছোট পিডিএফ আইকন */}
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
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                ></path>
                              </svg>
                              PDF
                            </>
                          )}
                        </button>
                      )}
                    </PDFDownloadLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Pagination Button --- */}
    </div>
  );
}
