import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function AdminRegistrationUploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "groups"));
        const groupsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description,
        }));
        setGroups(groupsList);
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };
    fetchGroups();
  }, []);

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

  const handleUpload = async () => {
    if (previewData.length === 0) return toast.error("কোনো ডেটা পাওয়া যায়নি।");
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const registrationsRef = collection(db, "registrations");

      // Grouping logic by Mobile
      const groupedData = {};
      previewData.forEach((row) => {
        const mobile = row["Mobile"]?.toString().replace(/['" ]/g, "");
        if (!mobile) return;

        if (!groupedData[mobile]) {
          groupedData[mobile] = {
            name: row["Head Name"] || row["Participant Name"],
            mobile: mobile,
            email: row["Email"] || "",
            group_id: "",
            contributeAmount: row["Amount"] || 0,
            paymentStatus: row["Status"] || "Pending",
            members: [],
          };

          // Find group ID
          const groupName = row["Group"];
          const group = groups.find(
            (g) =>
              g.name?.toLowerCase() === groupName?.toLowerCase() ||
              g.description?.toLowerCase() === groupName?.toLowerCase()
          );
          if (group) {
            groupedData[mobile].group_id = group.id;
          }
        }

        groupedData[mobile].members.push({
          member_name: row["Participant Name"] || "",
          gender: row["Gender"] || "Male",
          age: row["Age"] || "",
          t_shirt_size: row["T-Shirt Size"] || "L",
        });
      });

      const finalRegistrations = Object.values(groupedData);
      let successCount = 0;

      for (const reg of finalRegistrations) {
        if (!reg.group_id) {
          console.warn(
            `Skipping registration for ${reg.mobile}: Group not found.`
          );
          continue;
        }

        const regId = "HF-" + Math.floor(100000 + Math.random() * 900000);
        const newDocRef = doc(registrationsRef);

        batch.set(newDocRef, {
          ...reg,
          id: regId,
          totalMembers: reg.members.length,
          createdAt: new Date(),
          importSource: "excel_upload",
        });
        successCount++;
      }

      if (successCount > 0) {
        await batch.commit();
        toast.success(`${successCount} টি রেজিস্ট্রেশন সফলভাবে আপলোড হয়েছে!`);
        setFile(null);
        setPreviewData([]);
      } else {
        toast.error(
          "পর্যাপ্ত বা সঠিক ডেটা পাওয়া যায়নি। গ্রুপ নামগুলো ঠিক আছে কিনা নিশ্চিত করুন।"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const data = [
      {
        Mobile: "01711223344",
        "Head Name": "M Nafiz",
        Email: "nafiz@example.com",
        Group: "2010",
        Amount: 2000,
        Status: "Paid",
        "Participant Name": "M Nafiz",
        Gender: "Male",
        Age: 32,
        "T-Shirt Size": "L",
      },
      {
        Mobile: "01711223344",
        "Head Name": "M Nafiz",
        Email: "nafiz@example.com",
        Group: "2010",
        Amount: 2000,
        Status: "Paid",
        "Participant Name": "Mrs. Nafiz",
        Gender: "Female",
        Age: 28,
        "T-Shirt Size": "M",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, "registration_sample.xlsx");
  };

  return (
    <div className="font-bangla max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            বাল্ক রেজিস্ট্রেশন আপলোড
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            এক্সেল ফাইল ব্যবহার করে একসাথে অনেক সদস্য যোগ করুন
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={downloadSample}
            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 font-bold"
          >
            <span>📥</span> স্যাম্পল ফাইল ডাউনলোড
          </button>
          <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed text-right">
            Mobile, Head Name, Email, Group, Amount, Status, Participant Name,
            Gender, Age, T-Shirt Size
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 hover:bg-gray-50 transition-colors text-center">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-sm text-gray-600 mb-6">
            রেজিস্ট্রেশন ডেটা সম্বলিত Excel ফাইল (.xlsx) এখানে ড্রপ করুন
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="reg-file-upload"
          />
          <label
            htmlFor="reg-file-upload"
            className="cursor-pointer px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            ফাইল বাছাই করুন
          </label>
          {file && (
            <p className="mt-4 text-sm font-semibold text-green-600">
              নির্বাচিত: {file.name}
            </p>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-700">
                ফাইল প্রিভিউ ({previewData.length} সারি)
              </h3>
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`px-6 py-2 rounded-lg text-white font-bold text-sm shadow-lg transition-all ${
                  loading
                    ? "bg-gray-400"
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                }`}
              >
                {loading ? "আপলোড হচ্ছে..." : "সব আপলোড নিশ্চিত করুন"}
              </button>
            </div>

            <div className="overflow-x-auto border rounded-xl shadow-inner bg-gray-50">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left font-bold text-gray-600 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {previewData.slice(0, 15).map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-4 py-3 text-gray-700">
                          {val?.toString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.length > 15 && (
              <p className="text-xs text-gray-400 text-center italic">
                আরও {previewData.length - 15} টি সারি প্রিভিউতে দেখানো হয়নি...
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h4 className="text-sm font-bold text-indigo-800 mb-2">
          💡 সাহায্য এবং টিপস:
        </h4>
        <ul className="text-xs text-indigo-700 space-y-1 ml-4 list-disc">
          <li>
            একই মোবাইল নম্বর ব্যবহার করলে মেম্বারদের একটি রেজিস্ট্রেশনের অধীনে
            রাখা হবে।
          </li>
          <li>
            গ্রুপের নাম অবশ্যই সিস্টেমের নামের সাথে হুবহু মিলতে হবে (যেমন:
            "2010" বা "Bsc 1st Batch")।
          </li>
          <li>পেমেন্ট স্ট্যাটাস "Paid", "Pending" বা "Waived" হতে পারে।</li>
        </ul>
      </div>
    </div>
  );
}
