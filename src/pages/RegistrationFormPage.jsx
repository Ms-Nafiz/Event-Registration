import { useState, useEffect } from "react";
import api from "../api"; // আপনার Axios instance
import toast from "react-hot-toast";
// import { useAuth } from "../contexts/AuthContext"; // যদি API কল করার জন্য Auth লাগে

export default function RegistrationFormPage() {
  // প্রাথমিক সদস্য হিসেবে প্রধান রেজিস্ট্রেশনকারীকেই ধরা হলো
  const initialMember = {
    member_name: "",
    gender: "Male",
    t_shirt_size: "L",
    age: "",
  };
  const [groups, setGroups] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    headOfFamily: "",
    transactionId: "",
    paymentStatus: "Pending",
    members: [{ ...initialMember, member_name: "" }], // প্রথম মেম্বার নাম ছাড়া শুরু
    group_id: "",
  });

  // useEffect ব্যবহার করে গ্রুপগুলো লোড করুন
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await api.get("/api/groups");
        setGroups(response.data);
        // প্রথম গ্রুপকে ডিফল্ট হিসেবে সেট করুন
        if (response.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            group_id: response.data[0].id.toString(),
          }));
        }
      } catch (error) {
        toast.error("❌ গ্রুপ তালিকা লোড করা যায়নি।", {
          className: "font-bangla",
        });
      }
    };
    fetchGroups();
  }, []);

  const [loading, setLoading] = useState(false);

  // ১. সাধারণ ইনপুট হ্যান্ডেলার
  const handleChange = (e) => {
    if (downloadUrl) setDownloadUrl(null);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ২. নতুন সদস্য যুক্ত করা
  const addMember = () => {
    setFormData((prev) => ({
      ...prev,
      members: [...prev.members, { ...initialMember, member_name: "" }],
    }));
  };

  // ৩. সদস্যের তথ্য আপডেট করা
  const handleMemberChange = (index, e) => {
    const { name, value } = e.target;
    const newMembers = formData.members.map((member, i) => {
      if (i === index) {
        return { ...member, [name]: value };
      }
      return member;
    });
    setFormData((prev) => ({ ...prev, members: newMembers }));
  };

  // ৪. সদস্যকে মুছে ফেলা
  const removeMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index),
    }));
  };

  // ৫. ফর্ম সাবমিট
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDownloadUrl(null);

    // const totalMembers = formData.members.length;

    // API-তে পাঠানোর জন্য ডেটা প্রস্তুত (পরিচ্ছন্ন সংস্করণ)
    // আমরা এখানে ...formData ব্যবহার করছি না, যাতে ডুপ্লিকেট কী তৈরি না হয়
    const dataToSend = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      group_id: formData.group_id,
      transaction_id: formData.transactionId,
      payment_status: formData.paymentStatus,
      // totalMembers ব্যাকএন্ডে গণনা করা হচ্ছে, তাই না পাঠালেও চলে

      // সদস্যদের অ্যারে (এটিই মূল অংশ)
      members: formData.members.map((member, index) => ({
        member_name: index === 0 ? formData.name : member.member_name,
        gender: member.gender,
        t_shirt_size: member.t_shirt_size,
        age: member.age || null, // বয়স খালি থাকলে null পাঠাবে
      })),
    };

    try {
      // API ইন্টিগ্রেশন
      const response = await api.post("/api/register-event", dataToSend);

      toast.success(
        response.data.message || "✅ রেজিস্ট্রেশন সফল! ডেটা সেভ হয়েছে।",
        {
          duration: 5000,
          className: "font-bangla",
        }
      );
      // --- ডাউনলোড লিঙ্ক সেট করুন ---
      if (response.data.download_url) {
        setDownloadUrl(response.data.download_url);
      }

      // ফর্ম রিসেট
      setFormData({
        name: "",
        mobile: "",
        email: "",
        group_id: groups.length > 0 ? groups[0].id.toString() : "",
        transactionId: "",
        paymentStatus: "Pending",
        members: [{ ...initialMember, member_name: "" }],
      });
    } catch (error) {
      let errorMessage = "❌ রেজিস্ট্রেশনের সময় একটি ত্রুটি হয়েছে।";
      if (error.response && error.response.status === 422) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors)[0][0] || "ফর্মের ডেটা ভুল আছে।";
      } else if (error.response && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage, { duration: 6000, className: "font-bangla" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl font-bangla">
      <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6 text-center">
        👨‍👩‍👧‍👦 বংশ অনুষ্ঠানের রেজিস্ট্রেশন ফর্ম
      </h2>

      {downloadUrl && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg text-center font-bangla">
          <p className="text-lg font-semibold text-green-800">
            আপনার রেজিস্ট্রেশন সফল হয়েছে!
          </p>
          <p className="text-sm text-gray-700 mb-4">
            আপনার এন্ট্রি কার্ডটি ইমেইলে পাঠানো হয়েছে। আপনি চাইলে নিচের বাটন
            থেকেও ডাউনলোড করতে পারেন।
          </p>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition"
          >
            📥 এন্ট্রি কার্ড ডাউনলোড করুন
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* --- ১. মূল ব্যক্তি ও যোগাযোগের তথ্য --- */}
        <section className="border border-gray-300 p-6 rounded-lg shadow-sm bg-gray-50">
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">
            মূল প্রতিনিধি ও যোগাযোগের তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                নাম (যিনি প্রতিনিধিত্ব করবেন)
                <sapn className="text-red-600">*</sapn>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-gray-700"
              >
                মোবাইল নম্বর<sapn className="text-red-600">*</sapn>
              </label>
              <input
                type="text"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                ইমেইল অ্যাড্রেস<sapn className="text-red-600">*</sapn>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="group_id"
                className="block text-sm font-medium text-gray-700"
              >
                দল/গ্রুপ নির্বাচন করুন*
              </label>
              <select
                id="group_id"
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                
                {groups.length === 0 ? (
                  <option value="">গ্রুপ লোড হচ্ছে...</option>
                ) : (
                  groups.map((group) => (
                    <option key={group.id} value={group.id.toString()}>
                      {group.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </section>

        {/* --- ২. পেমেন্ট তথ্য --- */}
        <section className="border border-gray-300 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-green-700 mb-4">
            চাঁদা/ফি প্রদানের তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="transactionId"
                className="block text-sm font-medium text-gray-700"
              >
                চাঁদার পরিমান
              </label>
              <input
                type="text"
                id="transactionId"
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="যেমন: ১০০০"
              />
            </div>
            <div>
              <label
                htmlFor="paymentStatus"
                className="block text-sm font-medium text-gray-700"
              >
                পেমেন্ট স্ট্যাটাস
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Pending">Pending - মুলতবি</option>
                <option value="Paid">Paid - পরিশোধিত</option>
                <option value="Waived">Waived - মওকুফ</option>
              </select>
            </div>
          </div>
        </section>

        {/* --- ৩. সদস্যদের তালিকা --- */}
        <section className="border border-gray-300 p-6 rounded-lg shadow-2xl bg-indigo-50">
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">
            অনুষ্ঠানে অংশগ্রহণকারী সদস্যদের তালিকা (মোট:{" "}
            {formData.members.length} জন)
          </h3>

          {formData.members.map((member, index) => (
            <div
              key={index}
              className={`relative p-4 border border-indigo-200 rounded-lg mb-4 bg-white ${
                index > 0 ? "pt-8" : ""
              }`}
            >
              <h4 className="font-bold text-gray-800 mb-3">
                সদস্য #{index + 1}
              </h4>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="absolute top-2 right-2 text-sm px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  মুছে ফেলুন 🗑️
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* নাম */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700">
                    নাম
                  </label>
                  <input
                    type="text"
                    name="member_name"
                    value={index === 0 ? formData.name : member.member_name} // প্রথম সদস্যের নাম main name ফিল্ড থেকে নেওয়া হবে
                    onChange={(e) =>
                      index === 0
                        ? handleChange({
                            target: { name: "name", value: e.target.value },
                          })
                        : handleMemberChange(index, e)
                    }
                    required
                    placeholder={
                      index === 0
                        ? "উপরের নাম স্বয়ংক্রিয়ভাবে নেওয়া হলো"
                        : "সদস্যের পুরো নাম"
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm"
                    disabled={index === 0 && true} // প্রথম সদস্যের ইনপুট ডিজেবল করা যেতে পারে
                  />
                </div>

                {/* লিঙ্গ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    লিঙ্গ/শ্রেণি
                  </label>
                  <select
                    name="gender"
                    value={member.gender}
                    onChange={(e) => handleMemberChange(index, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm"
                  >
                    <option value="Male">ছেলে (প্রাপ্তবয়স্ক)</option>
                    <option value="Female">মেয়ে (প্রাপ্তবয়স্ক)</option>
                    <option value="Child">শিশু (১০ বছরের নিচে)</option>
                  </select>
                </div>

                {/* টি-শার্ট সাইজ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    টি-শার্ট সাইজ
                  </label>
                  <select
                    name="t_shirt_size"
                    value={member.t_shirt_size}
                    onChange={(e) => handleMemberChange(index, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="NA">NA (শিশুদের জন্য)</option>
                  </select>
                </div>

                {/* বয়স (ঐচ্ছিক) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    বয়স (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={member.age}
                    onChange={(e) => handleMemberChange(index, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMember}
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition font-medium"
          >
            ➕ আরো সদস্য যুক্ত করুন
          </button>
        </section>

        {/* সাবমিট বাটন */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-medium text-white ${
              loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ease-in-out`}
          >
            {loading ? "ডেটা সেভ হচ্ছে..." : "রেজিস্ট্রেশন সম্পূর্ণ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}
