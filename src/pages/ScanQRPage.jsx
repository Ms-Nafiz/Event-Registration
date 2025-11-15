import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ScanQRPage() {
  const [enteredList, setEnteredList] = useState([]);
  const [totalEntered, setTotalEntered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // --- ১. রিয়েল-টাইম এন্ট্রি লিস্ট (ইনডেক্স তৈরির পর এটি কাজ করবে) ---
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("checkedIn", "==", true),
      orderBy("checkInTime", "desc") // <-- নতুন এন্ট্রি উপরে দেখানোর জন্য
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let totalPeople = 0;
      list.forEach(item => totalPeople += parseInt(item.totalMembers || 0));
      
      setEnteredList(list);
      setTotalEntered(totalPeople);
    }, 
    (error) => {
      // এই এররটি কনসোলে দেখাবে যদি ইনডেক্স তৈরি না হয়
      console.error("Firestore query error:", error);
      toast.error("ইনডেক্স তৈরি করা প্রয়োজন। কনসোল চেক করুন।");
    });

    return () => unsubscribe();
  }, []);

  // --- ২. QR স্ক্যানার চালু করা ---
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', { qrbox: { width: 250, height: 250 }, fps: 10, rememberLastUsedCamera: true }, false
    );

    let isScanning = true;

    const onScanSuccess = (decodedText) => {
      if (!isScanning) return; 

      isScanning = false; 
      scanner.pause(true); 
      setLoading(true);
      setScanResult(decodedText); 
      handleScanResult(decodedText); 
    };

    scanner.render(onScanSuccess, (error) => {});

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Scanner clear failed.", error));
      }
    };
  }, []); // [] খালি রাখা নিশ্চিত করুন

  // --- ৩. ফায়ারবেস লজিক ---
  const handleScanResult = async (scannedId) => {
    try {
      const q = query(collection(db, "registrations"), where("id", "==", scannedId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('❌ ভুল QR কোড! রেজিস্ট্রেশন পাওয়া যায়নি।');
        resumeScan(); // <-- 'finally' তে না রেখে এখানে কল করুন
        return;
      }

      const docData = querySnapshot.docs[0];
      const regData = docData.data();
      const docRef = doc(db, "registrations", docData.id);

      if (regData.checkedIn) {
        toast.error(`⚠️ ${regData.name} (${regData.id}) ইতিমধ্যে প্রবেশ করেছেন!`);
      } else {
        await updateDoc(docRef, {
          checkedIn: true,
          checkInTime: new Date()
        });
        toast.success(`✅ স্বাগতম ${regData.name}! (${regData.totalMembers} জন)`);
      }
      
      resumeScan(); // <-- সফল বা ব্যর্থ উভয় ক্ষেত্রেই এখানে কল করুন

    } catch (err) {
      console.error(err);
      toast.error('স্ক্যানিং এ সমস্যা হয়েছে।');
      resumeScan(); // <-- এরর হলেও স্ক্যানার চালু করুন
    } 
    // `finally` ব্লকটি বাদ দেওয়া হলো কারণ `resumeScan` এখন সব কন্ডিশনে কল হচ্ছে
  };

  // স্ক্যানার আবার চালু করার ফাংশন
  const resumeScan = () => {
    setTimeout(() => {
      const scanner = Html5QrcodeScanner.getScanner("qr-reader");
      if (scanner && scanner.getState() === "PAUSED") {
          scanner.resume();
      }
      setLoading(false); // <-- লোডার এখানে বন্ধ করুন
      setScanResult('আবার স্ক্যান করুন...');
      // isScanning = true; // এটি onScanSuccess-এ সেট করা আছে, তবে এখানেও করা যেতে পারে
    }, 3000); 
  };

  return (
    <div className="p-4 font-bangla max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">📲 এন্ট্রি স্ক্যানার</h2>

      {/* --- ক্যামেরা সেকশন --- */}
      <div className="bg-gray-100 rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-500 relative">
        <div id="qr-reader" className="w-full"></div> 

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-70 text-white">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            যাচাই করা হচ্ছে...
          </div>
        )}
        
        {scanResult && !loading && ( // শুধু লোডিং শেষ হলে রেজাল্ট দেখান
          <div className="bg-white p-2 text-center font-bold text-gray-800">
            {scanResult}
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
                {enteredList.map((user) => (
                    <li key={user.id} className="p-3 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                            +{user.totalMembers} জন
                        </span>
                    </li>
                ))}
                {enteredList.length === 0 && (
                    <li className="p-4 text-center text-gray-500">এখনও কেউ প্রবেশ করেনি।</li>
                )}
            </ul>
        </div>
      </div>
    </div>
  );
}