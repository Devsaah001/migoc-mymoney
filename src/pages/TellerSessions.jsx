import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { FiClock, FiLogOut, FiUser, FiCalendar } from 'react-icons/fi';

function TellerSessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'teller_sessions'), orderBy('loginTime', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaySessions = sessions.filter((s) => s.dateKey === todayKey);

  const formatTime = (value) => {
    if (!value?.toDate) return '—';
    return value.toDate().toLocaleString();
  };

  const getDuration = (loginTime, logoutTime) => {
    if (!loginTime?.toDate) return '—';
    const start = loginTime.toDate();
    const end = logoutTime?.toDate ? logoutTime.toDate() : new Date();
    const diffMs = Math.max(end - start, 0);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Teller Session Report
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Daily login, logout, and attendance tracking
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400">Sessions Today</p>
            <h2 className="text-3xl font-black text-blue-600 mt-2">{todaySessions.length}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400">Active Now</p>
            <h2 className="text-3xl font-black text-green-600 mt-2">
              {todaySessions.filter((s) => s.active === true).length}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-gray-400">Closed Today</p>
            <h2 className="text-3xl font-black text-orange-600 mt-2">
              {todaySessions.filter((s) => s.logoutTime).length}
            </h2>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <FiClock /> Session Log
          </h3>

          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-[1.5rem] bg-gray-50 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <p className="font-black text-gray-800">
                      {session.tellerName || 'Unknown Teller'}
                    </p>
                    <p className="text-xs text-gray-400 uppercase font-bold mt-1">
                      Branch: {session.branchName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 uppercase font-bold">
                      Date: {session.dateKey || 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8 text-sm">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Login</p>
                      <p className="font-bold text-gray-700">{formatTime(session.loginTime)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Logout</p>
                      <p className="font-bold text-gray-700">{formatTime(session.logoutTime)}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Duration</p>
                      <p className="font-bold text-gray-700">
                        {getDuration(session.loginTime, session.logoutTime)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Status</p>
                      <p
                        className={`font-black ${
                          session.active ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {session.active ? 'ACTIVE' : 'CLOSED'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-gray-50 text-gray-500 font-semibold">
                No teller sessions found yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TellerSessions;