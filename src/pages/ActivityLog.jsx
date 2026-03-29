import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import {
  FiActivity,
  FiClock,
  FiUser,
  FiShield,
  FiDollarSign,
  FiRefreshCw,
} from 'react-icons/fi';

function ActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const getActionStyle = (action) => {
    switch (action) {
      case 'COLLECTED_SUSU':
        return {
          icon: <FiDollarSign />,
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-100',
          label: 'Susu Collection',
        };
      case 'PROCESSED_SUSU_PAYOUT':
        return {
          icon: <FiRefreshCw />,
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          border: 'border-orange-100',
          label: 'Payout Processed',
        };
      case 'REGISTERED_CUSTOMER':
        return {
          icon: <FiUser />,
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-100',
          label: 'Customer Registration',
        };
      default:
        return {
          icon: <FiShield />,
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-100',
          label: action || 'System Activity',
        };
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return 'No date';
    return timestamp.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Activity Log
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            System audit trail for teller, customer, and payout activity
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
              <FiActivity />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">Recent System Activities</h2>
              <p className="text-sm text-gray-400">
                All sensitive actions are recorded here for monitoring and review.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {logs.length > 0 ? (
              logs.map((log) => {
                const actionStyle = getActionStyle(log.action);

                return (
                  <div
                    key={log.id}
                    className={`p-5 rounded-[2rem] border ${actionStyle.border} bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${actionStyle.bg} ${actionStyle.text}`}
                      >
                        {actionStyle.icon}
                      </div>

                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${actionStyle.text}`}>
                          {actionStyle.label}
                        </p>

                        <h3 className="text-lg font-black text-gray-800 mt-1">
                          {log.customerName || 'No customer name'}
                        </h3>

                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 font-semibold uppercase">
                            User: {log.userName || 'System'}
                          </p>

                          {log.branchName && (
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                              Branch: {log.branchName}
                            </p>
                          )}

                          {log.receiptNo && (
                            <p className="text-xs text-gray-500 font-semibold uppercase">
                              Receipt: {log.receiptNo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right">
                      {log.amount !== undefined && (
                        <p className="text-xl font-black text-green-600">
                          ${Number(log.amount || 0).toLocaleString()}
                        </p>
                      )}

                      {log.serviceCharge !== undefined && (
                        <p className="text-xs font-bold uppercase text-orange-500 mt-1">
                          Charge: ${Number(log.serviceCharge || 0).toLocaleString()}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 font-bold uppercase mt-2 flex md:justify-end items-center gap-2">
                        <FiClock />
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 bg-gray-50 rounded-[2rem] text-center">
                <p className="text-gray-400 font-bold">No activity logs found yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityLog;