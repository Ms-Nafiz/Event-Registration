import Sidebar from './Sidebar';

// এটি সমস্ত সুরক্ষিত রুটের জন্য প্রধান লেআউট হিসেবে কাজ করবে
export default function DashboardLayout({ children }) {
  return (
    // মূল কনটেইনার: স্ক্রিনের উচ্চতা পূরণ করে এবং ফন্ট প্রয়োগ করে
    <div className="flex h-screen bg-gray-50 font-bangla">
      
      {/* বাম দিকে সাইডবার */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* ডানদিকে প্রধান কনটেন্ট এরিয়া */}
      <main className="flex-1 overflow-y-auto focus:outline-none">
        
        {/* টপ বার (মোবাইলের জন্য সাইডবার টগল বাটন রাখতে পারেন) */}
        <header className="bg-white shadow-md p-4 sticky top-0 z-10">
          <h2 className="text-2xl font-semibold text-gray-800">
            {/* এখানে পেজের নাম দেখাবে */}
            বংশ অনুষ্ঠানের ডেটা ম্যানেজমেন্ট
          </h2>
        </header>

        {/* কনটেন্ট */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}