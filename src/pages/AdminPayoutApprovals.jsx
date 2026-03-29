import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi';

function AdminPayoutApprovals() {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'payout_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleApprove = async (requestItem) => {
    setLoadingId(requestItem.id);
    try {
      await updateDoc(doc(db, 'payout_requests', requestItem.id), {
        status: 'approved',
        approvedBy: userData?.name || 'Admin',
        approvedById: userData?.uid || '',
        approvedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        userId: userData?.uid || '',
        userName: userData?.name || 'Admin',
        role: userData?.role || 'admin',
        action: 'APPROVED_PAYOUT_REQUEST',
        customerId: requestItem.customerId,
        customerName: requestItem.customerName,
        amount: requestItem.payoutAmount,
        serviceCharge: requestItem.serviceCharge,
        branchId: requestItem.branchId || '',
        branchName: requestItem.branchName || '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message);
    }
    setLoadingId('');
  };

  const handleReject = async (requestItem) => {
    setLoadingId(requestItem.id);
    try {
      await updateDoc(doc(db, 'payout_requests', requestItem.id), {
        status: 'rejected',
        approvedBy: userData?.name || 'Admin',
        approvedById: userData?.uid || '',
        approvedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        userId: userData?.uid || '',
        userName: userData?.name || 'Admin',
        role: userData?.role || 'admin',
        action: 'REJECTED_PAYOUT_REQUEST',
        customerId: requestItem.customerId,
        customerName: requestItem.customerName,
        amount: requestItem.payoutAmount,
        serviceCharge: requestItem.serviceCharge,
        branchId: requestItem.branchId || '',
        branchName: requestItem.branchName || '',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      alert(err.message);
    }
    setLoadingId('');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Admin Payout Approvals
          </h1>
        </div>

        <div className="space-y-6">
          {requests.length > 0 ? (
            requests.map((item) => (
              <div key={item.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">
                      {item.status}
                    </p>
                    <h3 className="text-2xl font-black text-gray-800">{item.customerName}</h3>
                    <p className="text-sm text-gray-500">Requested by: {item.requestedBy}</p>
                    <p className="text-sm text-gray-500">Branch: {item.branchName || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Saved</p>
                      <p className="text-lg font-black text-green-600">${Number(item.totalSaved || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Charge</p>
                      <p className="text-lg font-black text-yellow-600">${Number(item.serviceCharge || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400 font-black">Payout</p>
                      <p className="text-lg font-black text-blue-600">${Number(item.payoutAmount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => handleReject(item)}
                      disabled={loadingId === item.id}
                      className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <FiXCircle /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      disabled={loadingId === item.id}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <FiCheckCircle /> Approve
                    </button>
                  </div>
                )}

                {item.status !== 'pending' && (
                  <div className="mt-6 p-4 rounded-xl bg-gray-50 text-sm text-gray-600">
                    Reviewed by: {item.approvedBy || 'N/A'}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 text-gray-500 font-semibold">
              No payout requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPayoutApprovals;