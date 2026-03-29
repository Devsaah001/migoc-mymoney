import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  FiUsers,
  FiDollarSign,
  FiRefreshCw,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
} from 'react-icons/fi';

function SusuReports() {
  const [customers, setCustomers] = useState([]);
  const [collectionsData, setCollectionsData] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    const unsubCustomers = onSnapshot(collection(db, 'susu_customers'), (snap) => {
      setCustomers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCollections = onSnapshot(collection(db, 'susu_collections'), (snap) => {
      setCollectionsData(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPayouts = onSnapshot(collection(db, 'susu_payouts'), (snap) => {
      setPayouts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const recentQuery = query(
      collection(db, 'susu_collections'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubRecent = onSnapshot(recentQuery, (snap) => {
      setRecentCollections(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCustomers();
      unsubCollections();
      unsubPayouts();
      unsubRecent();
    };
  }, []);

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => String(customer.status || '').toLowerCase() === 'active'
  ).length;

  const readyForPayout = customers.filter((customer) => customer.payoutReady === true).length;

  const collectionsToday = collectionsData.filter(
    (item) => item.collectionDate === todayKey
  );

  const collectionsThisWeek = collectionsData.filter(
    (item) => item.collectionDate && item.collectionDate >= weekAgo
  );

  const totalCollectionsToday = collectionsToday.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalCollectionsWeek = collectionsThisWeek.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalSavingsBalance = customers.reduce(
    (sum, customer) => sum + Number(customer.balance || 0),
    0
  );

  const totalPayoutsValue = payouts.reduce(
    (sum, payout) => sum + Number(payout.payoutAmount || 0),
    0
  );

  const topCollectorsMap = collectionsData.reduce((acc, item) => {
    const tellerName = item.tellerName || 'Unknown';
    if (!acc[tellerName]) {
      acc[tellerName] = {
        tellerName,
        totalAmount: 0,
        transactions: 0,
      };
    }

    acc[tellerName].totalAmount += Number(item.amount || 0);
    acc[tellerName].transactions += 1;
    return acc;
  }, {});

  const topCollectors = Object.values(topCollectorsMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Customers',
      value: totalCustomers,
      icon: <FiUsers />,
      color: '#3b82f6',
    },
    {
      label: 'Collections Today',
      value: `$${totalCollectionsToday.toLocaleString()}`,
      icon: <FiDollarSign />,
      color: '#10b981',
    },
    {
      label: 'Total Savings',
      value: `$${totalSavingsBalance.toLocaleString()}`,
      icon: <FiTrendingUp />,
      color: '#8b5cf6',
    },
    {
      label: 'Ready for Payout',
      value: readyForPayout,
      icon: <FiRefreshCw />,
      color: '#f59e0b',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Susu Reports Dashboard
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Performance, collections, payout readiness, and teller reporting
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>

              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {stat.label}
                </p>
                <p className="text-2xl font-black text-gray-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mid Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
              <FiClock /> Weekly Summary
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-500">Collections This Week</span>
                <span className="text-lg font-black text-green-600">
                  ${totalCollectionsWeek.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-500">Active Customers</span>
                <span className="text-lg font-black text-blue-600">
                  {activeCustomers}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm font-bold text-gray-500">Total Payout Value</span>
                <span className="text-lg font-black text-orange-600">
                  ${totalPayoutsValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
              <FiCheckCircle /> Top Collectors
            </h3>

            <div className="space-y-4">
              {topCollectors.length > 0 ? (
                topCollectors.map((collector, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"
                  >
                    <div>
                      <p className="font-black text-gray-800">{collector.tellerName}</p>
                      <p className="text-xs text-gray-400 uppercase font-bold">
                        {collector.transactions} transaction(s)
                      </p>
                    </div>

                    <span className="text-lg font-black text-green-600">
                      ${collector.totalAmount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                  No collection data available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Collections */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6">Recent Collections</h3>

            <div className="space-y-4">
              {recentCollections.length > 0 ? (
                recentCollections.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"
                  >
                    <div>
                      <p className="font-black text-gray-800">{item.customerName || 'Unknown'}</p>
                      <p className="text-xs text-gray-400 uppercase font-bold">
                        Teller: {item.tellerName || 'System'}
                      </p>
                      <p className="text-xs text-gray-400 uppercase font-bold">
                        {item.collectionDate || 'No date'}
                      </p>
                    </div>

                    <span className="text-green-600 font-black text-lg">
                      +${Number(item.amount || 0).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                  No recent collections found.
                </div>
              )}
            </div>
          </div>

          {/* Customers Ready for Payout */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-gray-800 mb-6">Customers Ready for Payout</h3>

            <div className="space-y-4">
              {customers.filter((customer) => customer.payoutReady === true).length > 0 ? (
                customers
                  .filter((customer) => customer.payoutReady === true)
                  .slice(0, 10)
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"
                    >
                      <div>
                        <p className="font-black text-gray-800">{customer.fullName}</p>
                        <p className="text-xs text-gray-400 uppercase font-bold">
                          Cycle: {customer.cycleDays || 30} days
                        </p>
                      </div>

                      <span className="text-orange-600 font-black text-lg">
                        ${Number(customer.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-semibold">
                  No customer is payout-ready yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SusuReports;