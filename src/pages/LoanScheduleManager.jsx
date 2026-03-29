import { useEffect, useMemo, useState } from 'react';
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
import {
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
} from 'react-icons/fi';

function LoanScheduleManager() {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [penaltyRate, setPenaltyRate] = useState('5');
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'loans'),
      where('status', 'in', ['disbursed', 'overdue'])
    );

    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const today = new Date();

  const parseDate = (value) => {
    if (!value) return null;
    if (typeof value?.toDate === 'function') return value.toDate();
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const normalizeDateOnly = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const getLoanMetrics = (loan) => {
    const nextDue = parseDate(loan.nextDueDate);
    const balance = Number(loan.loanBalance || 0);
    const monthlyDue = Number(loan.monthlyDue || 0);
    const penaltyAmount = Number(loan.penaltyAmount || 0);

    let overdueDays = 0;
    if (nextDue && balance > 0) {
      const diff = normalizeDateOnly(today) - normalizeDateOnly(nextDue);
      overdueDays = Math.max(Math.floor(diff / 86400000), 0);
    }

    const isOverdue = overdueDays > 0 && balance > 0;

    return {
      nextDue,
      balance,
      monthlyDue,
      penaltyAmount,
      overdueDays,
      isOverdue,
    };
  };

  const summary = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        const metrics = getLoanMetrics(loan);
        acc.active += 1;
        acc.totalBalance += metrics.balance;
        acc.totalPenalty += metrics.penaltyAmount;
        if (metrics.isOverdue) acc.overdue += 1;
        return acc;
      },
      { active: 0, overdue: 0, totalBalance: 0, totalPenalty: 0 }
    );
  }, [loans]);

  const handleApplyPenalty = async (loan) => {
    const metrics = getLoanMetrics(loan);

    if (!metrics.isOverdue) {
      alert('This loan is not overdue.');
      return;
    }

    const rate = Number(penaltyRate || 0);
    if (!rate || rate <= 0) {
      alert('Enter a valid penalty rate');
      return;
    }

    setLoadingId(loan.id);

    try {
      const penaltyValue = (metrics.monthlyDue * rate) / 100;
      const newPenaltyAmount = Number((metrics.penaltyAmount + penaltyValue).toFixed(2));
      const newBalance = Number((metrics.balance + penaltyValue).toFixed(2));

      await updateDoc(doc(db, 'loans', loan.id), {
        penaltyRate: rate,
        penaltyAmount: newPenaltyAmount,
        loanBalance: newBalance,
        status: 'overdue',
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'loan_penalties'), {
        loanId: loan.id,
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        overdueDays: metrics.overdueDays,
        penaltyRate: rate,
        penaltyAmount: Number(penaltyValue.toFixed(2)),
        previousPenaltyAmount: metrics.penaltyAmount,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'APPLIED_LOAN_PENALTY',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: Number(penaltyValue.toFixed(2)),
        userName: 'Main Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });

      alert('Penalty applied successfully');
    } catch (err) {
      alert(err.message);
    }

    setLoadingId('');
  };

  const handleAdvanceSchedule = async (loan) => {
    setLoadingId(loan.id);

    try {
      const currentDue = parseDate(loan.nextDueDate) || new Date();
      const next = new Date(currentDue);
      next.setMonth(next.getMonth() + 1);

      const nextStatus =
        Number(loan.loanBalance || 0) > 0 ? 'disbursed' : 'completed';

      await updateDoc(doc(db, 'loans', loan.id), {
        nextDueDate: Number(loan.loanBalance || 0) > 0 ? next.toISOString().split('T')[0] : null,
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'ADVANCED_LOAN_SCHEDULE',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        userName: 'Main Admin',
        role: 'admin',
        createdAt: serverTimestamp(),
      });

      alert('Repayment schedule advanced');
    } catch (err) {
      alert(err.message);
    }

    setLoadingId('');
  };

  const formatDate = (value) => {
    const d = parseDate(value);
    return d ? d.toLocaleDateString() : 'N/A';
  };

  const selectedMetrics = selectedLoan ? getLoanMetrics(selectedLoan) : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Loan Schedule Manager
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Manage due dates, overdue accounts, and penalties
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Active Loans</p>
            <h2 className="text-3xl font-black text-blue-600 mt-2">{summary.active}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Overdue Loans</p>
            <h2 className="text-3xl font-black text-red-600 mt-2">{summary.overdue}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Outstanding Balance</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              ${summary.totalBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Penalty Total</p>
            <h2 className="text-3xl font-black text-orange-600 mt-2">
              ${summary.totalPenalty.toLocaleString()}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Loan Accounts</h3>

            <div className="space-y-4">
              {loans.length > 0 ? (
                loans.map((loan) => {
                  const metrics = getLoanMetrics(loan);

                  return (
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
                        Balance: ${Number(loan.loanBalance || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        Due: {formatDate(loan.nextDueDate)}
                      </p>
                      <p
                        className={`text-[10px] uppercase font-black mt-2 ${
                          metrics.isOverdue ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {metrics.isOverdue
                          ? `Overdue by ${metrics.overdueDays} day(s)`
                          : 'On schedule'}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                  No active scheduled loans found.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {!selectedLoan ? (
              <div className="min-h-[420px] flex items-center justify-center text-gray-400 font-semibold">
                Select a loan account to manage its repayment schedule.
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">
                    Schedule Review
                  </p>
                  <h2 className="text-3xl font-black text-gray-800 mt-1">
                    {selectedLoan.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">Next Due Date</p>
                    <h3 className="text-xl font-black text-blue-700 mt-2">
                      {formatDate(selectedLoan.nextDueDate)}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-green-50 border border-green-100">
                    <p className="text-[10px] uppercase font-black text-green-600">Monthly Due</p>
                    <h3 className="text-xl font-black text-green-700 mt-2">
                      ${Number(selectedLoan.monthlyDue || 0).toFixed(2)}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                    <p className="text-[10px] uppercase font-black text-yellow-600">Penalty</p>
                    <h3 className="text-xl font-black text-yellow-700 mt-2">
                      ${Number(selectedLoan.penaltyAmount || 0).toFixed(2)}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-red-50 border border-red-100">
                    <p className="text-[10px] uppercase font-black text-red-600">Overdue Days</p>
                    <h3 className="text-xl font-black text-red-700 mt-2">
                      {selectedMetrics?.overdueDays || 0}
                    </h3>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <label className="text-[10px] uppercase font-black text-gray-400">
                    Penalty Rate (% of monthly due)
                  </label>
                  <input
                    type="number"
                    value={penaltyRate}
                    onChange={(e) => setPenaltyRate(e.target.value)}
                    className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
                    placeholder="Enter penalty rate"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleApplyPenalty(selectedLoan)}
                    disabled={loadingId === selectedLoan.id}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FiAlertTriangle /> Apply Penalty
                  </button>

                  <button
                    onClick={() => handleAdvanceSchedule(selectedLoan)}
                    disabled={loadingId === selectedLoan.id}
                    className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FiCalendar /> Advance Schedule
                  </button>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400">Status</p>
                      <p className="font-bold mt-2">{selectedLoan.status || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400">Loan Balance</p>
                      <p className="font-bold mt-2">
                        ${Number(selectedLoan.loanBalance || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400">Repayments</p>
                      <p className="font-bold mt-2">{Number(selectedLoan.repaymentCount || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-8 rounded-[2.5rem] text-white shadow-xl">
                  <FiClock className="text-blue-300 text-4xl mb-4" />
                  <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">
                    Schedule Control
                  </h3>
                  <p className="text-sm opacity-70 leading-relaxed font-medium">
                    Use this page to monitor overdue accounts, apply penalties when necessary,
                    and move the repayment schedule forward after each due cycle.
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

export default LoanScheduleManager;