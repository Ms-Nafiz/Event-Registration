import { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  writeBatch,
  doc,
  Timestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function AdminDonationUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      readExcel(selectedFile);
    }
  };

  const readExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSample = () => {
    const data = [
      {
        "Member ID": "M-XXXXXX",
        Mobile: "017XXXXXXXX",
        Amount: 500,
        Month: "January 2026",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
    XLSX.writeFile(workbook, "bulk_donation_sample.xlsx");
    toast.success("স্যাম্পল ফাইল ডাউনলোড হচ্ছে...");
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return toast.error("কোনো ডেটা পাওয়া যায়নি।");
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const membersRef = collection(db, "members");
      const donationsRef = collection(db, "donations");

      const membersSnapshot = await getDocs(membersRef);
      const memberMap = {}; // Map by uniqueId and Mobile
      membersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uniqueId)
          memberMap[data.uniqueId] = {
            id: doc.id,
            name: data.name,
            displayId: data.displayId,
            groupId: data.groupid,
          };
        if (data.phone)
          memberMap[data.phone] = {
            id: doc.id,
            name: data.name,
            displayId: data.displayId,
            groupId: data.groupid,
          };
      });

      let successCount = 0;
      let failCount = 0;

      for (const row of previewData) {
        const memberIdInput = row["Member ID"]?.toString();
        const mobile = row["Mobile"]?.toString();
        const amount = row["Amount"];

        // Match by Member ID first, then Mobile
        const matchedMember = memberMap[memberIdInput] || memberMap[mobile];

        if (matchedMember && amount) {
          const newDocRef = doc(donationsRef);

          batch.set(newDocRef, {
            memberId: matchedMember.id,
            memberDisplayId: matchedMember.displayId,
            userName: matchedMember.name,
            groupId: matchedMember.groupId || "N/A",
            amount: Number(amount),
            date: Timestamp.now(),
            month:
              row["Month"] ||
              new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              }),
            paymentMethod: "excel_upload",
            status: "approved",
            createdAt: new Date().toISOString(),
          });
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        await batch.commit();
        toast.success(`${successCount} টি আপলোড সফল! (${failCount} টি ব্যর্থ)`);
        setFile(null);
        setPreviewData([]);
      } else {
        toast.error("কোনো ভ্যালিড ডোনেশন পাওয়া যায়নি।");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-bangla max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">বাল্ক ডোনেশন আপলোড</h1>
        <button
          onClick={downloadSample}
          className="text-xs text-indigo-600 hover:underline bg-transparent border-none cursor-pointer"
        >
          স্যাম্পল ফাইল ডাউনলোড
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 transition-colors">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm text-gray-600 mb-4">
            Excel ফাইল (.xlsx) ড্রপ করুন বা সিলেক্ট করুন
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            ফাইল সিলেক্ট করুন
          </label>
          {file && (
            <p className="mt-3 text-sm font-medium text-green-600">
              {file.name}
            </p>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="mt-6 text-left">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-700">
                প্রিভিউ ({previewData.length} রেকর্ড)
              </h3>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow hover:bg-green-700 transition-colors"
              >
                {loading ? "আপলোড হচ্ছে..." : "সব আপলোড করুন"}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left font-medium text-gray-500"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-3 py-2 text-gray-700">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 10 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                আরও {previewData.length - 10} টি রেকর্ড...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
