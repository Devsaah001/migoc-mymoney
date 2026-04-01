import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { calculateLoanEligibilityScore } from './utils/loanScoring';
import { uploadFileToStorage } from './utils/fileUpload';
import {
  FiMail,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiChevronRight,
  FiCheckCircle,
} from 'react-icons/fi';

import ProtectedRoute from './components/ProtectedRoute';

// Pages
import MainDashboard from './pages/Dashboard';
import CategoryDetail from './pages/CategoryDetail';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerSignup from './pages/CustomerSignup';
import CustomerLogin from './pages/CustomerLogin';
import SusuRegistration from './pages/SusuRegistration';
import SusuOffice from './pages/SusuOffice';
import MomoOffice from './pages/MomoOffice';
import RemittanceOffice from './pages/RemittanceOffice';
import TelecomOffice from './pages/TelecomOffice';
import PaymentsOffice from './pages/PaymentsOffice';
import AdminHub from './pages/AdminHub';
import AdminRecords from './pages/AdminRecords';
import ManageCustomers from './pages/ManageCustomer';
import SusuCollection from './pages/SusuCollection';
import Microfinance from './pages/MicroFinance';
import SusuPayout from './pages/SusuPayout';
import SusuReports from './pages/SusuReports';
import ActivityLog from './pages/ActivityLog';
import AdminPayoutApprovals from './pages/AdminPayoutApprovals';
import ApprovedPayoutCompletion from './pages/ApprovedPayoutCompletion';
import TellerSessions from './pages/TellerSessions';
import AdminLoanApprovals from './pages/AdminLoanApprovals';
import LoanDisbursement from './pages/LoanDisbursement';
import LoanRepayments from './pages/LoanRepayments';
import LoanScheduleManager from './pages/LoanScheduleManager';
import OnlineLoanApplication from './pages/OnlineLoanApplication';
import AdminKYCReview from './pages/AdminKYCReview';
import ForeignExchange from './pages/ForeignExchange';
import StaffProfile from './pages/StaffProfile';
import ChangePassword from './pages/ChangePassword';

import './App.css';

function App() {
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [error, setError] = useState('');

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLocked) {
      const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${secondsLeft} seconds.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      setFailedAttempts(0);
      setLockedUntil(null);
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        const lockTime = Date.now() + 5 * 60 * 1000;
        setLockedUntil(lockTime);
        setError('Too many failed attempts. Please wait 5 minutes before trying again.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const StaffLoginScreen = (
    <div className="min-h-screen bg-[#07152f] text-white font-sans overflow-hidden">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#0a1f4a] via-[#0d2d73] to-[#165bbd]">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-16 h-40 w-40 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-20 right-16 h-56 w-56 rounded-full bg-cyan-300 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-200 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Logo" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <h1 className="text-4xl xl:text-5xl font-black tracking-tight">MIGoC</h1>
                <p className="text-sm xl:text-base text-blue-100 uppercase tracking-[0.25em] mt-1">
                  My Money Platform
                </p>
              </div>
            </div>

            <div className="mt-14 max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-200">
                Teller Operations System
              </p>

              <h2 className="mt-5 text-4xl xl:text-6xl leading-tight font-black tracking-tight">
                Smart Financial Service Control for Daily Operations
              </h2>

              <p className="mt-6 text-base xl:text-lg text-blue-100 leading-relaxed max-w-lg">
                Securely manage Susu, Microfinance, Mobile Money, Telecom, Payments,
                Remittance, and Foreign Exchange services from one professional platform.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 p-5">
                <p className="text-3xl font-black">7+</p>
                <p className="text-sm text-blue-100 mt-1">Integrated service workspaces</p>
              </div>

              <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 p-5">
                <p className="text-3xl font-black">24/7</p>
                <p className="text-sm text-blue-100 mt-1">Operational access and monitoring</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-blue-100">
            <FiShield className="text-lg" />
            <span>Authorized staff access only</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 bg-[#f6f9ff]">
          <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-[#165bbd] flex items-center justify-center overflow-hidden shadow-lg">
                  <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-black text-[#0a1f4a]">MIGoC</h1>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    My Money Platform
                  </p>
                </div>
              </div>

              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#165bbd]">
                Staff Login
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-[#0a1f4a]">
                Welcome Back
              </h2>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Sign in to access your financial operations dashboard and continue secure service processing.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/90 backdrop-blur-xl border border-white shadow-[0_20px_80px_rgba(15,23,42,0.10)] p-6 sm:p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Staff Email
                  </label>
                  <div className="relative mt-2">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Enter official email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-[#f8fbff] py-4 pl-12 pr-4 text-[#0a1f4a] outline-none transition-all focus:border-[#165bbd] focus:ring-4 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-[#f8fbff] py-4 pl-12 pr-14 text-[#0a1f4a] outline-none transition-all focus:border-[#165bbd] focus:ring-4 focus:ring-blue-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#165bbd]"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#0a1f4a] to-[#165bbd] py-4 text-white font-black tracking-wide shadow-xl transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiShield className="animate-pulse" />
                      Verifying Access...
                    </>
                  ) : (
                    <>
                      Continue to Dashboard
                      <FiChevronRight />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="mt-0.5 text-[#165bbd]" />
                  <div>
                    <p className="text-sm font-bold text-[#0a1f4a]">Secure access notice</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Only authorized staff accounts can access this system. Contact management for profile or password support.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs uppercase tracking-[0.18em] text-gray-400">
              MIGoC TrustCash • Teller Operations Interface
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/customer-signup" element={<CustomerSignup />} />
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/online-loan-application" element={<OnlineLoanApplication />} />

        <Route path="/" element={user ? <MainDashboard /> : StaffLoginScreen} />

        <Route
          path="/category/:id"
          element={
            <ProtectedRoute>
              <CategoryDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/finance"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <SusuOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/microfinance"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <Microfinance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/susu-registration"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <SusuRegistration />
            </ProtectedRoute>
          }
        />

        <Route
          path="/susu-collection"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <SusuCollection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/susu-payout"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <SusuPayout />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approved-payout-completion"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <ApprovedPayoutCompletion />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loan-repayments"
          element={
            <ProtectedRoute allowedRoles={['financial-agent', 'admin']}>
              <LoanRepayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/remittance"
          element={
            <ProtectedRoute allowedRoles={['remittances-agent', 'admin']}>
              <RemittanceOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/foreign-exchange"
          element={
            <ProtectedRoute allowedRoles={['forex-agent', 'admin']}>
              <ForeignExchange />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/payments"
          element={
            <ProtectedRoute allowedRoles={['info-agent', 'admin']}>
              <PaymentsOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/telecom"
          element={
            <ProtectedRoute allowedRoles={['info-agent', 'admin']}>
              <TelecomOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspace/momo"
          element={
            <ProtectedRoute allowedRoles={['info-agent', 'admin']}>
              <MomoOffice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-hub"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-records"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage-customers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageCustomers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/susu-reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SusuReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-log"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ActivityLog />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-payout-approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPayoutApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teller-sessions"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TellerSessions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-loan-approvals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLoanApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loan-disbursement"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LoanDisbursement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/loan-schedule-manager"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LoanScheduleManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-kyc-review"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminKYCReview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/staff-profile"
          element={
            <ProtectedRoute allowedRoles={['admin', 'info-agent', 'remittances-agent', 'financial-agent', 'forex-agent']}>
              <StaffProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={['admin', 'info-agent', 'remittances-agent', 'financial-agent', 'forex-agent']}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/fileupload"
          element={
            <div className="p-10">
              <h1 className="text-2xl font-bold mb-4">File Upload Test</h1>
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  try {
                    const url = await uploadFileToStorage(file, 'test-uploads');
                    console.log('Uploaded URL:', url);
                    alert('Upload successful!');
                  } catch (err) {
                    console.error(err);
                    alert('Upload failed');
                  }
                }}
              />
            </div>
          }
        />

        <Route
          path="/lonescoring"
          element={
            <div className="p-10">
              Eligibility Score: {calculateLoanEligibilityScore({}, {}).score}
            </div>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;