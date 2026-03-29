import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiUsers,
  FiShield,
  FiDollarSign,
} from 'react-icons/fi';

function AdminLoanApprovals() {
  const [applications, setApplications] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const pendingCount = useMemo(
    () => applications.filter((item) => String(item.status || '').toLowerCase() === 'pending').length,
    [applications]
  );

  const approvedCount = useMemo(
    () => applications.filter((item) => String(item.status || '').toLowerCase() === 'approved').length,
    [applications]
  );

  const rejectedCount = useMemo(
    () => applications.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length,
    [applications]
  );

  const getStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'pending') return 'bg-yellow-50 text-yellow-600';
    if (value === 'approved') return 'bg-blue-50 text-blue-600';
    if (value === 'rejected') return 'bg-red-50 text-red-600';
    if (value === 'disbursed') return 'bg-green-50 text-green-600';
    return 'bg-gray-50 text-gray-600';
  };

  const getScoreStyle = (score) => {
    const value = Number(score || 0);
    if (value >= 80) return 'text-green-600';
    if (value >= 65) return 'text-blue-600';
    if (value >= 50) return 'text-yellow-600';
    if (value >= 35) return 'text-orange-600';
    return 'text-red-600';
  };

  const selectLoan = (loan) => {
    setSelectedLoan(loan);
    setReviewNote(loan.reviewNote || '');
    setApprovedAmount(String(loan.approvedAmount || loan.loanAmount || ''));
  };

  const handleApprove = async (loan) => {
    if (String(loan.kycStatus || '').toLowerCase() !== 'verified') {
      alert('KYC must be verified before approval.');
      return;
    }

    const amount = Number(approvedAmount || loan.loanAmount || 0);
    if (!amount || amount <= 0) {
      alert('Enter a valid approved amount');
      return;
    }

    setLoadingId(loan.id);

    try {
      const interestRate = Number(loan.interestRate || 0);
      const durationMonths = Number(loan.durationMonths || 1);
      const interestAmount = (amount * interestRate) / 100;
      const totalRepayable = amount + interestAmount;
      const monthlyDue = totalRepayable / durationMonths;

      await updateDoc(doc(db, 'loans', loan.id), {
        status: 'approved',
        approvedAmount: amount,
        interestAmount,
        totalRepayable,
        monthlyDue: Number(monthlyDue.toFixed(2)),
        reviewNote: reviewNote.trim(),
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'APPROVED_LOAN_APPLICATION',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount,
        userName: 'Main Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });

      alert('Loan approved successfully');
      setSelectedLoan(null);
      setReviewNote('');
      setApprovedAmount('');
    } catch (err) {
      alert(err.message);
    }

    setLoadingId('');
  };

  const handleReject = async (loan) => {
    setLoadingId(loan.id);

    try {
      await updateDoc(doc(db, 'loans', loan.id), {
        status: 'rejected',
        reviewNote: reviewNote.trim(),
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'REJECTED_LOAN_APPLICATION',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: Number(loan.loanAmount || 0),
        userName: 'Main Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });

      alert('Loan rejected');
      setSelectedLoan(null);
      setReviewNote('');
      setApprovedAmount('');
    } catch (err) {
      alert(err.message);
    }

    setLoadingId('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Loan Approval Workflow
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Review and decide on verified loan applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Pending</p>
            <h2 className="text-3xl font-black text-yellow-500 mt-2">{pendingCount}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Approved</p>
            <h2 className="text-3xl font-black text-blue-500 mt-2">{approvedCount}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Rejected</p>
            <h2 className="text-3xl font-black text-red-500 mt-2">{rejectedCount}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Applications</h3>

            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => selectLoan(loan)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedLoan?.id === loan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="font-black text-gray-800">{loan.fullName || 'Unnamed Applicant'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ${Number(loan.loanAmount || 0).toLocaleString()}
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusStyle(loan.status)}`}>
                        {loan.status || 'pending'}
                      </span>
                    </div>

                    <p className={`text-sm font-black mt-3 ${getScoreStyle(loan.eligibilityScore)}`}>
                      Score: {Number(loan.eligibilityScore || 0)}/100
                    </p>
                    <p className="text-[10px] uppercase font-black mt-2 text-purple-600">
                      KYC: {loan.kycStatus || 'pending'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                  No loan applications found.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {!selectedLoan ? (
              <div className="min-h-[420px] flex items-center justify-center text-gray-400 font-semibold">
                Select a loan application to review.
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">
                    Application Review
                  </p>
                  <h2 className="text-3xl font-black text-gray-800 mt-1">
                    {selectedLoan.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 rounded-3xl bg-green-50 border border-green-100">
                    <p className="text-[10px] uppercase font-black text-green-600">Requested</p>
                    <h3 className="text-3xl font-black text-green-700 mt-2">
                      ${Number(selectedLoan.loanAmount || 0).toLocaleString()}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                    <p className="text-[10px] uppercase font-black text-yellow-600">Score</p>
                    <h3 className={`text-3xl font-black mt-2 ${getScoreStyle(selectedLoan.eligibilityScore)}`}>
                      {Number(selectedLoan.eligibilityScore || 0)}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">Grade</p>
                    <h3 className="text-2xl font-black text-blue-700 mt-2">
                      {selectedLoan.eligibilityGrade || 'N/A'}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100">
                    <p className="text-[10px] uppercase font-black text-purple-600">Max Eligible</p>
                    <h3 className="text-2xl font-black text-purple-700 mt-2">
                      ${Number(selectedLoan.maxEligibleAmount || 0).toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                  <p className="text-[10px] uppercase font-black text-yellow-700">KYC Status</p>
                  <h3 className="text-xl font-black text-yellow-800 mt-2">
                    {selectedLoan.kycStatus || 'pending'}
                  </h3>
                  {String(selectedLoan.kycStatus || '').toLowerCase() !== 'verified' && (
                    <p className="text-sm text-yellow-800 mt-3">
                      KYC must be verified before this application can be approved.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiUser /> Applicant Details
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-bold">Phone:</span> {selectedLoan.phone || 'N/A'}</p>
                      <p><span className="font-bold">Email:</span> {selectedLoan.email || 'N/A'}</p>
                      <p><span className="font-bold">Address:</span> {selectedLoan.address || 'N/A'}</p>
                      <p><span className="font-bold">ID Type:</span> {selectedLoan.idType || 'N/A'}</p>
                      <p><span className="font-bold">ID Number:</span> {selectedLoan.idNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiUsers /> Guarantors
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-bold">Guarantor 1:</span> {selectedLoan.guarantorOneName || 'N/A'}</p>
                      <p><span className="font-bold">Phone 1:</span> {selectedLoan.guarantorOnePhone || 'N/A'}</p>
                      <p><span className="font-bold">Guarantor 2:</span> {selectedLoan.guarantorTwoName || 'N/A'}</p>
                      <p><span className="font-bold">Phone 2:</span> {selectedLoan.guarantorTwoPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <label className="text-[10px] uppercase font-black text-gray-400">
                    Approved Amount
                  </label>
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
                    placeholder="Enter approved amount"
                  />
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <label className="text-[10px] uppercase font-black text-gray-400">
                    Admin Review Note
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={5}
                    className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
                    placeholder="Enter approval or rejection note..."
                  />
                </div>

                {String(selectedLoan.status || '').toLowerCase() === 'pending' && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleReject(selectedLoan)}
                      disabled={loadingId === selectedLoan.id}
                      className="flex-1 bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                    >
                      <FiXCircle /> Reject
                    </button>

                    <button
                      onClick={() => handleApprove(selectedLoan)}
                      disabled={
                        loadingId === selectedLoan.id ||
                        String(selectedLoan.kycStatus || '').toLowerCase() !== 'verified'
                      }
                      className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FiCheckCircle /> Approve
                    </button>
                  </div>
                )}

                {['approved', 'rejected', 'disbursed', 'completed'].includes(
                  String(selectedLoan.status || '').toLowerCase()
                ) && (
                  <div className="p-5 rounded-2xl bg-gray-50 text-sm text-gray-500 font-semibold">
                    This application has already been reviewed.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoanApprovals;