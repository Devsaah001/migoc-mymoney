import { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';

function LoanDisbursement() {
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [disbursementNote, setDisbursementNote] = useState('');
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'loans'), where('status', '==', 'approved'));
    const unsub = onSnapshot(q, (snap) => {
      setApprovedLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const handleDisburse = async (loan) => {
    setLoadingId(loan.id);

    try {
      const approvedAmount = Number(loan.approvedAmount || loan.loanAmount || 0);
      const durationMonths = Number(loan.durationMonths || 1);
      const totalRepayable = Number(loan.totalRepayable || approvedAmount);
      const monthlyDue = Number((totalRepayable / durationMonths).toFixed(2));

      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);

      await updateDoc(doc(db, 'loans', loan.id), {
        status: 'disbursed',
        disbursedAt: serverTimestamp(),
        disbursedBy: 'Main Admin',
        disbursementNote: disbursementNote.trim(),
        loanBalance: totalRepayable,
        monthlyDue,
        nextDueDate: nextDue.toISOString().split('T')[0],
        repaymentCount: Number(loan.repaymentCount || 0),
        penaltyAmount: Number(loan.penaltyAmount || 0),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'DISBURSED_LOAN',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: approvedAmount,
        userName: 'Main Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });

      alert('Loan disbursed successfully');
      setSelectedLoan(null);
      setDisbursementNote('');
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
            Loan Disbursement
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Release approved loans and activate repayment cycle
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Approved Loans</h3>

            <div className="space-y-4">
              {approvedLoans.length > 0 ? (
                approvedLoans.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedLoan?.id === loan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-black text-gray-800">{loan.fullName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Approved: ${Number(loan.approvedAmount || loan.loanAmount || 0).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                  No approved loans waiting for disbursement.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {!selectedLoan ? (
              <div className="min-h-[420px] flex items-center justify-center text-gray-400 font-semibold">
                Select an approved loan to disburse.
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">
                    Disbursement Review
                  </p>
                  <h2 className="text-3xl font-black text-gray-800 mt-1">
                    {selectedLoan.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 rounded-3xl bg-green-50 border border-green-100">
                    <p className="text-[10px] uppercase font-black text-green-600">Approved Amount</p>
                    <h3 className="text-2xl font-black text-green-700 mt-2">
                      ${Number(selectedLoan.approvedAmount || selectedLoan.loanAmount || 0).toLocaleString()}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">Interest</p>
                    <h3 className="text-2xl font-black text-blue-700 mt-2">
                      {Number(selectedLoan.interestRate || 0)}%
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                    <p className="text-[10px] uppercase font-black text-yellow-600">Duration</p>
                    <h3 className="text-2xl font-black text-yellow-700 mt-2">
                      {Number(selectedLoan.durationMonths || 0)} mo
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-purple-50 border border-purple-100">
                    <p className="text-[10px] uppercase font-black text-purple-600">Total Repayable</p>
                    <h3 className="text-2xl font-black text-purple-700 mt-2">
                      ${Number(selectedLoan.totalRepayable || 0).toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <label className="text-[10px] uppercase font-black text-gray-400">
                    Disbursement Note
                  </label>
                  <textarea
                    value={disbursementNote}
                    onChange={(e) => setDisbursementNote(e.target.value)}
                    rows={5}
                    className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
                    placeholder="Enter disbursement note..."
                  />
                </div>

                <button
                  onClick={() => handleDisburse(selectedLoan)}
                  disabled={loadingId === selectedLoan.id}
                  className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <FiCheckCircle /> Disburse Loan
                </button>

                <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-8 rounded-[2.5rem] text-white shadow-xl">
                  <FiClock className="text-blue-300 text-4xl mb-4" />
                  <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">
                    Disbursement Note
                  </h3>
                  <p className="text-sm opacity-70 leading-relaxed font-medium">
                    Once disbursed, the loan becomes active, repayment balance is opened,
                    monthly due is set, and next due date is generated automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanDisbursement;