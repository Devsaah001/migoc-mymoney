import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
  FiUser,
  FiShield,
  FiUsers,
  FiDollarSign,
  FiCamera,
  FiImage,
} from 'react-icons/fi';
import { calculateLoanEligibilityScore } from '../utils/loanScoring';
import { uploadFileToStorage } from '../utils/fileUpload';

function MicroFinance() {
  const { userData } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    phone: '',
    address: '',
    maritalStatus: 'Single',
    idType: 'Passport',
    idNumber: '',
    guarantorOneName: '',
    guarantorOnePhone: '',
    guarantorOneAddress: '',
    guarantorTwoName: '',
    guarantorTwoPhone: '',
    guarantorTwoAddress: '',
    loanAmount: '',
    durationMonths: '',
    interestRate: '10',
  });

  const [applicantPhotoFile, setApplicantPhotoFile] = useState(null);
  const [documentPhotoFile, setDocumentPhotoFile] = useState(null);
  const [applicantPhotoPreview, setApplicantPhotoPreview] = useState('');
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setLoans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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

  const handleApplicantPhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setApplicantPhotoFile(file);

    if (file) {
      setApplicantPhotoPreview(URL.createObjectURL(file));
    } else {
      setApplicantPhotoPreview('');
    }
  };

  const handleDocumentPhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDocumentPhotoFile(file);

    if (file) {
      setDocumentPhotoPreview(URL.createObjectURL(file));
    } else {
      setDocumentPhotoPreview('');
    }
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      dob: '',
      phone: '',
      address: '',
      maritalStatus: 'Single',
      idType: 'Passport',
      idNumber: '',
      guarantorOneName: '',
      guarantorOnePhone: '',
      guarantorOneAddress: '',
      guarantorTwoName: '',
      guarantorTwoPhone: '',
      guarantorTwoAddress: '',
      loanAmount: '',
      durationMonths: '',
      interestRate: '10',
    });
    setApplicantPhotoFile(null);
    setDocumentPhotoFile(null);
    setApplicantPhotoPreview('');
    setDocumentPhotoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loanAmount = Number(form.loanAmount);
    const interestRate = Number(form.interestRate);
    const durationMonths = Number(form.durationMonths);

    if (!loanAmount || loanAmount <= 0) {
      alert('Enter a valid loan amount');
      return;
    }

    if (!durationMonths || durationMonths <= 0) {
      alert('Enter a valid loan duration');
      return;
    }

    if (!applicantPhotoFile) {
      alert('Please take or upload applicant photo');
      return;
    }

    if (!documentPhotoFile) {
      alert('Please take or upload document photo');
      return;
    }

    setSubmitting(true);

    try {
      const interestAmount = (loanAmount * interestRate) / 100;
      const totalRepayable = loanAmount + interestAmount;

      let linkedCustomer = null;
      const customerQuery = query(
        collection(db, 'susu_customers'),
        where('phone', '==', form.phone.trim())
      );
      const customerSnap = await getDocs(customerQuery);

      if (!customerSnap.empty) {
        linkedCustomer = {
          id: customerSnap.docs[0].id,
          ...customerSnap.docs[0].data(),
        };
      }

      const scoreResult = calculateLoanEligibilityScore(
        linkedCustomer || {},
        { loanAmount }
      );

      const applicantPhotoUrl = await uploadFileToStorage(
        applicantPhotoFile,
        'loan_applications/applicant_photos'
      );

      const documentPhotoUrl = await uploadFileToStorage(
        documentPhotoFile,
        'loan_applications/document_photos'
      );

      await addDoc(collection(db, 'loans'), {
        fullName: form.fullName.trim(),
        dob: form.dob,
        phone: form.phone.trim(),
        address: form.address.trim(),
        maritalStatus: form.maritalStatus,
        idType: form.idType,
        idNumber: form.idNumber.trim(),

        guarantorOneName: form.guarantorOneName.trim(),
        guarantorOnePhone: form.guarantorOnePhone.trim(),
        guarantorOneAddress: form.guarantorOneAddress.trim(),

        guarantorTwoName: form.guarantorTwoName.trim(),
        guarantorTwoPhone: form.guarantorTwoPhone.trim(),
        guarantorTwoAddress: form.guarantorTwoAddress.trim(),

        loanAmount,
        durationMonths,
        interestRate,
        interestAmount,
        totalRepayable,

        approvedAmount: 0,
        loanBalance: 0,
        monthlyDue: 0,
        repaymentCount: 0,
        lastRepaymentAmount: 0,
        lastRepaymentDate: null,
        nextDueDate: null,

        applicantPhoto: applicantPhotoUrl,
        documentPhoto: documentPhotoUrl,

        status: 'pending_kyc_review',
        reviewNote: '',

        kycStatus: 'pending',
        kycVerifiedBy: '',
        kycVerifiedAt: null,
        kycNotes: '',

        customerId: linkedCustomer?.id || '',
        linkedSusuCustomer: !!linkedCustomer,
        officerName: userData?.name || 'System',
        officerEmail: userData?.email || '',
        officerRole: userData?.role || 'financial-agent',
        branchName: userData?.branchName || '',
        branchId: userData?.branchId || '',

        eligibilityScore: scoreResult.score,
        eligibilityGrade: scoreResult.grade,
        eligibilityRecommendation: scoreResult.recommendation,
        maxEligibleAmount: scoreResult.maxEligibleAmount,
        scoringSnapshot: scoreResult.factors,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(
        `Loan application submitted.\nEligibility Score: ${scoreResult.score}/100\nGrade: ${scoreResult.grade}`
      );
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit loan application');
    }

    setSubmitting(false);
  };

  const getStatusStyle = (status) => {
    const value = String(status || '').toLowerCase();

    if (value === 'pending') return 'bg-yellow-50 text-yellow-600';
    if (value === 'pending_kyc_review') return 'bg-yellow-50 text-yellow-600';
    if (value === 'approved') return 'bg-blue-50 text-blue-600';
    if (value === 'disbursed') return 'bg-green-50 text-green-600';
    if (value === 'completed') return 'bg-emerald-50 text-emerald-600';
    if (value === 'rejected') return 'bg-red-50 text-red-600';

    return 'bg-gray-50 text-gray-600';
  };

  const getScoreStyle = (score) => {
    const value = Number(score || 0);
    if (value >= 80) return 'text-green-600';
    if (value >= 65) return 'text-blue-600';
    if (value >= 50) return 'text-yellow-600';
    if (value >= 35) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#0a1f4a] uppercase tracking-tighter">
            Microfinance Loan System
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Submit loan applications for admin review and approval
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 mb-8">
              New Loan Application
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-blue-600 mb-5 flex items-center gap-2">
                  <FiUser /> Applicant Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <input
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <select
                    name="maritalStatus"
                    value={form.maritalStatus}
                    onChange={handleChange}
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  >
                    <option>Single</option>
                    <option>Married</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-green-600 mb-5 flex items-center gap-2">
                  <FiShield /> Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <select
                    name="idType"
                    value={form.idType}
                    onChange={handleChange}
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  >
                    <option>Passport</option>
                    <option>Voter ID</option>
                    <option>Driver License</option>
                    <option>National ID</option>
                  </select>

                  <input
                    name="idNumber"
                    value={form.idNumber}
                    onChange={handleChange}
                    placeholder="ID Number"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />

                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <label className="block text-sm font-bold text-gray-600 mb-3">
                      Applicant Photo / Selfie
                    </label>

                    <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-gray-50 border border-dashed border-blue-300 text-blue-600 font-bold cursor-pointer hover:bg-blue-50 transition">
                      <FiCamera />
                      Take or Upload Applicant Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={handleApplicantPhotoChange}
                        className="hidden"
                        required
                      />
                    </label>

                    {applicantPhotoFile && (
                      <p className="text-xs text-green-600 font-bold mt-3">
                        Selected: {applicantPhotoFile.name}
                      </p>
                    )}

                    {applicantPhotoPreview && (
                      <img
                        src={applicantPhotoPreview}
                        alt="Applicant Preview"
                        className="mt-4 w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <label className="block text-sm font-bold text-gray-600 mb-3">
                      Document Photo
                    </label>

                    <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-gray-50 border border-dashed border-green-300 text-green-600 font-bold cursor-pointer hover:bg-green-50 transition">
                      <FiImage />
                      Take or Upload Document Photo
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        capture="environment"
                        onChange={handleDocumentPhotoChange}
                        className="hidden"
                        required
                      />
                    </label>

                    {documentPhotoFile && (
                      <p className="text-xs text-green-600 font-bold mt-3">
                        Selected: {documentPhotoFile.name}
                      </p>
                    )}

                    {documentPhotoPreview && documentPhotoFile?.type?.startsWith('image/') && (
                      <img
                        src={documentPhotoPreview}
                        alt="Document Preview"
                        className="mt-4 w-full h-48 object-cover rounded-xl border border-gray-200"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-purple-600 mb-5 flex items-center gap-2">
                  <FiUsers /> Guarantor Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    name="guarantorOneName"
                    value={form.guarantorOneName}
                    onChange={handleChange}
                    placeholder="Guarantor 1 Name"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  />
                  <input
                    name="guarantorOnePhone"
                    value={form.guarantorOnePhone}
                    onChange={handleChange}
                    placeholder="Guarantor 1 Phone"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  />
                  <input
                    name="guarantorOneAddress"
                    value={form.guarantorOneAddress}
                    onChange={handleChange}
                    placeholder="Guarantor 1 Address"
                    className="p-3 bg-white rounded-xl border border-gray-200 md:col-span-2"
                  />
                  <input
                    name="guarantorTwoName"
                    value={form.guarantorTwoName}
                    onChange={handleChange}
                    placeholder="Guarantor 2 Name"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  />
                  <input
                    name="guarantorTwoPhone"
                    value={form.guarantorTwoPhone}
                    onChange={handleChange}
                    placeholder="Guarantor 2 Phone"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                  />
                  <input
                    name="guarantorTwoAddress"
                    value={form.guarantorTwoAddress}
                    onChange={handleChange}
                    placeholder="Guarantor 2 Address"
                    className="p-3 bg-white rounded-xl border border-gray-200 md:col-span-2"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <h3 className="font-black text-orange-600 mb-5 flex items-center gap-2">
                  <FiDollarSign /> Loan Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    name="loanAmount"
                    type="number"
                    value={form.loanAmount}
                    onChange={handleChange}
                    placeholder="Loan Amount"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <input
                    name="durationMonths"
                    type="number"
                    value={form.durationMonths}
                    onChange={handleChange}
                    placeholder="Duration (Months)"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                  <input
                    name="interestRate"
                    type="number"
                    value={form.interestRate}
                    onChange={handleChange}
                    placeholder="Interest Rate (%)"
                    className="p-3 bg-white rounded-xl border border-gray-200"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-black text-lg"
              >
                {submitting ? 'Submitting Application...' : 'Submit Loan Application'}
              </button>
            </form>
          </div>

          <div className="xl:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Loan Records</h2>

            <div className="space-y-4 max-h-[900px] overflow-y-auto pr-2">
              {loans.length > 0 ? (
                loans.map((loan) => (
                  <div key={loan.id} className="p-5 border border-gray-100 rounded-2xl bg-gray-50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-black text-gray-800">{loan.fullName}</p>
                        <p className="text-xs text-gray-400 mt-1">{loan.phone}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusStyle(loan.status)}`}>
                        {loan.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-bold">Loan:</span> $
                        {Number(loan.loanAmount || 0).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-bold">Score:</span>{' '}
                        <span className={`font-black ${getScoreStyle(loan.eligibilityScore)}`}>
                          {Number(loan.eligibilityScore || 0)}/100
                        </span>
                      </p>
                      <p>
                        <span className="font-bold">Grade:</span> {loan.eligibilityGrade || 'N/A'}
                      </p>
                      <p>
                        <span className="font-bold">Recommendation:</span>{' '}
                        {loan.eligibilityRecommendation || 'N/A'}
                      </p>
                      <p>
                        <span className="font-bold">Max Eligible:</span> $
                        {Number(loan.maxEligibleAmount || 0).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-bold">Balance:</span> $
                        {Number(loan.loanBalance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50 text-sm text-gray-500 font-semibold">
                  No loan records yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default MicroFinance;90