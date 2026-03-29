import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  FiZap,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiFileText,
  FiDollarSign,
} from 'react-icons/fi';

function PaymentsOffice() {
  const { userData } = useAuth();

  const [form, setForm] = useState({
    paymentType: '',
    customerName: '',
    customerPhone: '',
    meterNumber: '',
    accountNumber: '',
    referenceNumber: '',
    tokenNumber: '',
    amount: '',
    fee: '',
    notes: '',
    status: 'successful',
  });

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const todayKey = useMemo(
    () => new Date().toISOString().split('T')[0],
    []
  );

  useEffect(() => {
    const q = query(
      collection(db, 'payment_transactions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCommission = () => {
    const amount = Number(form.amount || 0);
    const fee = Number(form.fee || 0);
    const type = String(form.paymentType || '').toLowerCase();

    if (type === 'lec') return Number((fee * 0.5).toFixed(2));
    if (type === 'school_fee') return Number((amount * 0.015).toFixed(2));
    if (type === 'merchant_payment') return Number((amount * 0.01).toFixed(2));

    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.paymentType || !form.customerName || !form.amount) {
      alert('Please fill all required fields.');
      return;
    }

    if (form.paymentType === 'lec' && !form.meterNumber) {
      alert('Meter number is required for LEC sales.');
      return;
    }

    try {
      const amount = Number(form.amount || 0);
      const fee = Number(form.fee || 0);
      const commission = getCommission();

      await addDoc(collection(db, 'payment_transactions'), {
        paymentType: form.paymentType,
        customerName: form.customerName,
        customerPhone: form.customerPhone || '',
        meterNumber: form.meterNumber || '',
        accountNumber: form.accountNumber || '',
        referenceNumber: form.referenceNumber || '',
        tokenNumber: form.tokenNumber || '',
        amount,
        fee,
        commission,
        notes: form.notes || '',
        status: form.status || 'successful',

        tellerName: userData?.name || 'System Teller',
        tellerId: userData?.id || '',
        branchName: userData?.branchName || '',
        branchId: userData?.branchId || '',

        createdAt: serverTimestamp(),
        dateKey: todayKey,
      });

      alert('Payment transaction recorded successfully.');

      setForm({
        paymentType: '',
        customerName: '',
        customerPhone: '',
        meterNumber: '',
        accountNumber: '',
        referenceNumber: '',
        tokenNumber: '',
        amount: '',
        fee: '',
        notes: '',
        status: 'successful',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTransactions = transactions.filter((item) => {
    const customerName = String(item.customerName || '').toLowerCase();
    const customerPhone = String(item.customerPhone || '');
    const paymentType = String(item.paymentType || '').toLowerCase();
    const meterNumber = String(item.meterNumber || '');
    const accountNumber = String(item.accountNumber || '');

    return (
      customerName.includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm) ||
      paymentType.includes(searchTerm.toLowerCase()) ||
      meterNumber.includes(searchTerm) ||
      accountNumber.includes(searchTerm)
    );
  });

  const todayTransactions = transactions.filter((item) => item.dateKey === todayKey);

  const todaySales = todayTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const todayFees = todayTransactions.reduce(
    (sum, item) => sum + Number(item.fee || 0),
    0
  );

  const todayCommission = todayTransactions.reduce(
    (sum, item) => sum + Number(item.commission || 0),
    0
  );

  const lecSalesToday = todayTransactions.filter(
    (item) => item.paymentType === 'lec'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Payment Services Office
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            LEC sales and other payment service transaction logging
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Sales Today</p>
            <h2 className="text-3xl font-black text-blue-600 mt-2">
              ${todaySales.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Fees Today</p>
            <h2 className="text-3xl font-black text-orange-600 mt-2">
              ${todayFees.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Commission Today</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              ${todayCommission.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">LEC Sales Today</p>
            <h2 className="text-3xl font-black text-purple-600 mt-2">
              {lecSalesToday}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Record Payment Service</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                >
                  <option value="">Select Payment Type</option>
                  <option value="lec">LEC Token Sale</option>
                  <option value="school_fee">School Fee Payment</option>
                  <option value="merchant_payment">Merchant Payment</option>
                </select>

                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Customer Name"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                />

                <input
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="Customer Phone Number"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Amount Paid"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                />

                {form.paymentType === 'lec' && (
                  <>
                    <input
                      name="meterNumber"
                      value={form.meterNumber}
                      onChange={handleChange}
                      placeholder="Meter Number"
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                      required
                    />

                    <input
                      name="tokenNumber"
                      value={form.tokenNumber}
                      onChange={handleChange}
                      placeholder="LEC Token Number"
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    />
                  </>
                )}

                {form.paymentType !== 'lec' && (
                  <input
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    placeholder="Account / Student / Merchant Number"
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  />
                )}

                <input
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="Provider Reference Number"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

                <input
                  name="fee"
                  type="number"
                  value={form.fee}
                  onChange={handleChange}
                  placeholder="Service Fee"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Notes"
                rows={4}
                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200"
              />

              <button className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-black text-lg">
                Record Payment Transaction
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-5">Supported Payment Services</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100 flex items-center gap-3">
                  <FiZap className="text-yellow-600" />
                  <span className="font-bold">LEC Token Sales</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                  <FiFileText className="text-blue-600" />
                  <span className="font-bold">School Fee Payments</span>
                </div>

                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
                  <FiDollarSign className="text-green-600" />
                  <span className="font-bold">Merchant Payments</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-8 rounded-[2.5rem] text-white shadow-xl">
              <FiClock className="text-blue-300 text-4xl mb-4" />
              <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">
                External Platform Workflow
              </h3>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                Process the payment on the provider platform first, then log the completed
                transaction here with the meter/account details and confirmation reference.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-gray-800">Recent Payment Transactions</h3>

            <div className="relative w-full md:w-[320px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, meter, service..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100"
                >
                  <div>
                    <p className="font-black text-gray-800 uppercase text-sm">
                      {String(item.paymentType || '').replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.customerName || 'Unnamed Customer'}
                      {item.customerPhone ? ` • ${item.customerPhone}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-2">
                      Meter/Account: {item.meterNumber || item.accountNumber || 'N/A'}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">
                      Ref: {item.referenceNumber || 'N/A'}
                    </p>
                    {item.tokenNumber && (
                      <p className="text-[11px] text-green-600 font-bold uppercase mt-1">
                        Token: {item.tokenNumber}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600">
                      ${Number(item.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-orange-600">
                      Fee: ${Number(item.fee || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-green-600 mt-1">
                      Commission: ${Number(item.commission || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-gray-400 mt-1">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                No payment transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentsOffice;