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
  FiRepeat,
  FiDollarSign,
  FiSearch,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';

function ForeignExchange() {
  const { userData } = useAuth();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    exchangeType: '',
    sourceAmount: '',
    rate: '',
    referenceNumber: '',
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
      collection(db, 'fx_transactions'),
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

  const sourceAmount = Number(form.sourceAmount || 0);
  const rate = Number(form.rate || 0);

  const targetAmount = useMemo(() => {
    if (!sourceAmount || !rate || !form.exchangeType) return 0;

    if (form.exchangeType === 'usd_to_lrd') {
      return sourceAmount * rate;
    }

    if (form.exchangeType === 'lrd_to_usd') {
      return sourceAmount / rate;
    }

    return 0;
  }, [sourceAmount, rate, form.exchangeType]);

  const profit = useMemo(() => {
    if (!sourceAmount || !rate) return 0;
    return Number((sourceAmount * 0.01).toFixed(2));
  }, [sourceAmount, rate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.exchangeType || !form.sourceAmount || !form.rate) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'fx_transactions'), {
        customerName: form.customerName || '',
        customerPhone: form.customerPhone || '',
        exchangeType: form.exchangeType,
        sourceCurrency: form.exchangeType === 'usd_to_lrd' ? 'USD' : 'LRD',
        targetCurrency: form.exchangeType === 'usd_to_lrd' ? 'LRD' : 'USD',
        sourceAmount,
        exchangeRate: rate,
        targetAmount: Number(targetAmount.toFixed(2)),
        profit,
        referenceNumber: form.referenceNumber || '',
        notes: form.notes || '',
        status: form.status || 'successful',

        tellerName: userData?.name || 'System Teller',
        tellerId: userData?.id || '',
        branchName: userData?.branchName || '',
        branchId: userData?.branchId || '',

        createdAt: serverTimestamp(),
        dateKey: todayKey,
      });

      alert('Foreign exchange transaction recorded successfully.');

      setForm({
        customerName: '',
        customerPhone: '',
        exchangeType: '',
        sourceAmount: '',
        rate: '',
        referenceNumber: '',
        notes: '',
        status: 'successful',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTransactions = transactions.filter((item) => {
    const name = String(item.customerName || '').toLowerCase();
    const phone = String(item.customerPhone || '');
    const type = String(item.exchangeType || '').toLowerCase();
    const ref = String(item.referenceNumber || '');

    return (
      name.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      type.includes(searchTerm.toLowerCase()) ||
      ref.includes(searchTerm)
    );
  });

  const todayTransactions = transactions.filter((item) => item.dateKey === todayKey);

  const todayVolume = todayTransactions.reduce(
    (sum, item) => sum + Number(item.sourceAmount || 0),
    0
  );

  const todayProfit = todayTransactions.reduce(
    (sum, item) => sum + Number(item.profit || 0),
    0
  );

  const usdToLrdCount = todayTransactions.filter(
    (item) => item.exchangeType === 'usd_to_lrd'
  ).length;

  const lrdToUsdCount = todayTransactions.filter(
    (item) => item.exchangeType === 'lrd_to_usd'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Foreign Exchange Office
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            USD-LRD and LRD-USD conversion logging
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Today Volume</p>
            <h2 className="text-3xl font-black text-blue-600 mt-2">
              {todayVolume.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Today Profit</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              ${todayProfit.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">USD → LRD</p>
            <h2 className="text-3xl font-black text-purple-600 mt-2">
              {usdToLrdCount}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">LRD → USD</p>
            <h2 className="text-3xl font-black text-orange-600 mt-2">
              {lrdToUsdCount}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Record Exchange Transaction</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="exchangeType"
                  value={form.exchangeType}
                  onChange={handleChange}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                >
                  <option value="">Select Exchange Type</option>
                  <option value="usd_to_lrd">USD → LRD</option>
                  <option value="lrd_to_usd">LRD → USD</option>
                </select>

                <input
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Customer Name"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

                <input
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="Customer Phone Number"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

                <input
                  name="sourceAmount"
                  type="number"
                  value={form.sourceAmount}
                  onChange={handleChange}
                  placeholder={
                    form.exchangeType === 'lrd_to_usd'
                      ? 'Amount in LRD'
                      : 'Amount in USD'
                  }
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                />

                <input
                  name="rate"
                  type="number"
                  value={form.rate}
                  onChange={handleChange}
                  placeholder="Exchange Rate"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                />

                <input
                  name="referenceNumber"
                  value={form.referenceNumber}
                  onChange={handleChange}
                  placeholder="Reference Number"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] uppercase font-black text-blue-600">Converted Amount</p>
                  <p className="text-2xl font-black text-blue-700 mt-2">
                    {form.exchangeType === 'usd_to_lrd' ? 'LRD ' : 'USD '}
                    {Number(targetAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[10px] uppercase font-black text-green-600">Estimated Profit</p>
                  <p className="text-2xl font-black text-green-700 mt-2">
                    ${Number(profit || 0).toLocaleString()}
                  </p>
                </div>
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
                Record Exchange Transaction
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-5">Supported Exchange Services</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                  <FiDollarSign className="text-blue-600" />
                  <span className="font-bold">USD to LRD</span>
                </div>

                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
                  <FiRepeat className="text-green-600" />
                  <span className="font-bold">LRD to USD</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-8 rounded-[2.5rem] text-white shadow-xl">
              <FiTrendingUp className="text-blue-300 text-4xl mb-4" />
              <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">
                Exchange Desk Workflow
              </h3>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                Enter the source amount, use the current market rate, then let the system calculate
                the converted amount and estimated margin automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-gray-800">Recent FX Transactions</h3>

            <div className="relative w-full md:w-[320px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, ref..."
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
                      {item.exchangeType === 'usd_to_lrd' ? 'USD → LRD' : 'LRD → USD'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.customerName || 'Unnamed Customer'}
                      {item.customerPhone ? ` • ${item.customerPhone}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-2">
                      Rate: {Number(item.exchangeRate || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">
                      Ref: {item.referenceNumber || 'N/A'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600">
                      {item.sourceCurrency} {Number(item.sourceAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-green-600">
                      {item.targetCurrency} {Number(item.targetAmount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-orange-600 mt-1">
                      Profit: ${Number(item.profit || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-gray-400 mt-1">
                      {item.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                No foreign exchange transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForeignExchange;