import React from "react";

/**
 * A premium, custom-designed confirmation modal.
 * @param {Object} config - { isOpen, title, message, type, onConfirm }
 * @param {Function} onClose - Function to close the modal
 */
const ConfirmModal = ({ config, onClose }) => {
  if (!config?.isOpen) return null;

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    onClose();
  };

  const getTheme = () => {
    switch (config.type) {
      case "danger":
        return {
          icon: "⚠️",
          color: "rose",
          gradient: "from-rose-500 to-red-600",
          bg: "bg-rose-50",
          text: "text-rose-600",
        };
      case "success":
        return {
          icon: "✅",
          color: "emerald",
          gradient: "from-emerald-500 to-teal-600",
          bg: "bg-emerald-50",
          text: "text-emerald-600",
        };
      case "warning":
        return {
          icon: "🔔",
          color: "amber",
          gradient: "from-amber-400 to-orange-500",
          bg: "bg-amber-50",
          text: "text-amber-600",
        };
      default:
        return {
          icon: "❓",
          color: "indigo",
          gradient: "from-indigo-500 to-purple-600",
          bg: "bg-indigo-50",
          text: "text-indigo-600",
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      ></div>
      <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/50 animate-fade-in overflow-hidden font-bangla">
        {/* Decorative Background */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-10 blur-3xl rounded-full`}
        ></div>

        <div className="relative flex flex-col items-center text-center">
          <div
            className={`w-24 h-24 ${theme.bg} rounded-[2rem] flex items-center justify-center text-5xl mb-8 shadow-inner`}
          >
            {theme.icon}
          </div>
          <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
            {config.title}
          </h3>
          <p className="text-slate-500 font-bold mb-10 leading-relaxed px-2">
            {config.message}
          </p>
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl text-sm font-black text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
            >
              বাতিল
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r ${theme.gradient} shadow-xl shadow-${theme.color}-100 hover:scale-105 active:scale-95 transition-all outline-none`}
            >
              নিশ্চিত করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
