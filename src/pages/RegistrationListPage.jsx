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
        // Firebase থেকে ডেটা আনা
        const q = query(
          collection(db, "registrations"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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
                      {reg.group?.name || "N/A"}
                    </p>
                  </td>

                  {/* Mot Sodossho */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {reg.total_members} জন
                    </p>
                  </td>

                  {/* === নতুন কলামের ডেটা === */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Prothom sodossho (index 0) holo protinidhi, tai take bad diye baki-der dekhano hocche
                     */}
                    {reg.members && reg.members.length > 1 ? (
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {reg.members
                          .filter((member, index) => index > 0) // Prothom sodossho (protinidhi) bad din
                          .map((member) => (
                            <li
                              key={member.id}
                              title={`Gender: ${member.gender}, T-Shirt: ${
                                member.t_shirt_size || "N/A"
                              }`}
                            >
                              {member.member_name}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">নেই</span>
                    )}
                  </td>

                  {/* Payment Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reg.payment_status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : reg.payment_status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {reg.payment_status}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <PDFDownloadLink
                      document={
                        <EntryCardDocument
                          data={reg}
                          qrCodeUrl={reg.qrCodeUrl}
                        />
                      }
                      fileName={`card-${reg.id}.pdf`}
                      className="text-blue-600 hover:underline"
                    >
                      {({ loading }) => (loading ? "Loading..." : "Download")}
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
