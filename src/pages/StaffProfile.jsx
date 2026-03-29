import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiShield, FiMapPin, FiPhone, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function StaffProfile() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = String(userData?.name || 'Staff').trim();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }, [userData]);

  const profile = {
    name: userData?.name || 'N/A',
    email: user?.email || userData?.email || 'N/A',
    role: userData?.role || 'N/A',
    branchName: userData?.branchName || 'Not Assigned',
    branchId: userData?.branchId || 'N/A',
    phone: userData?.phone || 'Not Provided',
    status: userData?.isActive === false ? 'Inactive' : 'Active',
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Staff Profile
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            View your employment information and manage your password
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full bg-[#165bbd] text-white flex items-center justify-center text-3xl font-black shadow-lg">
                {initials}
              </div>

              <h2 className="mt-5 text-2xl font-black text-gray-800">
                {profile.name}
              </h2>

              <p className="text-sm text-gray-400 mt-1">{profile.email}</p>

              <span
                className={`mt-4 px-4 py-2 rounded-xl text-xs font-black uppercase ${
                  profile.status === 'Active'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {profile.status}
              </span>

              <button
                onClick={() => navigate('/change-password')}
                className="mt-6 w-full bg-[#165bbd] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                <FiLock /> Change Password
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
            <h3 className="text-xl font-black text-gray-800 mb-6">
              Employment Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiUser /> Full Name
                </p>
                <p className="mt-2 text-lg font-black text-gray-800">{profile.name}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiMail /> Email Address
                </p>
                <p className="mt-2 text-lg font-black text-gray-800">{profile.email}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiShield /> Role
                </p>
                <p className="mt-2 text-lg font-black text-gray-800 uppercase">{profile.role}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiPhone /> Phone
                </p>
                <p className="mt-2 text-lg font-black text-gray-800">{profile.phone}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiMapPin /> Branch Name
                </p>
                <p className="mt-2 text-lg font-black text-gray-800">{profile.branchName}</p>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] uppercase font-black text-gray-400 flex items-center gap-2">
                  <FiMapPin /> Branch ID
                </p>
                <p className="mt-2 text-lg font-black text-gray-800">{profile.branchId}</p>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-2xl bg-yellow-50 border border-yellow-100">
              <p className="text-sm font-bold text-yellow-800">
                Profile information is managed only by Admin. If any detail is incorrect, contact Admin for an official update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffProfile;