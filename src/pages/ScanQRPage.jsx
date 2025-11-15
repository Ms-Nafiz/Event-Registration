import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ScanQRPage() {
  const [enteredList, setEnteredList] = useState([]);
  const [totalEntered, setTotalEntered] = useState(0);
  const [loading, setLoading] = useState(false); // "যাচাই করা হচ্ছে"
  const [scanResult, setScanResult] = useState(null);
  const [isPaused, setIsPaused] = useState(false); // স্ক্যানার পজড কিনা

  // স্ক্যানার অবজেক্টকে রেফারেন্সে রাখা (এটি রিরেন্ডার হলেও টিকে থাকবে)
  const scannerRef = useRef(null); 
  // স্ক্যানার যে div এ রেন্ডার হবে তার ID
  const scannerRegionId = "qr-reader"; 

  // --- ১. রিয়েল-টাইম এন্ট্রি লিস্ট (ইনডেক্স সহ) ---
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("checkedIn", "==", true),
      orderBy("checkInTime", "desc") // নতুন এন্ট্রি উপরে
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let totalPeople = 0;
      list.forEach(item => totalPeople += parseInt(item.totalMembers || 0));
      
      setEnteredList(list); // <-- তালিকা আপডেট
      setTotalEntered(totalPeople); // <-- মোট সংখ্যা আপডেট
    }, 
    (error) => {
      console.error("Firestore query error (Index needed?):", error);
      toast.error("তালিকা লোড করা যায়নি। Firebase Console চেক করুন।");
    });

    return () => unsubscribe();
  }, []); // [] খালি রাখা নিশ্চিত করুন (শুধু একবার চলবে)

  // --- ২. QR স্ক্যানার চালু করা ---
  useEffect(() => {
    // শুধুমাত্র যদি স্ক্যানার আগে তৈরি না হয়ে থাকে
    if (!scannerRef.current) { 
      const html5QrcodeScanner = new Html5QrcodeScanner(
        scannerRegionId, 
        { qrbox: { width: 250, height: 250 }, fps: 10, rememberLastUsedCamera: true }, 
        false
      );

      const onScanSuccess = (decodedText) => {
        // যদি একটি স্ক্যান প্রসেসিং অবস্থায় থাকে (loading = true), তবে নতুন স্ক্যান নেব না
        if (loading) return; 

        // স্ক্যানার পজ করুন (ref ব্যবহার করে)
        if(scannerRef.current) {
            scannerRef.current.pause(true);
        }
        setIsPaused(true); 
        setLoading(true); // "যাচাই করা হচ্ছে..." চালু
        setScanResult(decodedText);
        handleScanResult(decodedText); // ফায়ারবেস লজিক কল করুন
      };

      html5QrcodeScanner.render(onScanSuccess, (error) => {});
      scannerRef.current = html5QrcodeScanner; // রেফারেন্সে সেভ করুন
    }

    // কম্পোনেন্টটি বন্ধ হলে ক্যামেরা রিলিজ করুন
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Scanner clear failed.", error));
        scannerRef.current = null;
      }
    };
  }, []); // <-- এই খালি অ্যারেটি [ ] খুবই গুরুত্বপূর্ণ, এটিই বাগ ফিক্স করে

  // --- ৩. ফায়ারবেস লজিক ---
  const handleScanResult = async (scannedId) => {
    try {
      const q = query(collection(db, "registrations"), where("id", "==", scannedId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('❌ ভুল QR কোড! রেজিস্ট্রেশন পাওয়া যায়নি।');
      } else {
        const docData = querySnapshot.docs[0];
        const regData = docData.data();
        const docRef = doc(db, "registrations", docData.id);

        if (regData.checkedIn) {
          toast.error(`⚠️ ${regData.name} (${regData.id}) ইতিমধ্যে প্রবেশ করেছেন!`);
        } else {
          await updateDoc(docRef, { checkedIn: true, checkInTime: new Date() });
          toast.success(`✅ স্বাগতম ${regData.name}! (${regData.totalMembers} জন)`);
        }
      }
    } catch (err) {
      toast.error('স্ক্যানিং এ সমস্যা হয়েছে।');
    } finally {
      // লোডার বন্ধ করুন, কিন্তু স্ক্যানার পজড রাখুন
      setLoading(false); 
    }
  };

  // --- ৪. "আবার স্ক্যান করুন" বাটন ক্লিক হ্যান্ডেলার ---
  const handleResumeClick = () => {
    // ref থেকে স্ক্যানারটি খুঁজে বের করুন
    if (scannerRef.current && scannerRef.current.getState() === "PAUSED") {
        scannerRef.current.resume();
    }
    setIsPaused(false); // পজড স্টেট false করুন
    setScanResult(null); // রেজাল্ট মেসেজ ক্লিয়ার করুন
  };

  return (
    <div className="p-4 font-bangla max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">📲 এন্ট্রি স্ক্যানার</h2>

      {/* --- ক্যামেরা সেকশন --- */}
      <div className="bg-gray-100 rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-500 relative">
        
        {/* এই div-এর ভেতরে স্ক্যানারটি লোড হবে */}
        <div id={scannerRegionId} className={`w-full ${isPaused ? 'hidden' : 'block'}`}></div> 

        {/* --- পজড (Paused) মেসেজ --- */}
        {isPaused && (
          <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-800 text-white p-4">
            {loading ? (
              <>
                <svg className="animate-spin h-8 w-8 text-white mb-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">যাচাই করা হচ্ছে...</p>
                <p className="text-sm">রেজাল্ট: {scanResult}</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-4 text-center">স্ক্যান সম্পন্ন। <br/> রেজাল্ট: {scanResult}</p>
                {/* --- আসল বাটন --- */}
                <button
                  onClick={handleResumeClick}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 active:bg-indigo-800"
                >
                  আবার স্ক্যান করুন
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- পরিসংখ্যান --- */}
      <div className="mt-6 bg-green-100 p-4 rounded-lg border border-green-400 text-center">
        <h3 className="text-xl font-bold text-green-800">মোট প্রবেশ করেছে</h3>
        <p className="text-4xl font-bold text-green-600">{totalEntered} জন</p>
      </div>

      {/* --- যারা প্রবেশ করেছে তাদের তালিকা --- */}
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-2">সাম্প্রতিক এন্ট্রি (নতুনটি উপরে):</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden max-h-60 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
                {enteredList.length > 0 ? enteredList.map((user) => (
                    <li key={user.id} className="p-3 list-none flex justify-between items-center border-b">
                        <div>
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                            +{user.totalMembers} জন
                        </span>
                    </li>
                )) : (
                    <li className="p-4 text-center text-gray-500 list-none">এখনও কেউ প্রবেশ করেনি।</li>
                )}
            </ul>
        </div>
      </div>
    </div>
  );
}