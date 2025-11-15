import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'; // Html5Qrcode ইম্পোর্ট করুন
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ScanQRPage() {
  const [enteredList, setEnteredList] = useState([]);
  const [totalEntered, setTotalEntered] = useState(0);
  const [loading, setLoading] = useState(false); // "যাচাই করা হচ্ছে"
  const [scanResult, setScanResult] = useState(null);
  
  // --- নতুন স্টেট ---
  // স্ক্যানারটি পজড (Paused) অবস্থায় আছে কিনা তা ট্র্যাক করার জন্য
  const [isPaused, setIsPaused] = useState(false); 

  // --- ১. রিয়েল-টাইম এন্ট্রি লিস্ট (ইনডেক্স সহ) ---
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("checkedIn", "==", true),
      orderBy("checkInTime", "desc") // নতুন এন্ট্রি উপরে দেখানোর জন্য
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      let totalPeople = 0;
      list.forEach(item => totalPeople += parseInt(item.totalMembers || 0));
      setEnteredList(list);
      setTotalEntered(totalPeople);
    }, (error) => {
      console.error("Firestore query error (Index needed?):", error);
      toast.error("লাইভ তালিকা লোড করা যায়নি।");
    });

    return () => unsubscribe();
  }, []);

  // --- ২. QR স্ক্যানার চালু করা ---
  useEffect(() => {
    // স্ক্যানার অবজেক্টটি এই কম্পোনেন্টের বাইরে তৈরি করা হলো যাতে state আপডেটে রেন্ডার না হয়
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader', { qrbox: { width: 250, height: 250 }, fps: 10, rememberLastUsedCamera: true }, false
    );

    const onScanSuccess = (decodedText) => {
      // স্ক্যানার পজ করুন এবং স্টেট আপডেট করুন
      html5QrcodeScanner.pause(true);
      setIsPaused(true);
      setLoading(true);
      setScanResult(decodedText);
      handleScanResult(decodedText); // ফায়ারবেস লজিক কল করুন
    };

    scanner.render(onScanSuccess, (error) => {});

    // কম্পোনেন্টটি বন্ধ হলে ক্যামেরা রিলিজ করুন
    return () => {
      html5QrcodeScanner.clear().catch(error => console.error("Scanner clear failed.", error));
    };
  }, []); // [] খালি রাখা নিশ্চিত করুন

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
      setLoading(false); // "যাচাই করা হচ্ছে" লোডার বন্ধ করুন
    }
  };

  // --- ৪. নতুন বাটন ক্লিক হ্যান্ডেলার ---
  const handleResumeClick = () => {
    const scanner = Html5QrcodeScanner.getScanner("qr-reader");
    if (scanner && scanner.getState() === "PAUSED") {
        scanner.resume();
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
        <div id="qr-reader" className={`w-full ${isPaused ? 'hidden' : 'block'}`}></div> 

        {/* --- পজড (Paused) মেসেজ --- */}
        {isPaused && (
          <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-800 text-white p-4">
            {loading ? (
              <>
                <svg className="animate-spin h-8 w-8 text-white mb-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w_...svg">...</svg>
                <p className="text-lg">যাচাই করা হচ্ছে...</p>
                <p className="text-sm">রেজাল্ট: {scanResult}</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-4">স্ক্যান সম্পন্ন। রেজাল্ট: {scanResult}</p>
                {/* --- আসল বাটন --- */}
                <button
                  onClick={handleResumeClick}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700"
                >
                  আবার স্ক্যান করুন
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* --- পরিসংখ্যান (আগের মতোই) --- */}
      <div className="mt-6 bg-green-100 p-4 rounded-lg border border-green-400 text-center">
        <h3 className="text-xl font-bold text-green-800">মোট প্রবেশ করেছে</h3>
        <p className="text-4xl font-bold text-green-600">{totalEntered} জন</p>
      </div>

      {/* --- যারা প্রবেশ করেছে তাদের তালিকা (আগের মতোই) --- */}
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-2">সাম্প্রতিক এন্ট্রি (নতুনটি উপরে):</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden max-h-60 overflow-y-auto">
          {/* ... তালিকা এখানে ... */}
          {enteredList.map((user) => (
             <li key={user.id} className="p-3 list-none flex justify-between items-center border-b">
                {/* ... */}
             </li>
          ))}
        </div>
      </div>
    </div>
  );
}