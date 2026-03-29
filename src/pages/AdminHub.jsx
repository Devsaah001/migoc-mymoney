import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  serverTimestamp,
  limit,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import {
  FiTrendingUp,
  FiUsers,
  FiActivity,
  FiArrowLeft,
  FiShield,
  FiUserPlus,
  FiDollarSign,
  FiRefreshCw,
  FiBell,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function AdminHub() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [collectionsData, setCollectionsData] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [tellerSessions, setTellerSessions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    temporaryPassword: '',
    role: 'teller',
    branchName: '',
    branchId: '',
  });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [loadingRequestId, setLoadingRequestId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubCollections = onSnapshot(
      query(collection(db, 'susu_collections'), orderBy('createdAt', 'desc')),
      (snap) => setCollectionsData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubStaff = onSnapshot(collection(db, 'users'), (snap) =>
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCustomers = onSnapshot(collection(db, 'susu_customers'), (snap) =>
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) =>
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubPayouts = onSnapshot(
      query(collection(db, 'susu_payouts'), orderBy('createdAt', 'desc')),
      (snap) => setPayouts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubPayoutRequests = onSnapshot(
      query(collection(db, 'payout_requests'), orderBy('createdAt', 'desc')),
      (snap) => setPayoutRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubTellerSessions = onSnapshot(
      query(collection(db, 'teller_sessions'), orderBy('loginTime', 'desc')),
      (snap) => setTellerSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubActivityLogs = onSnapshot(
      query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => setActivityLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubCollections();
      unsubStaff();
      unsubCustomers();
      unsubLoans();
      unsubPayouts();
      unsubPayoutRequests();
      unsubTellerSessions();
      unsubActivityLogs();
    };
  }, []);

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const parseDate = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isToday = (value) => {
    const d = parseDate(value);
    if (!d) return false;
    return d.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (value) => {
    const d = parseDate(value);
    if (!d) return false;
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isCurrentYear = (value) => {
    const d = parseDate(value);
    if (!d) return false;
    return d.getFullYear() === currentYear;
  };

  const totalSavings = customers.reduce(
    (acc, curr) => acc + Number(curr.balance || 0),
    0
  );

  const activeLoans = loans.filter((loan) =>
    ['approved', 'disbursed', 'active'].includes(
      String(loan.status || '').toLowerCase()
    )
  ).length;

  const pendingLoans = loans.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'pending'
  ).length;

  const approvedLoans = loans.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'approved'
  ).length;

  const disbursedLoans = loans.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'disbursed'
  ).length;

  const overdueLoans = loans.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'overdue'
  ).length;

  const completedLoans = loans.filter(
    (loan) => String(loan.status || '').toLowerCase() === 'completed'
  ).length;

  const totalLoanPortfolio = loans.reduce(
    (acc, curr) => acc + Number(curr.balance || curr.loanBalance || 0),
    0
  );

  const loanRepaymentCollected = loans.reduce((sum, loan) => {
    const totalRepayable = Number(loan.totalRepayable || 0);
    const loanBalance = Number(loan.loanBalance || 0);
    const repaid = totalRepayable > 0 ? Math.max(totalRepayable - loanBalance, 0) : 0;
    return sum + repaid;
  }, 0);

  const depositsToday = collectionsData.filter(
    (item) => item.collectionDate === todayKey || isToday(item.createdAt)
  );

  const depositsThisMonth = collectionsData.filter(
    (item) => isCurrentMonth(item.createdAt) || isCurrentMonth(item.collectionDate)
  );

  const depositsThisYear = collectionsData.filter(
    (item) => isCurrentYear(item.createdAt) || isCurrentYear(item.collectionDate)
  );

  const depositsTodayAmount = depositsToday.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const depositsMonthAmount = depositsThisMonth.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const depositsYearAmount = depositsThisYear.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0
  );

  const totalPayouts = payouts.reduce(
    (acc, curr) => acc + Number(curr.payoutAmount || 0),
    0
  );

  const pendingPayoutRequests = payoutRequests.filter(
    (item) => String(item.status || '').toLowerCase() === 'pending'
  );

  const approvedPayoutRequests = payoutRequests.filter(
    (item) => String(item.status || '').toLowerCase() === 'approved'
  );

  const newCustomerAlerts = activityLogs.filter(
    (item) => item.action === 'REGISTERED_CUSTOMER'
  );

  const todayTellerSessions = tellerSessions.filter((item) => item.dateKey === todayKey);
  const activeTellers = todayTellerSessions.filter((item) => item.active === true).length;

  const tellerMap = collectionsData.reduce((acc, tx) => {
    const tellerName = tx.tellerName || 'Unknown';
    if (!acc[tellerName]) {
      acc[tellerName] = { tellerName, transactions: 0, totalAmount: 0 };
    }
    acc[tellerName].transactions += 1;
    acc[tellerName].totalAmount += Number(tx.amount || 0);
    return acc;
  }, {});

  const tellerLeaderboard = Object.values(tellerMap).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyBuckets = monthLabels.map((label, index) => {
    const total = collectionsData.reduce((sum, item) => {
      const d = parseDate(item.createdAt) || parseDate(item.collectionDate);
      if (!d) return sum;
      if (d.getFullYear() === currentYear && d.getMonth() === index) {
        return sum + Number(item.amount || 0);
      }
      return sum;
    }, 0);

    return { label, total };
  });

  const maxMonthlyTotal = Math.max(...monthlyBuckets.map((m) => m.total), 1);

  const branchMap = customers.reduce((acc, customer) => {
    const branchName = customer.branchName || 'Unassigned Branch';
    if (!acc[branchName]) {
      acc[branchName] = { branchName, customers: 0, savings: 0 };
    }
    acc[branchName].customers += 1;
    acc[branchName].savings += Number(customer.balance || 0);
    return acc;
  }, {});

  const branchPerformance = Object.values(branchMap).sort(
    (a, b) => b.savings - a.savings
  );

  const alertItems = [
    ...pendingPayoutRequests.slice(0, 5).map((item) => ({
      id: `payout-${item.id}`,
      type: 'Payout Approval Needed',
      title: item.customerName,
      subtitle: `Requested by ${item.requestedBy || 'System'}`,
      amount: item.payoutAmount || 0,
      color: 'text-orange-400',
    })),
    ...newCustomerAlerts.slice(0, 5).map((item) => ({
      id: `customer-${item.id}`,
      type: 'New Customer Alert',
      title: item.customerName || 'New Customer',
      subtitle: `Registered by ${item.userName || 'System'}`,
      amount: 0,
      color: 'text-blue-400',
    })),
    ...todayTellerSessions
      .filter((item) => item.active === true)
      .slice(0, 5)
      .map((item) => ({
        id: `session-${item.id}`,
        type: 'Teller Login Activity',
        title: item.tellerEmail || item.tellerName || 'Unknown Teller',
        subtitle: `Logged in today`,
        amount: 0,
        color: 'text-green-400',
      })),
  ];

  const handleApprovePayout = async (item) => {
    setLoadingRequestId(item.id);
    try {
      await updateDoc(doc(db, 'payout_requests', item.id), {
        status: 'approved',
        approvedBy: 'Main Admin',
        approvedById: 'admin-dashboard',
        approvedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'APPROVED_PAYOUT_REQUEST',
        customerId: item.customerId,
        customerName: item.customerName,
        amount: item.payoutAmount || 0,
        serviceCharge: item.serviceCharge || 0,
        userName: 'Main Admin',
        role: 'admin',
        branchId: item.branchId || '',
        branchName: item.branchName || '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message);
    }
    setLoadingRequestId('');
  };

  const handleRejectPayout = async (item) => {
    setLoadingRequestId(item.id);
    try {
      await updateDoc(doc(db, 'payout_requests', item.id), {
        status: 'rejected',
        approvedBy: 'Main Admin',
        approvedById: 'admin-dashboard',
        approvedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'REJECTED_PAYOUT_REQUEST',
        customerId: item.customerId,
        customerName: item.customerName,
        amount: item.payoutAmount || 0,
        serviceCharge: item.serviceCharge || 0,
        userName: 'Main Admin',
        role: 'admin',
        branchId: item.branchId || '',
        branchName: item.branchName || '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message);
    }
    setLoadingRequestId('');
  };

  const handleResetStaffPassword = async (staffEmail) => {
    if (!staffEmail) {
      alert('Staff email not found.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, staffEmail.trim().toLowerCase());
      alert(`Password reset email sent to ${staffEmail}`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        alert('No authentication account exists yet for this email.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Invalid email address.');
      } else {
        alert(err.message);
      }
    }
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    if (!newStaff.name || !newStaff.email || !newStaff.temporaryPassword) {
      alert('Enter staff name, email, and temporary password');
      return;
    }

    setCreatingStaff(true);

    try {
      const functions = getFunctions();
      const createStaffUser = httpsCallable(functions, 'createStaffUser');

      const result = await createStaffUser({
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        temporaryPassword: newStaff.temporaryPassword,
        role: newStaff.role,
        branchName: newStaff.branchName,
        branchId: newStaff.branchId,
      });

      alert(result.data.message || 'Staff access created successfully.');

      setNewStaff({
        name: '',
        email: '',
        phone: '',
        temporaryPassword: '',
        role: 'teller',
        branchName: '',
        branchId: '',
      });
    } catch (err) {
      alert(err.message || 'Failed to create staff user.');
    }

    setCreatingStaff(false);
  };

  const quickStats = [
    { label: 'Total Customers', value: customers.length, color: 'text-blue-400' },
    { label: 'Total Savings', value: `$${totalSavings.toLocaleString()}`, color: 'text-green-400' },
    { label: 'Deposits Today', value: `$${depositsTodayAmount.toLocaleString()}`, color: 'text-yellow-400' },
    { label: 'Active Loans', value: activeLoans, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1128] text-white font-sans">
      <nav className="p-8 flex justify-between items-center border-b border-white/5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-400 font-bold hover:text-white transition-colors"
        >
          <FiArrowLeft /> Return to Terminal
        </button>

        <div className="text-right">
          <h1 className="text-2xl font-black tracking-tighter">MIGoC COMMAND CENTER</h1>
          <p className="text-[10px] text-blue-300 uppercase font-bold tracking-[0.3em]">
            Authorized Intelligence Only
          </p>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="flex flex-wrap gap-4 mb-10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            Analytics
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'alerts'
                ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            Alerts & Approvals
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'staff'
                ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            Staff Control
          </button>
        </div>

        {activeTab === 'analytics' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {quickStats.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{item.label}</p>
                  <h2 className={`text-4xl font-black mt-2 ${item.color}`}>{item.value}</h2>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FiBarChart2 className="text-cyan-400" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Monthly Revenue</p>
                </div>
                <h2 className="text-4xl font-black text-cyan-400">
                  ${depositsMonthAmount.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FiTrendingUp className="text-emerald-400" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Yearly Revenue</p>
                </div>
                <h2 className="text-4xl font-black text-emerald-400">
                  ${depositsYearAmount.toLocaleString()}
                </h2>
              </div>

              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <FiShield className="text-orange-400" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Pending Payout Approvals</p>
                </div>
                <h2 className="text-4xl font-black text-orange-400">
                  {pendingPayoutRequests.length}
                </h2>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-400 uppercase mb-4">
                Loan Workflow
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div
                  onClick={() => navigate('/admin-kyc-review')}
                  className="bg-white/5 p-8 rounded-[2rem] border border-white/10 cursor-pointer hover:border-purple-400 transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Loan Workflow</p>
                  <h2 className="text-2xl font-black text-purple-400 mt-2">KYC Review</h2>
                  <p className="text-sm text-gray-400 mt-3">
                    Verify identity, documents, and guarantors.
                  </p>
                </div>

                <div
                  onClick={() => navigate('/admin-loan-approvals')}
                  className="bg-white/5 p-8 rounded-[2rem] border border-white/10 cursor-pointer hover:border-blue-400 transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Loan Workflow</p>
                  <h2 className="text-2xl font-black text-blue-400 mt-2">Loan Approvals</h2>
                  <p className="text-sm text-gray-400 mt-3">
                    Review and approve pending applications.
                  </p>
                </div>

                <div
                  onClick={() => navigate('/loan-disbursement')}
                  className="bg-white/5 p-8 rounded-[2rem] border border-white/10 cursor-pointer hover:border-green-400 transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Loan Workflow</p>
                  <h2 className="text-2xl font-black text-green-400 mt-2">Loan Disbursement</h2>
                  <p className="text-sm text-gray-400 mt-3">
                    Release approved loans.
                  </p>
                </div>

                <div
                  onClick={() => navigate('/loan-repayments')}
                  className="bg-white/5 p-8 rounded-[2rem] border border-white/10 cursor-pointer hover:border-yellow-400 transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Loan Workflow</p>
                  <h2 className="text-2xl font-black text-yellow-400 mt-2">Loan Repayments</h2>
                  <p className="text-sm text-gray-400 mt-3">
                    Record repayments and reduce balances.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 mt-6">
                <div
                  onClick={() => navigate('/loan-schedule-manager')}
                  className="bg-white/5 p-8 rounded-[2rem] border border-white/10 cursor-pointer hover:border-red-400 transition-all"
                >
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Loan Workflow</p>
                  <h2 className="text-2xl font-black text-red-400 mt-2">Schedule & Penalties</h2>
                  <p className="text-sm text-gray-400 mt-3">
                    Manage overdue loans, next due dates, and late fees.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <FiDollarSign /> Microfinance Loan Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Pending</p>
                  <h2 className="text-3xl font-black text-yellow-400 mt-2">{pendingLoans}</h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Approved</p>
                  <h2 className="text-3xl font-black text-blue-400 mt-2">{approvedLoans}</h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Disbursed</p>
                  <h2 className="text-3xl font-black text-green-400 mt-2">{disbursedLoans}</h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Overdue</p>
                  <h2 className="text-3xl font-black text-red-400 mt-2">{overdueLoans}</h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Completed</p>
                  <h2 className="text-3xl font-black text-emerald-400 mt-2">{completedLoans}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Total Loan Portfolio</p>
                  <h2 className="text-3xl font-black text-cyan-400 mt-2">
                    ${totalLoanPortfolio.toLocaleString()}
                  </h2>
                </div>

                <div className="p-6 rounded-2xl bg-white/5">
                  <p className="text-[10px] uppercase text-gray-500 font-bold">Repayment Collected</p>
                  <h2 className="text-3xl font-black text-green-400 mt-2">
                    ${loanRepaymentCollected.toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiBarChart2 /> Daily / Monthly / Yearly Deposits
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-5 rounded-2xl bg-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Daily</p>
                    <p className="text-3xl font-black text-yellow-400 mt-2">
                      ${depositsTodayAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Monthly</p>
                    <p className="text-3xl font-black text-cyan-400 mt-2">
                      ${depositsMonthAmount.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/5">
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Yearly</p>
                    <p className="text-3xl font-black text-green-400 mt-2">
                      ${depositsYearAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {monthlyBuckets.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-300 font-bold">{item.label}</span>
                        <span className="text-blue-300 font-bold">
                          ${item.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.max((item.total / maxMonthlyTotal) * 100, item.total > 0 ? 6 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiUsers /> Teller Performance Leaderboard
                </h3>

                <div className="space-y-4">
                  {tellerLeaderboard.length > 0 ? (
                    tellerLeaderboard.slice(0, 8).map((teller, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 rounded-2xl bg-white/5"
                      >
                        <div>
                          <p className="font-bold">{teller.tellerName}</p>
                          <p className="text-xs text-gray-400 uppercase">
                            {teller.transactions} collection(s)
                          </p>
                        </div>
                        <p className="text-blue-400 font-black">
                          ${teller.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No teller performance data yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiActivity /> Branch Performance
                </h3>

                <div className="space-y-4">
                  {branchPerformance.length > 0 ? (
                    branchPerformance.slice(0, 8).map((branch, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 rounded-2xl bg-white/5"
                      >
                        <div>
                          <p className="font-bold">{branch.branchName}</p>
                          <p className="text-xs text-gray-400 uppercase">
                            {branch.customers} customer(s)
                          </p>
                        </div>
                        <p className="text-green-400 font-black">
                          ${branch.savings.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No branch performance data yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiDollarSign /> Financial Snapshot
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5">
                    <span className="font-bold">Total Payouts</span>
                    <span className="text-orange-400 font-black">
                      ${totalPayouts.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5">
                    <span className="font-bold">Pending Loans</span>
                    <span className="text-cyan-400 font-black">{pendingLoans}</span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5">
                    <span className="font-bold">Loan Portfolio</span>
                    <span className="text-emerald-400 font-black">
                      ${totalLoanPortfolio.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5">
                    <span className="font-bold">Active Tellers Today</span>
                    <span className="text-yellow-400 font-black">{activeTellers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-bold text-gray-500 uppercase">New Customer Alerts</p>
                <h2 className="text-4xl font-black text-blue-400 mt-2">
                  {newCustomerAlerts.length}
                </h2>
              </div>

              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Payout Requests Pending</p>
                <h2 className="text-4xl font-black text-orange-400 mt-2">
                  {pendingPayoutRequests.length}
                </h2>
              </div>

              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Approved Payouts Waiting</p>
                <h2 className="text-4xl font-black text-green-400 mt-2">
                  {approvedPayoutRequests.length}
                </h2>
              </div>

              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Teller Logins Today</p>
                <h2 className="text-4xl font-black text-cyan-400 mt-2">
                  {todayTellerSessions.length}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <FiBell /> Real-Time Alerts
                  </h3>
                </div>

                <div className="space-y-4">
                  {alertItems.length > 0 ? (
                    alertItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5"
                      >
                        <p className={`text-[10px] uppercase font-black ${item.color}`}>
                          {item.type}
                        </p>
                        <p className="font-bold text-white mt-1">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{item.subtitle}</p>
                        {Number(item.amount) > 0 && (
                          <p className="text-sm font-black text-green-400 mt-2">
                            ${Number(item.amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No live alerts at the moment.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiRefreshCw /> Payout Requests Awaiting Approval
                </h3>

                <div className="space-y-4">
                  {pendingPayoutRequests.length > 0 ? (
                    pendingPayoutRequests.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5"
                      >
                        <div className="flex justify-between items-center gap-4">
                          <div>
                            <p className="font-bold text-white">{item.customerName}</p>
                            <p className="text-xs text-gray-400">
                              Requested by: {item.requestedBy || 'System'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Branch: {item.branchName || 'N/A'}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-orange-400 font-black">
                              ${Number(item.payoutAmount || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleRejectPayout(item)}
                            disabled={loadingRequestId === item.id}
                            className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <FiXCircle /> Reject
                          </button>

                          <button
                            onClick={() => handleApprovePayout(item)}
                            disabled={loadingRequestId === item.id}
                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <FiCheckCircle /> Approve
                          </button>

                          <button
                            onClick={() => navigate('/admin-payout-approvals')}
                            className="bg-blue-600 px-4 py-3 rounded-xl font-bold"
                          >
                            Full View
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No pending payout requests.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiUserPlus /> New Customer Alerts
                </h3>

                <div className="space-y-4">
                  {newCustomerAlerts.length > 0 ? (
                    newCustomerAlerts.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-white">{item.customerName || 'New Customer'}</p>
                          <p className="text-xs text-gray-400">
                            Registered by: {item.userName || 'System'}
                          </p>
                        </div>
                        <p className="text-blue-400 text-xs font-black uppercase">
                          New Registration
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No customer alerts yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <FiClock /> Teller Login Activity
                </h3>

                <div className="space-y-4">
                  {todayTellerSessions.length > 0 ? (
                    todayTellerSessions.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/5 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-white">
                            {item.tellerEmail || item.tellerName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400">Date: {item.dateKey}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-green-400 text-xs font-black uppercase">
                            {item.active ? 'Active' : 'Closed'}
                          </p>
                          <button
                            onClick={() => navigate('/teller-sessions')}
                            className="mt-2 text-xs bg-blue-600 px-3 py-2 rounded-lg font-bold"
                          >
                            View Report
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                      No teller login activity found today.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                <FiUserPlus /> Authorize Staff
              </h3>
              <p className="text-gray-500 mb-8">
                Create login account + staff profile in one step.
              </p>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <input
                  name="name"
                  value={newStaff.name}
                  onChange={handleStaffChange}
                  placeholder="Full Name"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                  required
                />

                <input
                  name="email"
                  type="email"
                  value={newStaff.email}
                  onChange={handleStaffChange}
                  placeholder="Official Email"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                  required
                />

                <input
                  name="phone"
                  value={newStaff.phone}
                  onChange={handleStaffChange}
                  placeholder="Phone Number"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                />

                <input
                  name="temporaryPassword"
                  type="password"
                  value={newStaff.temporaryPassword}
                  onChange={handleStaffChange}
                  placeholder="Temporary Password"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                  required
                />

                <select
                  name="role"
                  value={newStaff.role}
                  onChange={handleStaffChange}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                >
                  <option value="teller">Teller</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                </select>

                <input
                  name="branchName"
                  value={newStaff.branchName}
                  onChange={handleStaffChange}
                  placeholder="Branch Name"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                />

                <input
                  name="branchId"
                  value={newStaff.branchId}
                  onChange={handleStaffChange}
                  placeholder="Branch ID"
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none"
                />

                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="w-full bg-blue-600 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all"
                >
                  {creatingStaff ? 'Creating Access...' : 'Create System Access'}
                </button>
              </form>
            </div>

            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                <FiUsers /> Authorized Staff
              </h3>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                {staff.length > 0 ? (
                  staff.map((member) => (
                    <div
                      key={member.id}
                      className="p-5 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-black text-white">
                            {member.name || 'Unnamed Staff'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{member.email}</p>
                          <p className="text-[10px] uppercase text-blue-300 font-bold mt-2">
                            {member.role || 'staff'}
                          </p>
                          <p className="text-[10px] uppercase text-gray-400 font-bold mt-2">
                            Phone: {member.phone || 'N/A'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {member.branchName || 'No Branch'}
                          </p>
                          <p
                            className={`text-[10px] font-bold uppercase mt-2 ${
                              member.isActive ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Disabled'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-5">
                        <button
                          type="button"
                          onClick={() => handleResetStaffPassword(member.email)}
                          className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-bold text-sm"
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-white/5 text-gray-400 text-sm">
                    No staff records found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminHub;