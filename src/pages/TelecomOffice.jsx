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
  FiWifi,
  FiSmartphone,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiPhone,
} from 'react-icons/fi';

function TelecomOffice() {
  const { userData } = useAuth();

  const [form, setForm] = useState({
    network: '',
    serviceCategory: '',
    packageType: '',
    customerName: '',
    customerPhone: '',
    amount: '',
    externalReference: '',
    notes: '',
    simSerialNumber: '',
    idNumber: '',
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
      collection(db, 'telecom_transactions'),
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
    const category = String(form.serviceCategory || '').toLowerCase();

    if (category === 'sim_registration') return 1;
    if (category === 'airtime') return amount * 0.03;
    if (category === 'data') return amount * 0.04;
    if (category === 'minutes') return amount * 0.035;

    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.network || !form.serviceCategory || !form.customerPhone || !form.amount) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const amount = Number(form.amount || 0);
      const commission = Number(getCommission().toFixed(2));

      await addDoc(collection(db, 'telecom_transactions'), {
        network: form.network,
        serviceCategory: form.serviceCategory,
        packageType: form.packageType || '',
        customerName: form.customerName || '',
        customerPhone: form.customerPhone,
        amount,
        commission,
        externalReference: form.externalReference || '',
        notes: form.notes || '',
        simSerialNumber: form.simSerialNumber || '',
        idNumber: form.idNumber || '',
        status: form.status || 'successful',

        tellerName: userData?.name || 'System Teller',
        tellerId: userData?.id || '',
        branchName: userData?.branchName || '',
        branchId: userData?.branchId || '',

        createdAt: serverTimestamp(),
        dateKey: todayKey,
      });

      alert('Telecom transaction recorded successfully.');

      setForm({
        network: '',
        serviceCategory: '',
        packageType: '',
        customerName: '',
        customerPhone: '',
        amount: '',
        externalReference: '',
        notes: '',
        simSerialNumber: '',
        idNumber: '',
        status: 'successful',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTransactions = transactions.filter((item) => {
    const customerName = String(item.customerName || '').toLowerCase();
    const customerPhone = String(item.customerPhone || '');
    const serviceCategory = String(item.serviceCategory || '').toLowerCase();

    return (
      customerName.includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm) ||
      serviceCategory.includes(searchTerm.toLowerCase())
    );
  });

  const todayTransactions = transactions.filter((item) => item.dateKey === todayKey);

  const todaySales = todayTransactions.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const todayCommission = todayTransactions.reduce(
    (sum, item) => sum + Number(item.commission || 0),
    0
  );

  const simRegistrationsToday = todayTransactions.filter(
    (item) => item.serviceCategory === 'sim_registration'
  ).length;

  const airtimeDataToday = todayTransactions.filter((item) =>
    ['airtime', 'data', 'minutes'].includes(item.serviceCategory)
  ).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Telecom Services Office
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            SIM registration, airtime, data, and minutes logging
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
            <p className="text-[10px] uppercase text-gray-400 font-black">Commission Today</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              ${todayCommission.toLocaleString()}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">SIM Registrations</p>
            <h2 className="text-3xl font-black text-purple-600 mt-2">
              {simRegistrationsToday}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Airtime/Data Sales</p>
            <h2 className="text-3xl font-black text-orange-600 mt-2">
              {airtimeDataToday}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Record Telecom Service</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="network"
                  value={form.network}
                  onChange={handleChange}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                >
                  <option value="">Select Network</option>
                  <option value="MTN">MTN</option>
                  <option value="Orange">Orange</option>
                </select>

                <select
                  name="serviceCategory"
                  value={form.serviceCategory}
                  onChange={handleChange}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                >
                  <option value="">Select Service</option>
                  <option value="sim_registration">SIM Registration</option>
                  <option value="airtime">Airtime</option>
                  <option value="data">Data</option>
                  <option value="minutes">Minutes</option>
                </select>

                <input
                  name="packageType"
                  value={form.packageType}
                  onChange={handleChange}
                  placeholder="Package Type / Bundle"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                />

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
                  required
                />

                <input
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Amount"
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                  required
                />

                {form.serviceCategory === 'sim_registration' && (
                  <>
                    <input
                      name="simSerialNumber"
                      value={form.simSerialNumber}
                      onChange={handleChange}
                      placeholder="SIM Serial Number"
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    />

                    <input
                      name="idNumber"
                      value={form.idNumber}
                      onChange={handleChange}
                      placeholder="Customer ID Number"
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-200"
                    />
                  </>
                )}

                <input
                  name="externalReference"
                  value={form.externalReference}
                  onChange={handleChange}
                  placeholder="Provider Reference Code"
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
                Record Telecom Transaction
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-5">Supported Services</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                  <FiSmartphone className="text-blue-600" />
                  <span className="font-bold">MTN SIM Registration</span>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3">
                  <FiSmartphone className="text-orange-600" />
                  <span className="font-bold">Orange SIM Registration</span>
                </div>

                <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
                  <FiPhone className="text-green-600" />
                  <span className="font-bold">Airtime / Minutes</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex items-center gap-3">
                  <FiWifi className="text-purple-600" />
                  <span className="font-bold">Internet Data</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#165bbd] to-[#0a1f4a] p-8 rounded-[2.5rem] text-white shadow-xl">
              <FiClock className="text-blue-300 text-4xl mb-4" />
              <h3 className="font-black text-xl mb-3 uppercase tracking-tighter">
                External Platform Workflow
              </h3>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                Process the telecom request on the provider platform first, then record the
                completed transaction here with the confirmation reference.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-black text-gray-800">Recent Telecom Transactions</h3>

            <div className="relative w-full md:w-[320px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, service..."
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
                      {item.network} {String(item.serviceCategory || '').replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {item.customerName || 'Unnamed Customer'} • {item.customerPhone}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase mt-2">
                      Ref: {item.externalReference || 'N/A'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600">
                      ${Number(item.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] font-black uppercase text-green-600">
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
                No telecom transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelecomOffice;