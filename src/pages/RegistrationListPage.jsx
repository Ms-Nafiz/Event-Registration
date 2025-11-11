import { useState, useEffect } from 'react';
import api from '../api'; // Amader Axios instance
import toast from 'react-hot-toast';

export default function RegistrationListPage() {
  const [registrations, setRegistrations] = useState([]); // Mul data rakhar jonno
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null); // Pagination link rakhar jonno

  // --- API theke data anar function ---
  const fetchRegistrations = async (url = '/api/registrations') => {
    setLoading(true);
    try {
      const response = await api.get(url);
      setRegistrations(response.data.data); // Laravel pagination-er data .data er bhetore thake
      
      // Pagination link ebong meta data save kora
      setPagination({
        links: response.data.links,
        meta: response.data.meta
      });
      
    } catch (error) {
      toast.error('Registrations list load kora jayni.', { className: 'font-bangla' });
    } finally {
      setLoading(false);
    }
  };

  // --- Page load hole prothombar data ana ---
  useEffect(() => {
    fetchRegistrations();
  }, []); // Shudhu prothombar call hobe

  // --- Pagination button-e click handle ---
  const handlePagination = (url) => {
    if (!url) return; // Jodi link na thake
    fetchRegistrations(url); // Notun URL theke data anun
  };

  // --- PDF download-er URL toiri ---
  const getDownloadUrl = (registrationId) => {
    return `${api.defaults.baseURL}/api/registration/download/${registrationId}`;
  };

  return (
    <div className="p-6 md:p-8 font-bangla">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        📜 রেজিস্ট্রেশন তালিকা
      </h2>

      {/* --- Table --- */}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        {loading && (
          <div className="p-6 text-center text-gray-500">লোড হচ্ছে...</div>
        )}
        
        {!loading && registrations.length === 0 && (
          <div className="p-6 text-center text-gray-500">এখনও কোনো রেজিস্ট্রেশন হয়নি।</div>
        )}

        {!loading && registrations.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">প্রতিনিধি (Rep)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">গ্রুপ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">মোট সদস্য</th>
                
                {/* === নতুন কলাম === */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">অতিরিক্ত সদস্য</th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">পেমেন্ট স্ট্যাটাস</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  
                  {/* Protinidhi-r tottho */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{reg.name}</p>
                    <p className="text-sm text-gray-500">{reg.mobile}</p>
                  </td>
                  
                  {/* Group */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{reg.group?.name || 'N/A'}</p>
                  </td>
                  
                  {/* Mot Sodossho */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{reg.total_members} জন</p>
                  </td>

                  {/* === নতুন কলামের ডেটা === */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Prothom sodossho (index 0) holo protinidhi, tai take bad diye baki-der dekhano hocche
                    */}
                    {reg.members && reg.members.length > 1 ? (
                      <ul className="list-disc list-inside text-xs text-gray-600">
                        {reg.members
                          .filter((member, index) => index > 0) // Prothom sodossho (protinidhi) bad din
                          .map((member) => (
                            <li key={member.id} title={`Gender: ${member.gender}, T-Shirt: ${member.t_shirt_size || 'N/A'}`}>
                              {member.member_name}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">নেই</span>
                    )}
                  </td>
                  
                  {/* Payment Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      reg.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                      reg.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {reg.payment_status}
                    </span>
                  </td>
                  
                  {/* Action Button */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <a
                      href={getDownloadUrl(reg.registration_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition text-xs"
                    >
                      PDF ডাউনলোড
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Pagination Button --- */}
      {pagination && pagination.links.length > 3 && ( // Jodi pagination-er dorkar hoy
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-700">
            দেখাচ্ছে {pagination.meta.from} থেকে {pagination.meta.to} (মোট {pagination.meta.total} টি)
          </p>
          <div className="flex space-x-1">
            {pagination.links.map((link, index) => (
              <button
                key={index}
                onClick={() => handlePagination(link.url)}
                disabled={!link.url} // URL null hole button disable
                className={`px-4 py-2 text-sm rounded-md ${
                  link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${!link.url ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}