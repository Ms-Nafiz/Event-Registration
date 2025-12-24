// src/components/common/Loader.jsx
<<<<<<< HEAD
export default function Loader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full animate-spin"></div>

            {/* Middle pulsing ring */}
            <div className="absolute inset-2 border-4 border-purple-300 rounded-full animate-pulse"></div>

            {/* Inner gradient circle */}
            <div className="absolute inset-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">B</span>
            </div>
          </div>
        </div>

        {/* Loading text with dots animation */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 font-bangla">
            বংশ ইভেন্ট
          </h2>
          <div className="flex items-center justify-center gap-1 text-gray-600">
            <span className="text-sm font-medium">Loading</span>
            <div className="flex gap-1">
              <span
                className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-progress"></div>
          </div>
        </div>
      </div>

      {/* Add custom keyframes in your index.css for the progress animation */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
=======

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
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
