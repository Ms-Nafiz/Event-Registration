import { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const groupsCollectionRef = collection(db, "groups");

  // গ্রুপ লোড করা
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await getDocs(groupsCollectionRef);
      setGroups(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      toast.error('গ্রুপ লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // মডাল খোলা/বন্ধ করা
  // মডাল হ্যান্ডলার
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setIsEditMode(true);
    setCurrentGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentGroup(null);
  };

  // সাবমিট (Create/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // আপডেট
        const groupDoc = doc(db, "groups", currentGroup.id);
        await updateDoc(groupDoc, formData);
        toast.success('গ্রুপ আপডেট সফল!');
      } else {
        // নতুন তৈরি
        await addDoc(groupsCollectionRef, formData);
        toast.success('নতুন গ্রুপ যোগ করা হয়েছে!');
      }
      closeModal();
      fetchGroups(); // রিফ্রেশ
    } catch (error) {
      toast.error('অপারেশন ব্যর্থ হয়েছে।');
      console.error(error);
    }
  };

  // ডিলিট
  const handleDelete = async (id) => {
    if (window.confirm('আপনি কি এই গ্রুপটি ডিলিট করতে নিশ্চিত?')) {
      try {
        const groupDoc = doc(db, "groups", id);
        await deleteDoc(groupDoc);
        toast.success('গ্রুপ ডিলিট করা হয়েছে।');
        fetchGroups();
      } catch (error) {
        toast.error('ডিলিট করা যায়নি।');
      }
    }
  };

  return (
    <div className="p-6 md:p-8 font-bangla">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">গ্রুপ ম্যানেজমেন্ট</h2>
        <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700">
          + নতুন গ্রুপ
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">বর্ণনা</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="3" className="text-center py-4">লোড হচ্ছে...</td></tr>
            ) : groups.length > 0 ? groups.map((group) => (
              <tr key={group.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                <td className="px-6 py-4 text-gray-600">{group.description || '-'}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditModal(group)} className="text-indigo-600 hover:text-indigo-900">এডিট</button>
                  <button onClick={() => handleDelete(group.id)} className="text-red-600 hover:text-red-900">ডিলিট</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="3" className="text-center py-4 text-gray-500">কোনো গ্রুপ নেই।</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* মডাল */}
      <Modal 
        show={showModal} 
        onClose={closeModal} 
        title={isEditMode ? 'গ্রুপ এডিট করুন' : 'নতুন গ্রুপ যোগ করুন'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">গ্রুপের নাম*</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">সংক্ষিপ্ত বর্ণনা</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              বাতিল
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              {isEditMode ? 'আপডেট করুন' : 'সেভ করুন'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}