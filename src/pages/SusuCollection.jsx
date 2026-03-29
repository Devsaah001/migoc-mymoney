import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  FiSearch,
  FiUser,
  FiArrowUpRight,
  FiClock,
  FiCheckCircle,
  FiPercent,
} from 'react-icons/fi';

function SusuCollection() {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, 'susu_customers'), (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const q = query(
      collection(db, 'susu_collections'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubLogs = onSnapshot(q, (snap) => {
      setRecentLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCustomers();
      unsubLogs();
    };
  }, []);

  const generateReceiptNo = () => {
    const now = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SUSU-${now}-${random}`;
  };

  const getDateKey = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleDeposit = async (e) => {
  e.preventDefault();

  if (!selectedCustomer || !amount) {
    alert('Select a customer and enter amount');
    return;
  }

  const depositAmount = Number(amount);

  if (!depositAmount || depositAmount <= 0) {
    alert('Enter a valid deposit amount');
    return;
  }

  setLoading(true);

  try {
    const receiptNo = generateReceiptNo();
    const dateKey = getDateKey();

    const currentBalance = Number(selectedCustomer.balance || 0);
    const currentContributions = Number(selectedCustomer.totalContributions || 0);
    const cycleDays = Number(selectedCustomer.cycleDays || 30);
    const newContributionCount = currentContributions + 1;
    const newBalance = currentBalance + depositAmount;
    const missedContributions = Math.max(cycleDays - newContributionCount, 0);
    const payoutReady = newContributionCount >= cycleDays;

    const tellerEmail = String(userData?.email || '').trim().toLowerCase();
    const tellerName = userData?.name || 'System';
    const tellerRole = userData?.role || 'financial-agent';

    // 1. Save collection record
    await addDoc(collection(db, 'susu_collections'), {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName || '',
      phone: selectedCustomer.phone || '',
      amount: depositAmount,
      contributionType: selectedCustomer.contributionType || 'daily',

      tellerId: userData?.uid || '',
      tellerEmail,
      tellerName,
      tellerRole,

      agentId: selectedCustomer.assignedAgentId || '',
      agentName: selectedCustomer.assignedAgentName || '',

      branchId: selectedCustomer.branchId || '',
      branchName: selectedCustomer.branchName || '',

      office: 'financial',
      service: 'susu_collection',
      receiptNo,
      status: 'completed',
      collectionDate: dateKey,
      createdAt: serverTimestamp(),
    });

    // 2. Save central transaction record
    await addDoc(collection(db, 'transactions'), {
      type: 'susu_deposit',
      service: 'susu_collection',
      office: 'financial',
      status: 'completed',

      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName || '',
      customerPhone: selectedCustomer.phone || '',

      amount: depositAmount,
      contributionType: selectedCustomer.contributionType || 'daily',

      tellerId: userData?.uid || '',
      tellerEmail,
      tellerName,
      tellerRole,

      branchId: selectedCustomer.branchId || '',
      branchName: selectedCustomer.branchName || '',

      receiptNo,
      dateKey,
      createdAt: serverTimestamp(),
    });

    // 3. Update customer summary
    const customerRef = doc(db, 'susu_customers', selectedCustomer.id);
    await updateDoc(customerRef, {
      balance: newBalance,
      totalCollectedThisCycle: newBalance,
      totalContributions: newContributionCount,
      missedContributions,
      lastContributionAmount: depositAmount,
      lastContributionDate: dateKey,
      payoutReady,
      updatedAt: serverTimestamp(),
    });

    // 4. Save activity log
    await addDoc(collection(db, 'activity_logs'), {
      userId: userData?.uid || '',
      userEmail: tellerEmail,
      userName: tellerName,
      role: tellerRole,
      action: 'COLLECTED_SUSU',

      office: 'financial',
      service: 'susu_collection',

      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName || '',
      customerPhone: selectedCustomer.phone || '',
      amount: depositAmount,

      branchId: selectedCustomer.branchId || '',
      branchName: selectedCustomer.branchName || '',

      receiptNo,
      dateKey,
      createdAt: serverTimestamp(),
    });

    alert(`TRUSTCASH SUCCESS: $${depositAmount} received from ${selectedCustomer.fullName}`);

    setAmount('');
    setSelectedCustomer(null);
    setSearchTerm('');
  } catch (err) {
    console.error(err);
    alert(err.message || 'Failed to record deposit');
  }

  setLoading(false);
};
  const searchResults = customers
    .filter(
      (c) =>
        c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5);

  const progressWidth = selectedCustomer
    ? `${Math.min(
        ((Number(selectedCustomer.totalContributions || 0) /
          Number(selectedCustomer.cycleDays || 30)) *
          100),
        100
      )}%`
    : '0%';

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Susu Daily Collection
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Office: {userData?.name || 'Unauthorized'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-400 uppercase text-[10px] tracking-[0.2em] mb-6">
                Find Portfolio
              </h3>

              <div className="relative mb-6">
                <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  placeholder="Enter Customer Name, Phone Number, or ID Number..."
                  className="w-full p-5 pl-14 bg-gray-50 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-lg"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  value={searchTerm}
                />
              </div>

              {searchTerm && !selectedCustomer && (
                <div className="space-y-3 mb-8">
                  {searchResults.length > 0 ? (
                    searchResults.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className="p-5 rounded-2xl border-2 border-gray-50 bg-white hover:border-blue-500 cursor-pointer flex justify-between items-center transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white">
                            <FiUser />
                          </div>

                          <div>
                            <p className="font-black text-gray-800">{c.fullName}</p>
                            <p className="text-xs text-gray-400">{c.phone}</p>
                            <p className="text-[10px] text-gray-400 uppercase">
                              Agent: {c.assignedAgentName || 'Not Assigned'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg">
                          Select Client
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-500 font-semibold">
                      No customer found.
                    </div>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                    <FiPercent size={150} />
                  </div>

                  <div className="flex justify-between items-start mb-8 relative z-10 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        Active Client
                      </p>
                      <h2 className="text-3xl font-black text-gray-800 mt-1">
                        {selectedCustomer.fullName}
                      </h2>

                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-gray-500 font-semibold">
                          Phone: {selectedCustomer.phone || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold">
                          Contribution Type: {selectedCustomer.contributionType || 'daily'}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold">
                          Expected Amount: ${selectedCustomer.expectedAmount || 0}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: progressWidth }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">
                          Cycle Day: {selectedCustomer.totalContributions || 0}/
                          {selectedCustomer.cycleDays || 30}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total Savings
                      </p>
                      <h2 className="text-4xl font-black text-green-600">
                        ${selectedCustomer.balance || 0}
                      </h2>
                    </div>
                  </div>

                  <form onSubmit={handleDeposit} className="space-y-5 relative z-10">
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-gray-300">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-8 pl-14 bg-white rounded-3xl border-2 border-blue-200 text-5xl font-black text-blue-600 outline-none shadow-inner"
                        autoFocus
                        required
                      />
                    </div>

                    {Number(amount) > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 flex justify-between items-center text-yellow-800">
                        <span className="text-xs font-bold uppercase">
                          Estimated Collection Amount:
                        </span>
                        <span className="font-black text-lg">${Number(amount)}</span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setAmount('');
                        }}
                        className="flex-1 bg-white text-gray-400 py-5 rounded-2xl font-bold border border-gray-200"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] bg-[#165bbd] text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          'Authorizing...'
                        ) : (
                          <>
                            <FiCheckCircle /> Record Deposit
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                <FiClock /> Collection Log
              </h3>

              <div className="space-y-4">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
                    >
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-gray-800 uppercase truncate">
                          {log.customerName}
                        </p>
                        <p className="text-[8px] text-gray-400 uppercase font-bold">
                          Teller: {log.tellerName}
                        </p>
                        <p className="text-[8px] text-gray-400 uppercase font-bold">
                          Receipt: {log.receiptNo}
                        </p>
                      </div>

                      <p className="font-black text-green-600 text-lg">+$ {log.amount}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-500 font-semibold">
                    No collection records yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-10 rounded-[3rem] text-white shadow-2xl">
              <FiArrowUpRight className="text-blue-400 text-4xl mb-6" />
              <h3 className="font-black text-xl mb-4 uppercase tracking-tighter">
                Security Protocol
              </h3>
              <p className="text-sm opacity-60 leading-relaxed font-medium">
                Every deposit requires physical cash verification before clicking record.
                All teller actions are monitored by MIGoC Main-frame.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusuCollection;