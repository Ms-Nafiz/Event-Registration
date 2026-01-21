import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function AdminFamilyUploadPage() {
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
      const membersRef = collection(db, "members");

      let successCount = 0;

      for (const row of previewData) {
        const name = row["Name"] || row["সদস্যের নাম"];
        if (!name) continue;

        const randomId = Math.floor(100000 + Math.random() * 900000);
        const uniqueId = "M-" + randomId;
        const gen = row["Generation"] || row["জেনারেশন"] || 1;
        const displayId = `G${gen}-${randomId}`;
        const newDocRef = doc(membersRef);

        const saveData = {
          uniqueId: uniqueId,
          displayId: displayId,
          name: name,
          fatherId: row["Father ID"] || row["পিতার আইডি"] || "",
          motherId: row["Mother ID"] || row["মাতার আইডি"] || "",
          spouseIds: row["Spouse IDs"]
            ? row["Spouse IDs"]
                .toString()
                .split(",")
                .map((s) => s.trim())
            : [],
          childrenIds: row["Children IDs"]
            ? row["Children IDs"]
                .toString()
                .split(",")
                .map((c) => c.trim())
            : [],
          fatherName: row["Father Name"] || row["পিতার নাম"] || "",
          motherName: row["Mother Name"] || row["মাতার নাম"] || "",
          generation: row["Generation"] || row["জেনারেশন"] || 1,
          phone: row["Phone"] || row["মোবাইল"] || "",
          address: row["Address"] || row["ঠিকানা"] || "",
          gender: row["Gender"] || row["লিঙ্গ"] || "Male",
          groupid: "",
          birthdate: row["Birthdate"] || row["জন্ম তারিখ"] || "",
        };

        // Group Lookup
        const groupName =
          row["Group Name"] ||
          row["গ্রুপের নাম"] ||
          row["Group"] ||
          row["গ্রুপ"];
        const groupIdFromExcel = row["Group ID"] || row["গ্রুপ আইডি"];

        if (groupIdFromExcel) {
          saveData.groupid = groupIdFromExcel;
        } else if (groupName) {
          const group = groups.find(
            (g) => g.name?.toLowerCase() === groupName.toString().toLowerCase(),
          );
          if (group) saveData.groupid = group.id;
        }

        batch.set(newDocRef, {
          ...saveData,
          birthYear: row["Birth Year"] ? parseInt(row["Birth Year"]) : null,
          deathYear: row["Death Year"] ? parseInt(row["Death Year"]) : null,
          alive:
            row["Alive"]?.toString().toLowerCase() === "false" ? false : true,
          profession: row["Profession"] || row["পেশা"] || "",
          photoUrl: row["Photo URL"] || row["ছবি লিঙ্ক"] || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          importSource: "excel_upload",
        });
        successCount++;
      }

      if (successCount > 0) {
        await batch.commit();
        toast.success(`${successCount} জন সদস্য সফলভাবে আপলোড হয়েছে!`);
        setFile(null);
        setPreviewData([]);
      } else {
        toast.error("পর্যাপ্ত বা সঠিক ডেটা পাওয়া যায়নি।");
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
        Name: "শরিফুল ইসলাম",
        Gender: "Male",
        "Birth Year": 1950,
        Profession: "Farmer",
        Alive: "true",
        Phone: "017XXXXXXXX",
        Address: "ঢাকা, বাংলাদেশ",
        Generation: 1,
        "Group Name": "A Group",
        Birthdate: "1950-01-01",
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
        "Group Name": "A Group",
        Birthdate: "1980-06-15",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "family_members_sample.xlsx");
  };

  return (
    <div className="font-bangla max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            বাল্ক সদস্য আপলোড
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            এক্সেল ফাইল ব্যবহার করে বংশের সদস্যদের তথ্য একসাথে যোগ করুন
          </p>
        </div>
        <button
          onClick={downloadSample}
          className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1 font-bold"
        >
          <span>📥</span> স্যাম্পল ফাইল ডাউনলোড
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 hover:bg-gray-50 transition-colors text-center">
          <div className="text-5xl mb-4">📄</div>
          <p className="text-sm text-gray-600 mb-6">
            সদস্যের ডেটা সম্বলিত Excel ফাইল (.xlsx) এখানে ড্রপ করুন
          </p>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="member-file-upload"
          />
          <label
            htmlFor="member-file-upload"
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
            এক্সেলে 'Name', 'Father Name', 'Generation', 'Phone' কলামগুলো থাকতে
            হবে।
          </li>
          <li>
            প্রতিটি সদস্যের জন্য একটি ইউনিক আইডি সিস্টেম থেকে অটোমেটিক জেনারেট
            করা হবে।
          </li>
          <li>জেনারেশন নম্বর (১, ২, ৩...) দিয়ে বংশের ধাপ বুঝানো হয়।</li>
        </ul>
      </div>
    </div>
  );
}
