<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function DonationPage() {
  const { user, userData } = useAuth();
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);

  const fetchDonations = useCallback(async () => {
=======
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function DonationPage() {
  const { user, userData } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState([]);

  const fetchDonations = async () => {
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
    if (!user) return;
    try {
      const q = query(
        collection(db, "donations"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(q);
<<<<<<< HEAD
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

=======
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      // Client-side sorting
      list.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.createdAt);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
<<<<<<< HEAD

=======
      
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      setDonations(list);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
<<<<<<< HEAD
  }, [user]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error("দয়া করে সঠিক পরিমাণ দিন।");
=======
  };

  useEffect(() => {
    fetchDonations();
  }, [user]);

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast.error('দয়া করে সঠিক পরিমাণ দিন।');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5

    setLoading(true);
    try {
      const date = new Date();
<<<<<<< HEAD
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const currentMonth = `${
        monthNames[date.getMonth()]
      } ${date.getFullYear()}`;

      await addDoc(collection(db, "donations"), {
        uid: user.uid,
        userName: userData?.name || user.displayName || "Unknown",
        groupId: userData?.groupId || "N/A",
=======
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const currentMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      await addDoc(collection(db, "donations"), {
        uid: user.uid,
        userName: userData?.name || user.displayName || 'Unknown',
        groupId: userData?.groupId || 'N/A',
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
        amount: Number(amount),
        date: Timestamp.fromDate(date),
        month: currentMonth,
        paymentMethod: paymentMethod,
<<<<<<< HEAD
        status: "pending",
        createdAt: date.toISOString(),
      });

      toast.success("ডোনেশন রিকোয়েস্ট জমা হয়েছে!");
      setAmount("");
      fetchDonations();
    } catch (error) {
      console.error(error);
      toast.error("ডোনেশন ব্যর্থ হয়েছে।");
=======
        status: 'pending',
        createdAt: date.toISOString()
      });

      toast.success('ডোনেশন রিকোয়েস্ট জমা হয়েছে!');
      setAmount('');
      fetchDonations();
    } catch (error) {
      console.error(error);
      toast.error('ডোনেশন ব্যর্থ হয়েছে।');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-bangla max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-indigo-600">❤</span> ডোনেশন প্যানেল
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Donation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-50 sticky top-4">
<<<<<<< HEAD
            <h2 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">
              নতুন ডোনেশন
            </h2>
            <form onSubmit={handleDonate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  টাকার পরিমাণ
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
=======
            <h2 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">নতুন ডোনেশন</h2>
            <form onSubmit={handleDonate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">টাকার পরিমাণ</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500 text-sm">৳</span>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
<<<<<<< HEAD
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  পেমেন্ট মেথড
                </label>
                <select
                  value={paymentMethod}
=======
                <label className="block text-xs font-medium text-gray-600 mb-1">পেমেন্ট মেথড</label>
                <select 
                  value={paymentMethod} 
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="manual">নগদ / ম্যানুয়াল</option>
<<<<<<< HEAD
                  <option value="bkash" disabled>
                    বিকাশ (শীঘ্রই আসছে)
                  </option>
                  <option value="nagad" disabled>
                    নগদ (শীঘ্রই আসছে)
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-md shadow-sm font-medium transition-all transform active:scale-95"
              >
                {loading ? "প্রসেসিং..." : "ডোনেট করুন"}
=======
                  <option value="bkash" disabled>বিকাশ (শীঘ্রই আসছে)</option>
                  <option value="nagad" disabled>নগদ (শীঘ্রই আসছে)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-md shadow-sm font-medium transition-all transform active:scale-95"
              >
                {loading ? 'প্রসেসিং...' : 'ডোনেট করুন'}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
<<<<<<< HEAD
              <h2 className="text-md font-semibold text-gray-700">
                ডোনেশন হিস্ট্রি
              </h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                মোট: {donations.length}
              </span>
            </div>

=======
              <h2 className="text-md font-semibold text-gray-700">ডোনেশন হিস্ট্রি</h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">মোট: {donations.length}</span>
            </div>
            
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
<<<<<<< HEAD
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      তারিখ
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      মাস
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      পরিমাণ
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      স্ট্যাটাস
                    </th>
=======
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">তারিখ</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">মাস</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">পরিমাণ</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {donations.length === 0 ? (
                    <tr>
<<<<<<< HEAD
                      <td
                        colSpan="4"
                        className="px-4 py-8 text-center text-gray-400 text-sm"
                      >
=======
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400 text-sm">
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                        কোনো ডোনেশন পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    donations.map((d) => (
<<<<<<< HEAD
                      <tr
                        key={d.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {d.date?.toDate
                            ? d.date.toDate().toLocaleDateString()
                            : new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {d.month}
                        </td>
=======
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                          {d.date?.toDate ? d.date.toDate().toLocaleDateString() : new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">{d.month}</td>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                        <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-right text-indigo-600">
                          ৳ {d.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
<<<<<<< HEAD
                          <span
                            className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                              d.status === "approved"
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                            }`}
                          >
                            {d.status === "approved" ? "অনুমোদিত" : "অপেক্ষমান"}
=======
                          <span className={`px-2 py-0.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                            d.status === 'approved' 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {d.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমান'}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
