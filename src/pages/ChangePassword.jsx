import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { FiLock, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function ChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!user?.email) {
      alert('No authenticated staff account found.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('New password must be different from the current password.');
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      alert('Password changed successfully.');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      navigate('/staff-profile');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        alert('Current password is incorrect.');
      } else if (err.code === 'auth/too-many-requests') {
        alert('Too many attempts. Please wait and try again.');
      } else {
        alert(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff-profile')}
            className="mb-4 flex items-center gap-2 text-blue-600 font-bold"
          >
            <FiArrowLeft /> Back to Profile
          </button>

          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Change Password
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">
            Update your login password securely
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase font-black text-gray-400">
                Current Password
              </label>
              <div className="relative mt-2">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-gray-400">
                New Password
              </label>
              <div className="relative mt-2">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black text-gray-400">
                Confirm New Password
              </label>
              <div className="relative mt-2">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
              <p className="text-sm text-yellow-800 font-bold">
                Only your password can be changed here. All other profile information must be updated by Admin.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiCheckCircle />
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;