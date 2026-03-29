import { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  FiTrendingUp,
  FiArrowLeft,
  FiBarChart2,
  FiActivity,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function AdminRecords() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('day');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'susu_collections'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      let txDate = null;

      if (t.createdAt?.toDate) {
        txDate = t.createdAt.toDate();
      } else if (t.collectionDate) {
        txDate = new Date(t.collectionDate);
      }

      if (!txDate || Number.isNaN(txDate.getTime())) return true;

      if (filter === 'day') {
        return txDate.toDateString() === now.toDateString();
      }

      if (filter === 'month') {
        return (
          txDate.getFullYear() === now.getFullYear() &&
          txDate.getMonth() === now.getMonth()
        );
      }

      if (filter === 'year') {
        return txDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [transactions, filter]);

  const totalVolume = filteredTransactions.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );

  const totalMIGoCProfit = filteredTransactions.reduce((acc, curr) => {
    if (curr.commission !== undefined) {
      return acc + (Number(curr.commission) || 0);
    }

    return acc;
  }, 0);

  const totalTransactions = filteredTransactions.length;

  const avgTransaction =
    totalTransactions > 0 ? totalVolume / totalTransactions : 0;

  const formatTimestamp = (item) => {
    if (item.createdAt?.toDate) {
      return item.createdAt.toDate().toLocaleString();
    }

    if (item.collectionDate) {
      return new Date(item.collectionDate).toLocaleDateString();
    }

    return 'No timestamp';
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-10 font-sans">
      <nav className="mb-10 flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 font-bold flex items-center gap-2 mb-2"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-[#0a1f4a]">
            FINANCIAL INTELLIGENCE
          </h1>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            System Status
          </p>
          <p className="text-green-500 font-black flex items-center gap-2">
            ● LIVE AUDIT ACTIVE
          </p>
        </div>
      </nav>

      {/* FILTER TABS */}
      <div className="flex gap-4 mb-10 bg-white p-2 rounded-2xl w-fit shadow-sm">
        {['day', 'month', 'year'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-8 py-3 rounded-xl font-bold capitalize transition-all ${
              filter === t
                ? 'bg-[#0a1f4a] text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {t}ly View
          </button>
        ))}
      </div>

      {/* REVENUE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl text-blue-600">
            <FiBarChart2 />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Total Transaction Volume
          </p>
          <h2 className="text-5xl font-black text-gray-800 mt-2">
            ${totalVolume.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border-2 border-green-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl text-green-600">
            <FiTrendingUp />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            MIGoC Net Profit
          </p>
          <h2 className="text-5xl font-black text-green-600 mt-2">
            ${totalMIGoCProfit.toLocaleString()}
          </h2>
        </div>

        <div className="bg-[#0a1f4a] p-10 rounded-[3rem] shadow-2xl text-white">
          <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">
            Average Transaction
          </p>
          <h2 className="text-5xl font-black mt-2">
            ${avgTransaction.toFixed(2)}
          </h2>
          <p className="text-blue-300 text-xs mt-4">
            Based on the selected period.
          </p>
        </div>
      </div>

      {/* MASTER LEDGER TABLE */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3">
          <FiActivity className="text-blue-600" /> Transaction Audit Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-widest">
                <th className="pb-6">Timestamp</th>
                <th className="pb-6">Service Type</th>
                <th className="pb-6">Teller</th>
                <th className="pb-6">Customer</th>
                <th className="pb-6">Amount</th>
                <th className="pb-6">Profit</th>
              </tr>
            </thead>

            <tbody className="text-sm font-bold text-gray-700">
              {filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-6 font-medium text-gray-400">
                    {formatTimestamp(t)}
                  </td>

                  <td className="py-6">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg uppercase text-[10px]">
                      {t.service || 'susu_collection'}
                    </span>
                  </td>

                  <td className="py-6">{t.tellerName || 'System'}</td>

                  <td className="py-6">{t.customerName || 'Unknown'}</td>

                  <td className="py-6 text-lg font-black">
                    ${Number(t.amount || 0).toLocaleString()}
                  </td>

                  <td className="py-6 text-green-600 font-black">
                    +$ {Number(t.commission || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 text-gray-300 font-bold uppercase tracking-widest">
            Waiting for transactions...
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRecords;