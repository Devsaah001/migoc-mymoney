import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  FiArrowUpCircle,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiShield,
  FiDollarSign,
  FiAlertTriangle,
} from 'react-icons/fi';

function CustomerDashboard() {
  const { user } = useAuth();

  const [customerData, setCustomerData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [loanRepayments, setLoanRepayments] = useState([]);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubHistory = () => {};
    let unsubLoans = () => {};
    let unsubRepayments = () => {};

    const customerQuery = query(
      collection(db, 'susu_customers'),
      where('email', '==', user.email)
    );

    const unsubCustomer = onSnapshot(customerQuery, (snap) => {
      unsubHistory();
      unsubLoans();
      unsubRepayments();

      if (!snap.empty) {
        const customerDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setCustomerData(customerDoc);

        const historyQuery = query(
          collection(db, 'susu_collections'),
          where('customerId', '==', customerDoc.id),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        unsubHistory = onSnapshot(historyQuery, (historySnap) => {
          setHistory(historySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        const loansQuery = query(
          collection(db, 'loans'),
          where('customerId', '==', customerDoc.id),
          orderBy('createdAt', 'desc')
        );

        unsubLoans = onSnapshot(loansQuery, (loanSnap) => {
          const loans = loanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setLoanApplications(loans);

          const activeLoan = loans[0];
          if (activeLoan?.id) {
            const repaymentQuery = query(
              collection(db, 'loan_repayments'),
              where('loanId', '==', activeLoan.id),
              orderBy('createdAt', 'desc'),
              limit(20)
            );

            unsubRepayments = onSnapshot(repaymentQuery, (repaymentSnap) => {
              setLoanRepayments(
                repaymentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
              );
            });
          } else {
            setLoanRepayments([]);
          }
        });
      } else {
        setCustomerData(null);
        setHistory([]);
        setLoanApplications([]);
        setLoanRepayments([]);
      }

      setLoading(false);
    });

    return () => {
      unsubCustomer();
      unsubHistory();
      unsubLoans();
      unsubRepayments();
    };
  }, [user]);

  const latestLoan = useMemo(() => {
    return loanApplications.length > 0 ? loanApplications[0] : null;
  }, [loanApplications]);

  const handleOnlineDeposit = async () => {
    if (!customerData) {
      alert('Customer profile not found.');
      return;
    }

    const amount = Number(depositAmount);

    if (!amount || amount <= 0) {
      alert('Enter valid amount');
      return;
    }

    try {
      alert(
        `Initiating MoMo Push to ${customerData.phone}... Please check your phone to authorize $${amount}`
      );

      await addDoc(collection(db, 'notifications'), {
        title: 'Online Deposit Request',
        message: `${customerData.fullName} initiated a $${amount} deposit via Mobile Money.`,
        type: 'deposit_request',
        status: 'pending',
        customerId: customerData.id,
        customerName: customerData.fullName || '',
        customerPhone: customerData.phone || '',
        amount,
        network: 'MTN Mobile Money',
        createdByUserId: user?.uid || '',
        createdByEmail: user?.email || '',
        createdAt: serverTimestamp(),
      });

      setDepositAmount('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateReq = async (e) => {
    e.preventDefault();

    if (!customerData) {
      alert('Customer profile not found.');
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Profile Update Request',
        message: `${customerData.fullName} wants to update phone to: ${newPhone}`,
        type: 'profile_update_request',
        status: 'pending',
        customerId: customerData.id,
        customerName: customerData.fullName || '',
        currentPhone: customerData.phone || '',
        requestedPhone: newPhone.trim(),
        createdByUserId: user?.uid || '',
        createdByEmail: user?.email || '',
        createdAt: serverTimestamp(),
      });

      alert('Request sent to Admin for approval.');
      setShowUpdateForm(false);
      setNewPhone('');
    } catch (err) {
      alert(err.message);
    }
  };

  const getLoanStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'pending' || value === 'pending_kyc_review') return 'bg-yellow-50 text-yellow-700';
    if (value === 'approved') return 'bg-blue-50 text-blue-700';
    if (value === 'disbursed') return 'bg-green-50 text-green-700';
    if (value === 'completed') return 'bg-emerald-50 text-emerald-700';
    if (value === 'overdue') return 'bg-red-50 text-red-700';
    if (value === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-gray-50 text-gray-700';
  };

  const getKycStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'verified') return 'bg-green-50 text-green-700';
    if (value === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-bold text-blue-900">
        MIGoC TrustCash: Securing Wallet...
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#f8fafc]">
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border text-center max-w-xl">
          <h2 className="text-2xl font-black text-gray-800 mb-3">No Susu Profile Found</h2>
          <p className="text-gray-500">
            No customer profile is linked to this login account yet. Contact Admin to connect
            your customer email to your Susu profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-[#165bbd] to-[#072a6b] p-10 rounded-[3rem] text-white shadow-2xl mb-10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

          <p className="text-sm opacity-60 uppercase tracking-widest font-black">
            Total Savings Balance
          </p>
          <h1 className="text-6xl font-black mt-2">
            ${Number(customerData.balance || 0).toLocaleString()}
          </h1>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="opacity-60 uppercase text-[10px] font-black">Customer Name</p>
              <p className="font-bold mt-1">{customerData.fullName || 'N/A'}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="opacity-60 uppercase text-[10px] font-black">Contribution Type</p>
              <p className="font-bold mt-1">{customerData.contributionType || 'daily'}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="opacity-60 uppercase text-[10px] font-black">Cycle Progress</p>
              <p className="font-bold mt-1">
                {customerData.totalContributions || 0}/{customerData.cycleDays || 30}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('deposit');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all"
            >
              <FiArrowUpCircle /> Instant Deposit
            </button>

            <button
              onClick={() => setShowUpdateForm(true)}
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all"
            >
              <FiRefreshCw /> Request Profile Update
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 mb-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiTrendingUp /> Loan Overview
            </h3>

            {latestLoan ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">Loan Status</p>
                    <span className={`inline-block mt-2 px-3 py-2 rounded-xl text-xs font-black uppercase ${getLoanStatusStyle(latestLoan.status)}`}>
                      {latestLoan.status || 'pending'}
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">KYC Status</p>
                    <span className={`inline-block mt-2 px-3 py-2 rounded-xl text-xs font-black uppercase ${getKycStatusStyle(latestLoan.kycStatus)}`}>
                      {latestLoan.kycStatus || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">Loan Amount</p>
                    <p className="text-2xl font-black text-blue-700 mt-2">
                      ${Number(latestLoan.loanAmount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-[10px] uppercase font-black text-green-600">Approved Amount</p>
                    <p className="text-2xl font-black text-green-700 mt-2">
                      ${Number(latestLoan.approvedAmount || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <p className="text-[10px] uppercase font-black text-yellow-600">Outstanding Balance</p>
                    <p className="text-2xl font-black text-yellow-700 mt-2">
                      ${Number(latestLoan.loanBalance || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                    <p className="text-[10px] uppercase font-black text-red-600">Penalty Amount</p>
                    <p className="text-2xl font-black text-red-700 mt-2">
                      ${Number(latestLoan.penaltyAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">Next Due Date</p>
                    <p className="font-black text-gray-800 mt-2">
                      {latestLoan.nextDueDate || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">Monthly Due</p>
                    <p className="font-black text-gray-800 mt-2">
                      ${Number(latestLoan.monthlyDue || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">Eligibility Score</p>
                    <p className="font-black text-gray-800 mt-2">
                      {Number(latestLoan.eligibilityScore || 0)}/100
                    </p>
                  </div>
                </div>

                {latestLoan.reviewNote && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] uppercase font-black text-gray-400">Admin Note</p>
                    <p className="text-sm text-gray-700 mt-2">{latestLoan.reviewNote}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                No loan application found yet. Once you apply, your loan and KYC status will appear here.
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiDollarSign /> Loan Repayment History
            </h3>

            <div className="space-y-4">
              {loanRepayments.length > 0 ? (
                loanRepayments.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p className="font-black text-gray-800 text-sm uppercase">Loan Repayment</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        New Balance: ${Number(item.newBalance || 0).toLocaleString()}
                      </p>
                    </div>

                    <p className="text-green-600 font-black text-lg">
                      -${Number(item.amount || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-300 py-10">
                  No loan repayments recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FiClock /> My Collection History
            </h3>

            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((t) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p className="font-black text-gray-800 text-sm uppercase">
                        {t.contributionType || 'deposit'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {t.collectionDate || 'No date'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Receipt: {t.receiptNo || 'N/A'}
                      </p>
                    </div>

                    <p className="text-green-600 font-black text-lg">
                      +${Number(t.amount || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-300 py-10">
                  No transactions recorded yet.
                </p>
              )}
            </div>
          </div>

          <div
            id="deposit"
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">Online Susu Deposit</h3>

            <div className="space-y-4">
              <div className="p-5 border-2 border-blue-500 bg-blue-50 rounded-3xl flex justify-between items-center cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="font-black text-blue-900">MTN Mobile Money</span>
                </div>
                <FiCheckCircle className="text-blue-500" />
              </div>

              <div className="p-5 border border-gray-100 rounded-3xl flex items-center gap-3 opacity-50">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                <span className="font-bold text-gray-400">Orange Money</span>
              </div>

              <div className="mt-6">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                  Deposit Amount ($)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-5 mt-1 bg-gray-50 rounded-3xl border border-gray-200 text-3xl font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleOnlineDeposit}
                className="w-full bg-[#8bc34a] text-white py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-green-600 transition-all uppercase tracking-tighter"
              >
                Deposit Now
              </button>
            </div>

            {latestLoan && String(latestLoan.status || '').toLowerCase() === 'overdue' && (
              <div className="mt-6 p-5 rounded-2xl bg-red-50 border border-red-100 flex gap-3">
                <FiAlertTriangle className="text-red-600 text-xl mt-1" />
                <div>
                  <p className="font-black text-red-700">Loan Overdue Alert</p>
                  <p className="text-sm text-red-700 mt-1">
                    Your loan is overdue. Please make payment or contact the office immediately.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showUpdateForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
            <div className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black text-gray-800 mb-2">Update Request</h2>
              <p className="text-gray-400 text-sm mb-6">
                Enter your new phone number. Admin will verify before updating.
              </p>

              <form onSubmit={handleUpdateReq}>
                <input
                  placeholder="New Phone Number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-4 font-bold"
                  required
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;