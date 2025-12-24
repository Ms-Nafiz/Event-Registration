import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "../components/common/Modal";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]); // All users for selection
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
<<<<<<< HEAD
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teamLeaders: [],
  });
  const [userSearch, setUserSearch] = useState(""); // Search for users in modal

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [gData, uData] = await Promise.all([
        getDocs(collection(db, "groups")),
        getDocs(collection(db, "users")),
      ]);

      setGroups(gData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setUsers(uData.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("ডেটা লোড করা যায়নি।");
=======
  const [formData, setFormData] = useState({ name: '', description: '', teamLeaders: [] });
  const [userSearch, setUserSearch] = useState(''); // Search for users in modal

  const groupsCollectionRef = collection(db, "groups");
  const usersCollectionRef = collection(db, "users");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gData, uData] = await Promise.all([
        getDocs(groupsCollectionRef),
        getDocs(usersCollectionRef)
      ]);
      
      setGroups(gData.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setUsers(uData.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error('ডেটা লোড করা যায়নি।');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
<<<<<<< HEAD
  }, [fetchData]);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: "", description: "", teamLeaders: [] });
    setUserSearch("");
=======
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', description: '', teamLeaders: [] });
    setUserSearch('');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
    setShowModal(true);
  };

  const openEditModal = (group) => {
    setIsEditMode(true);
    setCurrentGroup(group);
<<<<<<< HEAD
    setFormData({
      name: group.name,
      description: group.description || "",
      teamLeaders: group.teamLeaders || [],
    });
    setUserSearch("");
=======
    setFormData({ 
      name: group.name, 
      description: group.description || '', 
      teamLeaders: group.teamLeaders || [] 
    });
    setUserSearch('');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentGroup(null);
  };

  const toggleTeamLeader = (userId, userName) => {
<<<<<<< HEAD
    setFormData((prev) => {
      const exists = prev.teamLeaders.find((l) => l.id === userId);
      let newLeaders;
      if (exists) {
        newLeaders = prev.teamLeaders.filter((l) => l.id !== userId);
=======
    setFormData(prev => {
      const exists = prev.teamLeaders.find(l => l.id === userId);
      let newLeaders;
      if (exists) {
        newLeaders = prev.teamLeaders.filter(l => l.id !== userId);
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      } else {
        newLeaders = [...prev.teamLeaders, { id: userId, name: userName }];
      }
      return { ...prev, teamLeaders: newLeaders };
    });
  };

<<<<<<< HEAD
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("গ্রুপের নাম লিখুন!");
      return;
    }

    try {
      if (isEditMode && currentGroup) {
        await updateDoc(doc(db, "groups", currentGroup.id), {
          name: formData.name,
          description: formData.description,
          teamLeaders: formData.teamLeaders,
        });
        toast.success("গ্রুপ আপডেট করা হয়েছে!");
      } else {
        await addDoc(collection(db, "groups"), formData);
        toast.success("নতুন গ্রুপ যোগ করা হয়েছে!");
=======
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        const groupDoc = doc(db, "groups", currentGroup.id);
        await updateDoc(groupDoc, formData);
        toast.success('গ্রুপ আপডেট সফল!');
      } else {
        await addDoc(groupsCollectionRef, formData);
        toast.success('নতুন গ্রুপ যোগ করা হয়েছে!');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      }
      closeModal();
      fetchData(); // Refresh both to be safe
    } catch (error) {
      toast.error("অপারেশন ব্যর্থ হয়েছে।");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("আপনি কি এই গ্রুপটি ডিলিট করতে নিশ্চিত?")) {
      try {
        const groupDoc = doc(db, "groups", id);
        await deleteDoc(groupDoc);
<<<<<<< HEAD
        toast.success("গ্রুপ ডিলিট করা হয়েছে।");
        fetchData();
      } catch {
        toast.error("ডিলিট করা যায়নি।");
=======
        toast.success('গ্রুপ ডিলিট করা হয়েছে।');
        fetchData();
      } catch (error) {
        toast.error('ডিলিট করা যায়নি।');
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
      }
    }
  };

  // Filter users for selection
<<<<<<< HEAD
  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.mobile?.includes(userSearch)
=======
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.mobile?.includes(userSearch)
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
  );

  return (
    <div className="p-4 md:p-8 font-bangla max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
<<<<<<< HEAD
          <h2 className="text-2xl font-bold text-gray-800">
            গ্রুপ ম্যানেজমেন্ট
          </h2>
          <p className="text-sm text-gray-500">মোট গ্রুপ: {groups.length}</p>
        </div>
        <button
          onClick={openAddModal}
=======
          <h2 className="text-2xl font-bold text-gray-800">গ্রুপ ম্যানেজমেন্ট</h2>
          <p className="text-sm text-gray-500">মোট গ্রুপ: {groups.length}</p>
        </div>
        <button 
          onClick={openAddModal} 
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95"
        >
          <span>+</span> <span className="hidden sm:inline">নতুন গ্রুপ</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500">কোনো গ্রুপ নেই।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
<<<<<<< HEAD
            <div
              key={group.id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative flex flex-col h-full"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={() => openEditModal(group)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md bg-white shadow-sm"
                  title="এডিট"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md bg-white shadow-sm"
                  title="ডিলিট"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>

=======
            <div key={group.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative flex flex-col h-full">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openEditModal(group)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md bg-white shadow-sm" title="এডিট">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onClick={() => handleDelete(group.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md bg-white shadow-sm" title="ডিলিট">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                  {group.name.charAt(0)}
                </div>
<<<<<<< HEAD
                <h3 className="text-lg font-bold text-gray-800 break-words">
                  {group.name}
                </h3>
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {group.description || "কোনো বর্ণনা নেই"}
=======
                <h3 className="text-lg font-bold text-gray-800 break-words">{group.name}</h3>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {group.description || 'কোনো বর্ণনা নেই'}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
                </p>

                {/* Team Leaders Display */}
                {group.teamLeaders && group.teamLeaders.length > 0 && (
<<<<<<< HEAD
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                      টিম লিডার
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {group.teamLeaders.map((leader) => (
                        <span
                          key={leader.id}
                          className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100"
                        >
                          {leader.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-50 sm:hidden">
                <button
                  onClick={() => openEditModal(group)}
                  className="text-xs font-bold text-indigo-600"
                >
                  এডিট
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="text-xs font-bold text-red-600"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={isEditMode ? "গ্রুপ এডিট করুন" : "নতুন গ্রুপ যোগ করুন"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              গ্রুপের নাম*
            </label>
=======
                    <div className="mt-2 pt-2 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">টিম লিডার</p>
                        <div className="flex flex-wrap gap-1">
                            {group.teamLeaders.map(leader => (
                                <span key={leader.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                                    {leader.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
              </div>
              
              {/* Mobile Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-50 sm:hidden">
                <button onClick={() => openEditModal(group)} className="text-xs font-bold text-indigo-600">এডিট</button>
                <button onClick={() => handleDelete(group.id)} className="text-xs font-bold text-red-600">ডিলিট</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal 
        show={showModal} 
        onClose={closeModal} 
        title={isEditMode ? 'গ্রুপ এডিট করুন' : 'নতুন গ্রুপ যোগ করুন'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">গ্রুপের নাম*</label>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="উদাহরণ: চৌধুরী বংশ"
            />
          </div>
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-gray-700 mb-1">
              সংক্ষিপ্ত বর্ণনা
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
=======
            <label className="block text-sm font-medium text-gray-700 mb-1">সংক্ষিপ্ত বর্ণনা</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="গ্রুপ সম্পর্কে কিছু লিখুন..."
            ></textarea>
          </div>

          {/* Team Leader Selection */}
          <div>
<<<<<<< HEAD
            <label className="block text-sm font-medium text-gray-700 mb-2">
              টিম লিডার নির্বাচন করুন (একাধিক হতে পারে)
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="p-2 bg-gray-50 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isSelected = formData.teamLeaders.some(
                      (l) => l.id === user.id
                    );
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleTeamLeader(user.id, user.name)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-sm ${
                          isSelected
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600"
                                : "border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="3"
                                  d="M5 13l4 4L19 7"
                                ></path>
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {user.mobile}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-indigo-600 text-xs font-bold">
                            সিলেক্টেড
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 text-xs py-2">
                    কোনো ইউজার পাওয়া যায়নি
                  </p>
                )}
              </div>
            </div>
            {formData.teamLeaders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.teamLeaders.map((leader) => (
                  <span
                    key={leader.id}
                    className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium"
                  >
                    {leader.name}
                    <button
                      type="button"
                      onClick={() => toggleTeamLeader(leader.id, leader.name)}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
=======
            <label className="block text-sm font-medium text-gray-700 mb-2">টিম লিডার নির্বাচন করুন (একাধিক হতে পারে)</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                    <input 
                        type="text" 
                        placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => {
                            const isSelected = formData.teamLeaders.some(l => l.id === user.id);
                            return (
                                <div 
                                    key={user.id} 
                                    onClick={() => toggleTeamLeader(user.id, user.name)}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-sm ${isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{user.name}</p>
                                            <p className="text-[10px] text-gray-500">{user.mobile}</p>
                                        </div>
                                    </div>
                                    {isSelected && <span className="text-indigo-600 text-xs font-bold">সিলেক্টেড</span>}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-400 text-xs py-2">কোনো ইউজার পাওয়া যায়নি</p>
                    )}
                </div>
            </div>
            {formData.teamLeaders.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {formData.teamLeaders.map(leader => (
                        <span key={leader.id} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-medium">
                            {leader.name}
                            <button type="button" onClick={() => toggleTeamLeader(leader.id, leader.name)} className="hover:text-indigo-900">×</button>
                        </span>
                    ))}
                </div>
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
<<<<<<< HEAD
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md transition-colors"
            >
              {isEditMode ? "আপডেট করুন" : "সেভ করুন"}
=======
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
              বাতিল
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md transition-colors">
              {isEditMode ? 'আপডেট করুন' : 'সেভ করুন'}
>>>>>>> cfd48526b6770e328800d0885550f476aa254aa5
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
