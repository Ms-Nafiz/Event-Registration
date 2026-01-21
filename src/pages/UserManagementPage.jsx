import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import ConfirmModal from "../components/common/ConfirmModal";
import { useData } from "../contexts/DataContext";

export default function UserManagementPage() {
  const { users, loading: dataLoading } = useData();
  const loading = dataLoading.users;
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary",
  });

  const handleApprove = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status: "approved" });
      toast.success("ইউজার অনুমোদিত হয়েছে! ✅");
    } catch {
      toast.error("আপডেট ব্যর্থ হয়েছে।");
    }
  };

  const handleMakeAdmin = (userId) => {
    setConfirmConfig({
      isOpen: true,
      title: "অ্যাডমিন নিশ্চিত করুন",
      message: "আপনি কি নিশ্চিত এই ইউজারকে অ্যাডমিন বানাতে চান?",
      type: "primary",
      onConfirm: async () => {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, { role: "admin", status: "approved" });
          toast.success("নতুন অ্যাডমিন তৈরি করা হয়েছে! 👑");
        } catch {
          toast.error("ব্যর্থ হয়েছে।");
        }
      },
    });
  };

  const handleDelete = (userId) => {
    setConfirmConfig({
      isOpen: true,
      title: "ডিলিট নিশ্চিত করুন",
      message:
        "সতর্কতা: এই ইউজার ডিলিট হয়ে যাবে! এই কাজটি আর ফেরত নেওয়া যাবে না।",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", userId));
          toast.success("ইউজার ডিলিট হয়েছে।");
        } catch {
          toast.error("ডিলিট করা যায়নি.");
        }
      },
    });
  };

  return (
    <div className="p-4 md:p-8 font-bangla max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            ব্যবহারকারী ম্যানেজমেন্ট
          </h2>
          <p className="text-sm text-gray-500">মোট ইউজার: {users.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">কোনো ইউজার নেই।</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      নাম ও ইমেইল
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      মোবাইল
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      রোল
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      স্ট্যাটাস
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      অ্যাকশন
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50/80 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs mr-3">
                            {user.name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === "admin" ? "অ্যাডমিন" : "ইউজার"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            user.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {user.status === "approved" ? "সক্রিয়" : "অপেক্ষমান"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {user.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                          >
                            Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        user.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {user.status === "approved" ? "সক্রিয়" : "অপেক্ষমান"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <div>
                      <span className="block text-gray-400 text-[10px] uppercase">
                        মোবাইল
                      </span>
                      <span className="font-medium">{user.mobile}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-400 text-[10px] uppercase">
                        রোল
                      </span>
                      <span
                        className={`font-bold ${
                          user.role === "admin"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        {user.role === "admin" ? "অ্যাডমিন" : "ইউজার"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {user.status !== "approved" && (
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100"
                      >
                        Approve
                      </button>
                    )}
                    {user.role !== "admin" && (
                      <button
                        onClick={() => handleMakeAdmin(user.id)}
                        className="flex-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100"
                      >
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        config={confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
