import { Fragment } from 'react';

export default function Modal({ show, onClose, title, children }) {
  if (!show) {
    return null;
  }

  return (
    <Fragment>
      {/* --- ব্যাকগ্রাউন্ড ওভারলে (আপডেট করা হয়েছে) --- 
        1. bg-black/30: কালো রঙ কিন্তু ৩০% স্বচ্ছ (আগে হয়তো গাঢ় ছিল)
        2. backdrop-blur-sm: পেছনের কন্টেন্ট ঘোলা (Blur) করে দেবে
        3. transition-opacity: আসার সময় স্মুথ লাগবে
      */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* মডাল কন্টেন্ট */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* pointer-events-auto দেওয়া হয়েছে যাতে মডালের ভেতরে ক্লিক কাজ করে */}
        <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl font-bangla transform transition-all pointer-events-auto">
          
          {/* হেডার */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* বডি */}
          <div className="p-6">
            {children}
          </div>

        </div>
      </div>
    </Fragment>
  );
}