import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  FiUserPlus,
  FiDollarSign,
  FiArrowLeft,
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiRefreshCw,
  FiBarChart2,
  FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function SusuOffice() {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, 'susu_customers'), (snap) => {
      setCustomers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCollections = onSnapshot(collection(db, 'susu_collections'), (snap) => {
      setCollectionsData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const recentQuery = query(
      collection(db, 'susu_collections'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubRecent = onSnapshot(recentQuery, (snap) => {
      setRecentCollections(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCustomers();
      unsubCollections();
      unsubRecent();
    };
  }, []);

  const registeredToday = customers.filter(
    (customer) => customer.dateJoined === todayKey
  ).length;

  const todayCollections = collectionsData.filter(
    (item) => item.collectionDate === todayKey
  );

  const collectionsTodayAmount = todayCollections.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const activePortfolio = customers.filter(
    (customer) => String(customer.status || '').toLowerCase() === 'active'
  ).length;

  const avgDeposit =
    todayCollections.length > 0
      ? collectionsTodayAmount / todayCollections.length
      : 0;

  const sessionStats = [
    {
      label: 'Registered Today',
      val: registeredToday,
      icon: <FiUserPlus />,
      color: '#3b82f6',
    },
    {
      label: 'Collections Today',
      val: `$${collectionsTodayAmount.toLocaleString()}`,
      icon: <FiDollarSign />,
      color: '#10b981',
    },
    {
      label: 'Active Portfolio',
      val: activePortfolio,
      icon: <FiUsers />,
      color: '#8b5cf6',
    },
    {
      label: 'Avg Deposit',
      val: `$${avgDeposit.toFixed(2)}`,
      icon: <FiActivity />,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans">
      <nav className="bg-[#1e3a8a] text-white px-8 py-6 flex justify-between items-center shadow-2xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <FiArrowLeft size={20} />
          </button>

          <div>
            <h2 className="text-2xl font-black uppercase">Susu Operations Office</h2>
            <p className="text-blue-200 text-xs font-bold uppercase">
              Authorized Banking Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/20 p-3 rounded-2xl border border-white/10">
          <div className="text-right">
            <p className="text-[10px] uppercase opacity-60 font-black">
              Officer In-Charge
            </p>
            <p className="text-sm font-bold text-blue-300">
              {userData?.name || 'Saah Francis'}
            </p>
          </div>

          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">
            {userData?.name?.charAt(0) || 'S'}
          </div>
        </div>
      </nav>

      <div className="p-10 max-w-7xl mx-auto">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sessionStats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-3xl shadow-sm border flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-gray-800">{stat.val}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="mb-8">
          <h3 className="text-xl font-black text-gray-800 mb-2">Office Tasks</h3>
          <p className="text-gray-400 text-sm">
            Select a function to begin serving a customer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            onClick={() => navigate('/susu-registration')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-blue-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiUserPlus />
            </div>
            <h3 className="text-2xl font-black">New Customer KYC</h3>
            <p className="text-gray-400 text-sm mt-3">
              Register new susu customers with full details.
            </p>
          </div>

          <div
            onClick={() => navigate('/susu-collection')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-green-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiDollarSign />
            </div>
            <h3 className="text-2xl font-black">Susu Collection</h3>
            <p className="text-gray-400 text-sm mt-3">
              Process daily or weekly savings deposits.
            </p>
          </div>

          <div
            onClick={() => navigate('/susu-payout')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-orange-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiRefreshCw />
            </div>
            <h3 className="text-2xl font-black">Susu Payout</h3>
            <p className="text-gray-400 text-sm mt-3">
              Process end-of-cycle customer payout and reset cycle.
            </p>
          </div>

          <div
            onClick={() => navigate('/susu-reports')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-cyan-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiBarChart2 />
            </div>
            <h3 className="text-2xl font-black">Susu Reports</h3>
            <p className="text-gray-400 text-sm mt-3">
              View collections, savings totals, payout readiness, and teller performance.
            </p>
          </div>

          <div
            onClick={() => navigate('/activity-log')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-red-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiShield />
            </div>
            <h3 className="text-2xl font-black">Activity Log</h3>
            <p className="text-gray-400 text-sm mt-3">
              Monitor sensitive actions, teller activity, and payout audit history.
            </p>
          </div>

          <div
            onClick={() => navigate('/microfinance')}
            className="group bg-white p-12 rounded-[3rem] shadow-sm border hover:border-purple-500 hover:shadow-2xl cursor-pointer transition-all"
          >
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-4xl mb-6">
              <FiTrendingUp />
            </div>
            <h3 className="text-2xl font-black">Microfinance Loans</h3>
            <p className="text-gray-400 text-sm mt-3">
              Manage loan applications, approvals, and repayments.
            </p>
          </div>
        </div>

        {/* RECENT COLLECTIONS */}
        <div className="mt-12 bg-white p-8 rounded-[2.5rem] shadow-sm border">
          <h3 className="font-bold text-gray-800 mb-6">Recent Collections</h3>

          <div className="space-y-3">
            {recentCollections.length > 0 ? (
              recentCollections.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"
                >
                  <div>
                    <p className="font-bold text-sm text-gray-800">
                      {item.customerName || 'Unknown Customer'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Teller: {item.tellerName || 'System'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Receipt: {item.receiptNo || 'N/A'}
                    </p>
                  </div>

                  <span className="text-green-600 font-bold">
                    +${Number(item.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                No recent collections yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusuOffice;