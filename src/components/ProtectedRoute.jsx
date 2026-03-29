import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userData, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-8 rounded-2xl shadow border text-center max-w-md w-full">
          <h2 className="text-[#0a1f4a] font-black text-xl mb-2">Checking Access</h2>
          <p className="text-gray-500">Please wait while your permissions are being verified.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-8 rounded-2xl shadow border text-center max-w-md w-full">
          <h2 className="text-red-600 font-black text-xl mb-2">Access Denied</h2>
          <p className="text-gray-600">No staff profile was found for this account.</p>
          <p className="text-gray-500 mt-2 text-sm">Logged in as: {user.email}</p>
        </div>
      </div>
    );
  }

  if (userData?.isActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-8 rounded-2xl shadow border text-center max-w-md w-full">
          <h2 className="text-red-600 font-black text-xl mb-2">Account Disabled</h2>
          <p className="text-gray-600">This staff account has been deactivated.</p>
          <p className="text-gray-500 mt-2 text-sm">Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  const currentRole = String(userData?.role || '').trim().toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).trim().toLowerCase()
  );

  if (!currentRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-8 rounded-2xl shadow border text-center max-w-md w-full">
          <h2 className="text-red-600 font-black text-xl mb-2">Role Not Assigned</h2>
          <p className="text-gray-600">This account does not have a valid role yet.</p>
          <p className="text-gray-500 mt-2 text-sm">Logged in as: {userData?.email || user?.email}</p>
        </div>
      </div>
    );
  }

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(currentRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="bg-white p-8 rounded-2xl shadow border text-center max-w-md w-full">
          <h2 className="text-red-600 font-black text-xl mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to enter this office.</p>
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <p>
              <span className="font-bold">Logged in as:</span> {userData?.email || user?.email}
            </p>
            <p>
              <span className="font-bold">Your role:</span> {currentRole}
            </p>
            <p>
              <span className="font-bold">Allowed roles:</span> {normalizedAllowedRoles.join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;