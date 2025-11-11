// src/components/common/Modal.jsx
import { Fragment } from 'react';

export default function Modal({ show, onClose, title, children }) {
  if (!show) {
    return null;
  }

  return (
    <Fragment>
      {/* ব্যাকড্রপ */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* মডাল কন্টেন্ট */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-2xl font-bangla">
          
          {/* হেডার */}
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-xl font-semibold text-gray-800">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
            >
              &times;
            </button>
          </div>
          
          {/* বডি (ফর্ম এখানে আসবে) */}
          <div className="p-6">
            {children}
          </div>

        </div>
      </div>
    </Fragment>
  );
}