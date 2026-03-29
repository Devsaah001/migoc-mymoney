import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FiDollarSign, FiClock, FiCheckCircle, FiSearch } from 'react-icons/fi';

function LoanRepayments() {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amount, setAmount] = useState('');
  const [recentPayments, setRecentPayments] = useState([]);
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const qLoans = query(collection(db, 'loans'), where('status', 'in', ['disbursed', 'overdue']));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qPayments = query(collection(db, 'loan_repayments'), orderBy('createdAt', 'desc'));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setRecentPayments(snap.docs.slice(0, 10).map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLoans();
      unsubPayments();
    };
  }, []);

  const searchResults = useMemo(() => {
    return loans.filter((loan) => {
      const name = String(loan.fullName || '').toLowerCase();
      const phone = String(loan.phone || '');
      return (
        name.includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm)
      );
    });
  }, [loans, searchTerm]);

  const handleRepayment = async (loan) => {
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      alert('Enter a valid amount');
      return;
    }

    if (payAmount > Number(loan.loanBalance || 0)) {
      alert('Amount cannot be greater than loan balance');
      return;
    }

    setLoadingId(loan.id);

    try {
      const newBalance = Number(loan.loanBalance || 0) - payAmount;
      const nextStatus = newBalance <= 0 ? 'completed' : 'disbursed';

      let nextDueDate = loan.nextDueDate || null;
      if (newBalance > 0) {
        const next = loan.nextDueDate ? new Date(loan.nextDueDate) : new Date();
        next.setMonth(next.getMonth() + 1);
        nextDueDate = next.toISOString().split('T')[0];
      }

      await updateDoc(doc(db, 'loans', loan.id), {
        loanBalance: Number(newBalance.toFixed(2)),
        status: nextStatus,
        repaymentCount: Number(loan.repaymentCount || 0) + 1,
        lastRepaymentAmount: payAmount,
        lastRepaymentDate: serverTimestamp(),
        nextDueDate: newBalance > 0 ? nextDueDate : null,
        penaltyAmount: nextStatus === 'completed' ? 0 : Number(loan.penaltyAmount || 0),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'loan_repayments'), {
        loanId: loan.id,
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: payAmount,
        previousBalance: Number(loan.loanBalance || 0),
        newBalance: Number(newBalance.toFixed(2)),
        createdBy: 'System Teller',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'RECORDED_LOAN_REPAYMENT',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: payAmount,
        userName: 'System Teller',
        role: 'teller',
        createdAt: serverTimestamp(),
      });

      alert('Repayment recorded successfully');
      setAmount('');
      setSelectedLoan(null);
      setSearchTerm('');
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
            Loan Repayments
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Search active loans and record repayments
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="font-black text-gray-800 mb-6">Find Loan Account</h3>

            <div className="relative mb-6">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                placeholder="Search by customer name or phone..."
                className="w-full p-5 pl-14 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-lg"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>

            {searchTerm && !selectedLoan && (
              <div className="space-y-3 mb-8">
                {searchResults.length > 0 ? (
                  searchResults.map((loan) => (
                    <div
                      key={loan.id}
                      onClick={() => setSelectedLoan(loan)}
                      className="p-5 rounded-2xl border-2 border-gray-50 bg-white hover:border-blue-500 cursor-pointer flex justify-between items-center transition-all"
                    >
                      <div>
                        <p className="font-black text-gray-800">{loan.fullName}</p>
                        <p className="text-xs text-gray-400">{loan.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600">
                          ${Number(loan.loanBalance || 0).toLocaleString()}
                        </p>
                        <p className="text-[10px] uppercase font-black text-blue-600">
                          {loan.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                    No matching loan found.
                  </div>
                )}
              </div>
            )}

            {selectedLoan && (
              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-blue-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      Active Loan
                    </p>
                    <h2 className="text-3xl font-black text-gray-800 mt-1">{selectedLoan.fullName}</h2>
                    <p className="text-sm text-gray-400 mt-2">Next due: {selectedLoan.nextDueDate || 'N/A'}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding Balance</p>
                    <h2 className="text-4xl font-black text-green-600">
                      ${Number(selectedLoan.loanBalance || 0).toLocaleString()}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-white border border-gray-200">
                    <p className="text-[10px] uppercase font-black text-gray-400">Monthly Due</p>
                    <p className="text-xl font-black text-blue-600 mt-2">
                      ${Number(selectedLoan.monthlyDue || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-200">
                    <p className="text-[10px] uppercase font-black text-gray-400">Penalty</p>
                    <p className="text-xl font-black text-red-600 mt-2">
                      ${Number(selectedLoan.penaltyAmount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-gray-200">
                    <p className="text-[10px] uppercase font-black text-gray-400">Repayments</p>
                    <p className="text-xl font-black text-purple-600 mt-2">
                      {Number(selectedLoan.repaymentCount || 0)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-8 pl-14 bg-white rounded-3xl border-2 border-blue-200 text-5xl font-black text-blue-600 outline-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoan(null);
                        setAmount('');
                      }}
                      className="flex-1 bg-white text-gray-400 py-5 rounded-2xl font-bold border border-gray-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRepayment(selectedLoan)}
                      disabled={loadingId === selectedLoan.id}
                      className="flex-[2] bg-[#165bbd] text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3"
                    >
                      <FiCheckCircle /> Record Repayment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                <FiClock /> Recent Repayments
              </h3>

              <div className="space-y-4">
                {recentPayments.length > 0 ? (
                  recentPayments.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-gray-800 uppercase truncate">
                          {item.customerName}
                        </p>
                        <p className="text-[8px] text-gray-400 uppercase font-bold">
                          New Balance: ${Number(item.newBalance || 0).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-black text-green-600 text-lg">
                        +$ {Number(item.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                    No repayments yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-10 rounded-[3rem] text-white shadow-2xl">
              <FiDollarSign className="text-blue-300 text-4xl mb-6" />
              <h3 className="font-black text-xl mb-4 uppercase tracking-tighter">Repayment Desk</h3>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                Every repayment reduces the loan balance automatically and updates the next due date
                until the account is fully completed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanRepayments;