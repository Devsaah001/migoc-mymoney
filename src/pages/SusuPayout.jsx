import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  FiCheckCircle,
  FiDollarSign,
  FiRefreshCw,
  FiUser,
  FiClock,
  FiSend,
} from 'react-icons/fi';

function SusuPayout() {
  const { userData } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serviceCharge, setServiceCharge] = useState('');
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const payoutReadyQuery = query(
      collection(db, 'susu_customers'),
      where('payoutReady', '==', true)
    );

    const unsubCustomers = onSnapshot(payoutReadyQuery, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const recentRequestsQuery = query(
      collection(db, 'payout_requests'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubRequests = onSnapshot(recentRequestsQuery, (snap) => {
      setRecentRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCustomers();
      unsubRequests();
    };
  }, []);

  const payoutSummary = useMemo(() => {
    if (!selectedCustomer) {
      return { totalSaved: 0, charge: 0, payoutAmount: 0 };
    }

    const totalSaved = Number(selectedCustomer.balance || 0);
    const defaultCharge = Number(selectedCustomer.expectedAmount || 0);
    const enteredCharge = serviceCharge === '' ? defaultCharge : Number(serviceCharge || 0);
    const charge = enteredCharge < 0 ? 0 : enteredCharge;
    const payoutAmount = Math.max(totalSaved - charge, 0);

    return { totalSaved, charge, payoutAmount };
  }, [selectedCustomer, serviceCharge]);

  const handleSubmitPayoutRequest = async () => {
    if (!selectedCustomer) {
      alert('Select a customer first');
      return;
    }

    if (payoutSummary.totalSaved <= 0) {
      alert('This customer has no available balance for payout.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'payout_requests'), {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.fullName || '',
        phone: selectedCustomer.phone || '',
        branchId: selectedCustomer.branchId || '',
        branchName: selectedCustomer.branchName || '',

        totalSaved: payoutSummary.totalSaved,
        serviceCharge: payoutSummary.charge,
        payoutAmount: payoutSummary.payoutAmount,
        expectedAmount: Number(selectedCustomer.expectedAmount || 0),
        totalContributions: Number(selectedCustomer.totalContributions || 0),
        cycleDays: Number(selectedCustomer.cycleDays || 30),

        status: 'pending',

        requestedBy: userData?.name || 'System',
        requestedById: userData?.uid || '',
        requestedAt: serverTimestamp(),

        approvedBy: '',
        approvedById: '',
        approvedAt: null,

        completedBy: '',
        completedById: '',
        completedAt: null,

        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        userId: userData?.uid || '',
        userName: userData?.name || 'System',
        role: userData?.role || 'teller',
        action: 'SUBMITTED_PAYOUT_REQUEST',
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.fullName || '',
        amount: payoutSummary.payoutAmount,
        serviceCharge: payoutSummary.charge,
        branchId: selectedCustomer.branchId || '',
        branchName: selectedCustomer.branchName || '',
        createdAt: serverTimestamp(),
      });

      alert(`Payout request submitted for ${selectedCustomer.fullName}`);
      setSelectedCustomer(null);
      setServiceCharge('');
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Susu Payout Request
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Officer: {userData?.name || 'Unauthorized'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-6">Customers Ready for Payout</h3>

              <div className="space-y-4">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setServiceCharge('');
                      }}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        selectedCustomer?.id === customer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 bg-gray-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                          <FiUser />
                        </div>
                        <div>
                          <p className="font-black text-gray-800">{customer.fullName}</p>
                          <p className="text-xs text-gray-400">
                            Balance: ${Number(customer.balance || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                    No customers are ready for payout yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
                <FiClock /> Recent Payout Requests
              </h3>

              <div className="space-y-4">
                {recentRequests.length > 0 ? (
                  recentRequests.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100"
                    >
                      <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-gray-800 uppercase truncate">
                          {item.customerName}
                        </p>
                        <p className="text-[8px] text-gray-400 uppercase font-bold">
                          Status: {item.status}
                        </p>
                      </div>

                      <p className="font-black text-blue-600 text-lg">
                        ${Number(item.payoutAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                    No payout requests yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            {!selectedCustomer ? (
              <div className="h-full min-h-[420px] flex items-center justify-center text-center text-gray-400 font-semibold">
                Select a customer to submit payout request.
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Selected Customer
                  </p>
                  <h2 className="text-3xl font-black text-gray-800 mt-1">
                    {selectedCustomer.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-green-50 border border-green-100">
                    <p className="text-[10px] font-black text-green-600 uppercase">
                      Total Saved
                    </p>
                    <h3 className="text-3xl font-black text-green-700 mt-2">
                      ${payoutSummary.totalSaved.toLocaleString()}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                    <p className="text-[10px] font-black text-yellow-600 uppercase">
                      Service Charge
                    </p>
                    <h3 className="text-3xl font-black text-yellow-700 mt-2">
                      ${payoutSummary.charge.toLocaleString()}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase">
                      Final Payout
                    </p>
                    <h3 className="text-3xl font-black text-blue-700 mt-2">
                      ${payoutSummary.payoutAmount.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
                    Service Charge Override
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">
                      $
                    </span>
                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(e.target.value)}
                      placeholder={`${selectedCustomer.expectedAmount || 0}`}
                      className="w-full p-5 pl-12 bg-white rounded-3xl border border-gray-200 text-2xl font-black text-[#0a1f4a] outline-none focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setServiceCharge('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw /> Reset
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitPayoutRequest}
                    disabled={loading}
                    className="flex-[2] bg-[#165bbd] text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? 'Submitting...' : <><FiSend /> Submit Request</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusuPayout;