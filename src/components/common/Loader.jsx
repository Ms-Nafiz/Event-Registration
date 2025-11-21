// src/components/common/Loader.jsx

export default function Loader({ fullScreen = true }) {
  // লোডারের ডিজাইন
  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* স্পিনার আইকন */}
      <div className="relative">
        {/* বাইরের রিং */}
        <div className="w-16 h-16 border-4 border-indigo-200 border-dashed rounded-full animate-spin"></div>
        
        {/* ভেতরের রিং (উল্টো দিকে ঘুরবে বা স্থির থাকবে - এখানে সলিড কালার) */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      {/* টেক্সট (অপশনাল) */}
      <p className="text-indigo-600 font-semibold text-sm animate-pulse font-bangla">
        লোড হচ্ছে...
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-10">
      {spinnerContent}
    </div>
  );
}