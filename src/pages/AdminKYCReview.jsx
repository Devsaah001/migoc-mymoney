import { useEffect, useState } from 'react';
import { db } from '../firebase';
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
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiUsers,
  FiFileText,
  FiExternalLink,
} from 'react-icons/fi';

function AdminKYCReview() {
  const [applications, setApplications] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [kycNotes, setKycNotes] = useState('');
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  const isPdfFile = (url = '') => {
    return String(url).toLowerCase().includes('.pdf');
  };

  const handleVerifyKYC = async (loan) => {
    setLoadingId(loan.id);
    try {
      await updateDoc(doc(db, 'loans', loan.id), {
        kycStatus: 'verified',
        kycVerifiedBy: 'Main Admin',
        kycVerifiedAt: serverTimestamp(),
        kycNotes: kycNotes.trim(),
        status:
          String(loan.status || '').toLowerCase() === 'pending_kyc_review'
            ? 'pending'
            : loan.status,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'VERIFIED_LOAN_KYC',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: Number(loan.loanAmount || 0),
        userName: 'Main Admin',
        role: 'admin',
        office: 'admin',
        service: 'kyc_review',
        createdAt: serverTimestamp(),
      });

      alert(`KYC verified for ${loan.fullName}`);
      setSelectedLoan(null);
      setKycNotes('');
    } catch (err) {
      alert(err.message);
    }
    setLoadingId('');
  };

  const handleRejectKYC = async (loan) => {
    setLoadingId(loan.id);
    try {
      await updateDoc(doc(db, 'loans', loan.id), {
        kycStatus: 'rejected',
        kycVerifiedBy: 'Main Admin',
        kycVerifiedAt: serverTimestamp(),
        kycNotes: kycNotes.trim(),
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'REJECTED_LOAN_KYC',
        customerId: loan.customerId || '',
        customerName: loan.fullName || '',
        amount: Number(loan.loanAmount || 0),
        userName: 'Main Admin',
        role: 'admin',
        office: 'admin',
        service: 'kyc_review',
        createdAt: serverTimestamp(),
      });

      alert(`KYC rejected for ${loan.fullName}`);
      setSelectedLoan(null);
      setKycNotes('');
    } catch (err) {
      alert(err.message);
    }
    setLoadingId('');
  };

  const kycPending = applications.filter(
    (item) => String(item.kycStatus || 'pending').toLowerCase() === 'pending'
  );

  const kycVerified = applications.filter(
    (item) => String(item.kycStatus || '').toLowerCase() === 'verified'
  );

  const kycRejected = applications.filter(
    (item) => String(item.kycStatus || '').toLowerCase() === 'rejected'
  );

  const getKycStyle = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'verified') return 'bg-green-50 text-green-600';
    if (value === 'rejected') return 'bg-red-50 text-red-600';
    return 'bg-yellow-50 text-yellow-600';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            KYC Review Center
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Review applicant identity, documents, and guarantors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Pending KYC</p>
            <h2 className="text-3xl font-black text-yellow-500 mt-2">{kycPending.length}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Verified KYC</p>
            <h2 className="text-3xl font-black text-green-500 mt-2">{kycVerified.length}</h2>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] uppercase text-gray-400 font-black">Rejected KYC</p>
            <h2 className="text-3xl font-black text-red-500 mt-2">{kycRejected.length}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-800 mb-6">Applications</h3>

            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => {
                      setSelectedLoan(loan);
                      setKycNotes(loan.kycNotes || '');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedLoan?.id === loan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-black text-gray-800">{loan.fullName || 'Unnamed Applicant'}</p>
                    <p className="text-xs text-gray-400 mt-1">{loan.phone || 'No phone'}</p>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getKycStyle(loan.kycStatus)}`}>
                      {loan.kycStatus || 'pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-semibold">
                  No applications found.
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            {!selectedLoan ? (
              <div className="min-h-[420px] flex items-center justify-center text-gray-400 font-semibold">
                Select an application to review KYC.
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black text-blue-600">
                    KYC Review
                  </p>
                  <h2 className="text-3xl font-black text-gray-800 mt-1">
                    {selectedLoan.fullName}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] uppercase font-black text-blue-600">Applicant</p>
                    <h3 className="text-xl font-black text-blue-700 mt-2">
                      {selectedLoan.fullName || 'N/A'}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-green-50 border border-green-100">
                    <p className="text-[10px] uppercase font-black text-green-600">Document Type</p>
                    <h3 className="text-xl font-black text-green-700 mt-2">
                      {selectedLoan.idType || 'N/A'}
                    </h3>
                  </div>

                  <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-100">
                    <p className="text-[10px] uppercase font-black text-yellow-600">KYC Status</p>
                    <h3 className="text-xl font-black text-yellow-700 mt-2">
                      {selectedLoan.kycStatus || 'pending'}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiUser /> Applicant Details
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-bold">Date of Birth:</span> {selectedLoan.dob || 'N/A'}</p>
                      <p><span className="font-bold">Phone:</span> {selectedLoan.phone || 'N/A'}</p>
                      <p><span className="font-bold">Email:</span> {selectedLoan.email || 'N/A'}</p>
                      <p><span className="font-bold">Address:</span> {selectedLoan.address || 'N/A'}</p>
                      <p><span className="font-bold">Marital Status:</span> {selectedLoan.maritalStatus || 'N/A'}</p>
                      <p><span className="font-bold">ID Number:</span> {selectedLoan.idNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiUsers /> Guarantor Details
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-bold">Guarantor 1:</span> {selectedLoan.guarantorOneName || 'N/A'}</p>
                      <p><span className="font-bold">Phone 1:</span> {selectedLoan.guarantorOnePhone || 'N/A'}</p>
                      <p><span className="font-bold">Address 1:</span> {selectedLoan.guarantorOneAddress || 'N/A'}</p>
                      <p><span className="font-bold">Guarantor 2:</span> {selectedLoan.guarantorTwoName || 'N/A'}</p>
                      <p><span className="font-bold">Phone 2:</span> {selectedLoan.guarantorTwoPhone || 'N/A'}</p>
                      <p><span className="font-bold">Address 2:</span> {selectedLoan.guarantorTwoAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-white border border-gray-200">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiFileText /> Applicant Photo
                    </h3>
                    {selectedLoan.applicantPhoto ? (
                      <div className="space-y-4">
                        <img
                          src={selectedLoan.applicantPhoto}
                          alt="Applicant"
                          className="w-full h-64 object-cover rounded-2xl border border-gray-200"
                        />
                        <a
                          href={selectedLoan.applicantPhoto}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 font-bold underline"
                        >
                          <FiExternalLink />
                          Open Full Image
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No applicant photo provided.</p>
                    )}
                  </div>

                  <div className="p-6 rounded-3xl bg-white border border-gray-200">
                    <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                      <FiShield /> Document File
                    </h3>

                    {selectedLoan.documentPhoto ? (
                      <div className="space-y-4">
                        {isPdfFile(selectedLoan.documentPhoto) ? (
                          <>
                            <div className="w-full h-64 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                              <iframe
                                src={selectedLoan.documentPhoto}
                                title="Document Preview"
                                className="w-full h-full"
                              />
                            </div>
                            <a
                              href={selectedLoan.documentPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 font-bold underline"
                            >
                              <FiExternalLink />
                              Open Full PDF
                            </a>
                          </>
                        ) : (
                          <>
                            <img
                              src={selectedLoan.documentPhoto}
                              alt="Document"
                              className="w-full h-64 object-cover rounded-2xl border border-gray-200"
                            />
                            <a
                              href={selectedLoan.documentPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 font-bold underline"
                            >
                              <FiExternalLink />
                              Open Full File
                            </a>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No document file provided.</p>
                    )}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-gray-200">
                  <label className="text-[10px] uppercase font-black text-gray-400">
                    KYC Notes
                  </label>
                  <textarea
                    value={kycNotes}
                    onChange={(e) => setKycNotes(e.target.value)}
                    rows={5}
                    className="w-full mt-3 p-4 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
                    placeholder="Enter verification note, missing info, or rejection reason..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleRejectKYC(selectedLoan)}
                    disabled={loadingId === selectedLoan.id}
                    className="flex-1 bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <FiXCircle /> Reject KYC
                  </button>

                  <button
                    onClick={() => handleVerifyKYC(selectedLoan)}
                    disabled={loadingId === selectedLoan.id}
                    className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle /> Verify KYC
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminKYCReview;