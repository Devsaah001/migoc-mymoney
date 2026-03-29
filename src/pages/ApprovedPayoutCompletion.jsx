import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FiCheckCircle, FiDollarSign } from 'react-icons/fi';

function ApprovedPayoutCompletion() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'payout_requests'),
      where('status', '==', 'approved')
    );

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const handleComplete = async (item) => {
    setLoadingId(item.id);
    try {
      await addDoc(collection(db, 'susu_payouts'), {
        customerId: item.customerId,
        customerName: item.customerName,
        phone: item.phone || '',
        totalSaved: item.totalSaved,
        serviceCharge: item.serviceCharge,
        payoutAmount: item.payoutAmount,
        expectedAmount: item.expectedAmount || 0,
        totalContributions: item.totalContributions || 0,
        cycleDays: item.cycleDays || 30,
        processedBy: userData?.name || 'System',
        processedById: userData?.uid || '',
        branchId: item.branchId || '',
        branchName: item.branchName || '',
        payoutDate: new Date().toISOString().split('T')[0],
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'transactions'), {
        type: 'susu_payout',
        service: 'susu_payout',
        customerId: item.customerId,
        customerName: item.customerName,
        amount: item.payoutAmount,
        serviceCharge: item.serviceCharge,
        tellerId: userData?.uid || '',
        tellerName: userData?.name || 'System',
        branchId: item.branchId || '',
        branchName: item.branchName || '',
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'susu_customers', item.customerId), {
        balance: 0,
        totalCollectedThisCycle: 0,
        totalContributions: 0,
        missedContributions: 0,
        lastContributionAmount: 0,
        lastContributionDate: null,
        payoutReady: false,
        totalPayouts: (item.totalPayouts || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'payout_requests', item.id), {
        status: 'completed',
        completedBy: userData?.name || 'System',
        completedById: userData?.uid || '',
        completedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        userId: userData?.uid || '',
        userName: userData?.name || 'System',
        role: userData?.role || 'teller',
        action: 'COMPLETED_APPROVED_PAYOUT',
        customerId: item.customerId,
        customerName: item.customerName,
        amount: item.payoutAmount,
        serviceCharge: item.serviceCharge,
        branchId: item.branchId || '',
        branchName: item.branchName || '',
        createdAt: serverTimestamp(),
      });

      alert(`Approved payout completed for ${item.customerName}`);
    } catch (err) {
      alert(err.message);
    }
    setLoadingId('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter mb-10">
          Complete Approved Payouts
        </h1>

        <div className="space-y-6">
          {requests.length > 0 ? (
            requests.map((item) => (
              <div key={item.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">{item.customerName}</h3>
                    <p className="text-sm text-gray-500">Approved by: {item.approvedBy}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase text-gray-400 font-black">Final Payout</p>
                    <p className="text-2xl font-black text-blue-600">
                      ${Number(item.payoutAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(item)}
                  disabled={loadingId === item.id}
                  className="w-full mt-6 bg-[#165bbd] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <FiCheckCircle /> Complete Payout
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 text-gray-500 font-semibold">
              No approved payouts waiting for completion.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApprovedPayoutCompletion;