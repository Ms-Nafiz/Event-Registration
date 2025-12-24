import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function ScanQRPage() {
  const [enteredList, setEnteredList] = useState([]);
  const [totalEntered, setTotalEntered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const scannerRef = useRef(null);
  const scannerRegionId = "qr-reader";

  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("checkedIn", "==", true),
      orderBy("checkInTime", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        let totalPeople = 0;
        list.forEach(
          (item) => (totalPeople += parseInt(item.totalMembers || 0))
        );

        setEnteredList(list);
        setTotalEntered(totalPeople);
      },
      (error) => {
        console.error("Firestore query error:", error);
        toast.error("তালিকা লোড করা যায়নি।");
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!scannerRef.current) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerRegionId,
        {
          qrbox: { width: 250, height: 250 },
          fps: 10,
          rememberLastUsedCamera: true,
        },
        false
      );

      const onScanSuccess = (decodedText) => {
        if (loading) return;

        if (scannerRef.current) {
          scannerRef.current.pause(true);
        }
        setIsPaused(true);
        setLoading(true);
        setScanResult(decodedText);
        handleScanResult(decodedText);
      };

<<<<<<< HEAD
      html5QrcodeScanner.render(onScanSuccess, () => {});
=======
      html5QrcodeScanner.render(onScanSuccess, (error) => {});
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      scannerRef.current = html5QrcodeScanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((error) => console.error("Scanner clear failed.", error));
        scannerRef.current = null;
      }
    };
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
=======
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
  }, []);

  const handleScanResult = async (scannedId) => {
    try {
      const q = query(
        collection(db, "registrations"),
        where("id", "==", scannedId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("❌ ভুল QR কোড! রেজিস্ট্রেশন পাওয়া যায়নি।");
      } else {
        const docData = querySnapshot.docs[0];
        const regData = docData.data();
        const docRef = doc(db, "registrations", docData.id);

        if (regData.checkedIn) {
<<<<<<< HEAD
          toast.error(`⚠️ ${regData.name} ইতিমধ্যে প্রবেশ করেছেন!`);
=======
          toast.error(
            `⚠️ ${regData.name} ইতিমধ্যে প্রবেশ করেছেন!`
          );
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
        } else {
          await updateDoc(docRef, { checkedIn: true, checkInTime: new Date() });
          toast.success(
            `✅ স্বাগতম ${regData.name}! (${regData.totalMembers} জন)`
          );
        }
      }
    } catch {
      toast.error("স্ক্যানিং এ সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scannerRef.current) {
          if (scannerRef.current.getState() === "PAUSED") {
            scannerRef.current.resume();
          }
          setIsPaused(false);
        }
      }, 2000);
    }
  };

  const handleResumeClick = () => {
    if (scannerRef.current && scannerRef.current.getState() === "PAUSED") {
      scannerRef.current.resume();
    }
    setIsPaused(false);
    setScanResult(null);
  };

  return (
    <div className="p-4 md:p-8 font-bangla max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">এন্ট্রি স্ক্যানার</h2>
        <p className="text-sm text-gray-500">অতিথিদের QR কোড স্ক্যান করুন</p>
      </div>

      {/* Scanner Section */}
      <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 overflow-hidden relative">
        <div
          id={scannerRegionId}
<<<<<<< HEAD
          className={`w-full rounded-xl overflow-hidden ${
            isPaused ? "hidden" : "block"
          }`}
=======
          className={`w-full rounded-xl overflow-hidden ${isPaused ? "hidden" : "block"}`}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
        ></div>

        {/* Paused/Result View */}
        {isPaused && (
          <div className="absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center text-white p-6 z-10">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">যাচাই করা হচ্ছে...</p>
                <p className="text-sm text-gray-400 mt-2">ID: {scanResult}</p>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
<<<<<<< HEAD
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">স্ক্যান সম্পন্ন!</h3>
                  <p className="text-gray-400 mt-1 text-sm break-all">
                    {scanResult}
                  </p>
=======
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">স্ক্যান সম্পন্ন!</h3>
                  <p className="text-gray-400 mt-1 text-sm break-all">{scanResult}</p>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                </div>
                <button
                  onClick={handleResumeClick}
                  className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg active:scale-95"
                >
                  আবার স্ক্যান করুন
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
        <div>
<<<<<<< HEAD
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">
            মোট প্রবেশ করেছে
          </p>
          <h3 className="text-4xl font-bold mt-1">
            {totalEntered}{" "}
            <span className="text-lg font-normal opacity-80">জন</span>
          </h3>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
=======
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">মোট প্রবেশ করেছে</p>
          <h3 className="text-4xl font-bold mt-1">{totalEntered} <span className="text-lg font-normal opacity-80">জন</span></h3>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
        </div>
      </div>

      {/* Recent Entries List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-bold text-gray-800">সাম্প্রতিক এন্ট্রি</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
          {enteredList.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {enteredList.map((user) => (
<<<<<<< HEAD
                <div
                  key={user.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
=======
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
<<<<<<< HEAD
                      <p className="font-bold text-gray-800 text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {user.id.slice(0, 8)}...
                      </p>
=======
                      <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</p>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">
                    +{user.totalMembers} জন
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              এখনও কেউ প্রবেশ করেনি।
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
