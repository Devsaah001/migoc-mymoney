import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

import { FiDollarSign, FiRefreshCw } from 'react-icons/fi';

function MomoOffice() {
  const { userData } = useAuth();

  const [form, setForm] = useState({});
  const [transactions, setTransactions] = useState([]);

  const todayKey = useMemo(
    () => new Date().toISOString().split('T')[0],
    []
  );

  // FETCH RECENT
  useEffect(() => {
    const q = query(
      collection(db, 'momo_transactions'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.amount || !form.customerPhone) {
      return alert("Fill required fields");
    }

    const fee = Number(form.amount) * 0.02; // 2% example
    const commission = fee * 0.5;

    await addDoc(collection(db, 'momo_transactions'), {
      ...form,
      amount: Number(form.amount),
      fee,
      commission,

      tellerName: userData?.name || "Teller",
      tellerId: userData?.id || "",

      status: "successful",

      createdAt: serverTimestamp(),
      dateKey: todayKey
    });

    alert("Transaction Recorded");
    setForm({});
  };

  // TODAY TOTAL
  const todayTotal = transactions
    .filter(t => t.dateKey === todayKey)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-6">
        Mobile Money Operations
      </h1>

      {/* STATS */}
      <div className="mb-6 bg-blue-100 p-4 rounded-xl">
        <p className="font-bold">
          Today's Total: ${todayTotal.toLocaleString()}
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-10">

        <select name="network" onChange={handleChange} className="border p-2" required>
          <option value="">Select Network</option>
          <option value="MTN">MTN</option>
          <option value="Orange">Orange</option>
        </select>

        <select name="serviceType" onChange={handleChange} className="border p-2" required>
          <option value="">Service Type</option>
          <option value="cash_in">Cash-In</option>
          <option value="cash_out">Cash-Out</option>
        </select>

        <input name="customerName" placeholder="Customer Name" onChange={handleChange} className="border p-2" />

        <input name="customerPhone" placeholder="Phone Number" onChange={handleChange} className="border p-2" required />

        <input name="amount" type="number" placeholder="Amount" onChange={handleChange} className="border p-2" required />

        <input name="externalReference" placeholder="MoMo Reference Code" onChange={handleChange} className="border p-2" />

        <button className="col-span-2 bg-green-600 text-white py-3 rounded">
          Record Transaction
        </button>
      </form>

      {/* RECENT */}
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

      {transactions.map((t) => (
        <div key={t.id} className="border p-4 mb-3 rounded">

          <p><strong>{t.network} {t.serviceType}</strong></p>
          <p>{t.customerName} ({t.customerPhone})</p>
          <p>${t.amount}</p>
          <p className="text-sm text-gray-500">
            Ref: {t.externalReference || "N/A"}
          </p>

        </div>
      ))}

    </div>
  );
}

export default MomoOffice;