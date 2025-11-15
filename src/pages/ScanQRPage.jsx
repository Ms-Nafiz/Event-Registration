import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode'; // <-- নতুন লাইব্রেরি ইম্পোর্ট
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ScanQRPage() {
  const [enteredList, setEnteredList] = useState([]);
  const [totalEntered, setTotalEntered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null); // স্ক্যানের রেজাল্ট রাখার জন্য

  // --- ১. রিয়েল-টাইম এন্ট্রি লিস্ট লোড করা (আগের মতোই) ---
  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      where("checkedIn", "==", true),
      //orderBy("checkInTime", "desc") Firebase-এ এই ইনডেক্সটি তৈরি করতে হতে পারে
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let totalPeople = 0;
      list.forEach(item => totalPeople += parseInt(item.totalMembers || 0));
      
      setEnteredList(list);
      setTotalEntered(totalPeople);
    }, (error) => {
      console.error("Error fetching live updates: ", error);
      toast.error("লাইভ আপডেট আনতে সমস্যা হচ্ছে।");
    });

    return () => unsubscribe();
  }, []);

  // --- ২. QR স্ক্যানার চালু করা ---
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader', // যে div-এ স্ক্যানার দেখাবে তার ID
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10, // ফ্রেম পার সেকেন্ড
        rememberLastUsedCamera: true,
      },
      false // verbose: false
    );

    let isScanning = true;

    // স্ক্যান সফল হলে এই ফাংশনটি কল হবে
    const onScanSuccess = (decodedText, decodedResult) => {
      if (!isScanning) return; // যদি প্রসেসিং চলতে থাকে, তবে নতুন স্ক্যান নয়

      isScanning = false; // স্ক্যান বন্ধ করুন
      scanner.pause(true); // ক্যামেরা পজ করুন
      setLoading(true);
      setScanResult(decodedText); // রেজাল্ট দেখান
      handleScanResult(decodedText); // ফায়ারবেস লজিক কল করুন
    };

    // স্ক্যানার রেন্ডার করুন
    scanner.render(onScanSuccess, (error) => {
      // console.warn(error); // এরর ইগনোর করুন
    });

    // কম্পোনেন্টটি বন্ধ হলে ক্যামেরা রিলিজ করুন (অত্যন্ত জরুরি)
    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear scanner.", error);
      });
    };
  }, []);

  // --- ৩. ফায়ারবেস লজিক (স্ক্যান সফল হওয়ার পর) ---
  const handleScanResult = async (scannedId) => {
    try {
      const q = query(collection(db, "registrations"), where("id", "==", scannedId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error('❌ ভুল QR কোড! রেজিস্ট্রেশন পাওয়া যায়নি।');
        resumeScan();
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

    } catch (err) {
      console.error(err);
      toast.error('স্ক্যানিং এ সমস্যা হয়েছে।');
    } finally {
      resumeScan();
    }
  };

  // নির্দিষ্ট সময় পর স্ক্যানার আবার চালু করার ফাংশন
  const resumeScan = () => {
    setTimeout(() => {
      // এই পেজটি যে স্ক্যানার ব্যবহার করছে তার অবজেক্ট পেতে হবে
      const scanner = Html5QrcodeScanner.getScanner("qr-reader");
      if (scanner && scanner.getState() === "PAUSED") {
          scanner.resume();
      }
      setLoading(false);
      setScanResult('আবার স্ক্যান করুন...');
    }, 3000); // ৩ সেকেন্ড পর আবার চালু হবে
  };

  return (
    <div className="p-4 font-bangla max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-indigo-700">📲 এন্ট্রি স্ক্যানার</h2>

      {/* --- ক্যামেরা সেকশন --- */}
      <div className="bg-gray-100 rounded-xl overflow-hidden shadow-2xl border-4 border-indigo-500 relative">
        
        {/* এই div-এর ভেতরে স্ক্যানারটি লোড হবে */}
        <div id="qr-reader" className="w-full"></div> 

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-70 text-white">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">...</svg>
            যাচাই করা হচ্ছে...
          </div>
        )}
        
        {scanResult && (
          <div className="bg-white p-2 text-center font-bold text-gray-800">
            রেজাল্ট: {scanResult}
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
        <h3 className="text-lg font-bold mb-2">সাম্প্রতিক এন্ট্রি:</h3>
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