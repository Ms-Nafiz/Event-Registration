import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 font-bangla">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">প্রবেশাধিকার নেই!</h1>
        <p className="text-gray-600 mb-6">
          আপনার এই পেজটি দেখার অনুমতি নেই। এটি শুধুমাত্র অ্যাডমিনদের জন্য সংরক্ষিত।
        </p>
        <button
          onClick={() => navigate(-1)} // এক ধাপ পিছনে নিয়ে যাবে
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          ফিরে যান
        </button>
      </div>
    </div>
  );
}