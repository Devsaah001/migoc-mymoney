import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import {
  FiUser,
  FiShield,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiCamera,
  FiImage,
} from 'react-icons/fi';
import { calculateLoanEligibilityScore } from '../utils/loanScoring';
import { uploadFileToStorage } from '../utils/fileUpload';

function OnlineLoanApplication() {
  const [form, setForm] = useState({
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    maritalStatus: 'Single',
    idType: 'Passport',
    idNumber: '',
    loanAmount: '',
    durationMonths: '',
    interestRate: '10',
    loanPurpose: '',
    guarantorOneName: '',
    guarantorOnePhone: '',
    guarantorOneAddress: '',
    guarantorTwoName: '',
    guarantorTwoPhone: '',
    guarantorTwoAddress: '',
  });

  const [applicantPhotoFile, setApplicantPhotoFile] = useState(null);
  const [documentPhotoFile, setDocumentPhotoFile] = useState(null);
  const [applicantPhotoPreview, setApplicantPhotoPreview] = useState('');
  const [documentPhotoPreview, setDocumentPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

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
      email: '',
      address: '',
      maritalStatus: 'Single',
      idType: 'Passport',
      idNumber: '',
      loanAmount: '',
      durationMonths: '',
      interestRate: '10',
      loanPurpose: '',
      guarantorOneName: '',
      guarantorOnePhone: '',
      guarantorOneAddress: '',
      guarantorTwoName: '',
      guarantorTwoPhone: '',
      guarantorTwoAddress: '',
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
      alert('Enter a valid duration in months');
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

      const loanRef = await addDoc(collection(db, 'loans'), {
        fullName: form.fullName.trim(),
        dob: form.dob,
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        address: form.address.trim(),
        maritalStatus: form.maritalStatus,
        idType: form.idType,
        idNumber: form.idNumber.trim(),

        loanAmount,
        durationMonths,
        interestRate,
        interestAmount,
        totalRepayable,
        loanPurpose: form.loanPurpose.trim(),

        guarantorOneName: form.guarantorOneName.trim(),
        guarantorOnePhone: form.guarantorOnePhone.trim(),
        guarantorOneAddress: form.guarantorOneAddress.trim(),
        guarantorTwoName: form.guarantorTwoName.trim(),
        guarantorTwoPhone: form.guarantorTwoPhone.trim(),
        guarantorTwoAddress: form.guarantorTwoAddress.trim(),

        applicantPhoto: applicantPhotoUrl,
        documentPhoto: documentPhotoUrl,

        approvedAmount: 0,
        loanBalance: 0,
        monthlyDue: 0,
        repaymentCount: 0,
        penaltyAmount: 0,
        penaltyRate: 0,
        nextDueDate: null,

        customerId: linkedCustomer?.id || '',
        linkedSusuCustomer: !!linkedCustomer,

        eligibilityScore: scoreResult.score,
        eligibilityGrade: scoreResult.grade,
        eligibilityRecommendation: scoreResult.recommendation,
        maxEligibleAmount: scoreResult.maxEligibleAmount,
        scoringSnapshot: scoreResult.factors,

        status: 'pending_kyc_review',
        reviewNote: '',

        kycStatus: 'pending',
        kycVerifiedBy: '',
        kycVerifiedAt: null,
        kycNotes: '',

        applicationSource: 'online',
        deviceType: 'web',
        branchName: '',
        branchId: '',

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        type: 'new_online_loan_application',
        title: 'New Online Loan Application',
        message: `${form.fullName.trim()} submitted an online loan application.`,
        loanId: loanRef.id,
        applicantName: form.fullName.trim(),
        applicantPhone: form.phone.trim(),
        amount: loanAmount,
        status: 'unread',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activity_logs'), {
        action: 'SUBMITTED_ONLINE_LOAN_APPLICATION',
        customerId: linkedCustomer?.id || '',
        customerName: form.fullName.trim(),
        amount: loanAmount,
        userName: form.fullName.trim(),
        role: 'customer',
        branchName: '',
        branchId: '',
        createdAt: serverTimestamp(),
      });

      setSuccessInfo({
        id: loanRef.id,
        score: scoreResult.score,
        grade: scoreResult.grade,
      });

      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit application');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-8 md:px-8 lg:px-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-[#0a1f4a] uppercase tracking-tight">
            Online Loan Application
          </h1>
          <p className="text-gray-500 font-semibold text-sm mt-3">
            Apply for a microfinance loan from any phone, tablet, iPad, or computer
          </p>
        </div>

        {successInfo && (
          <div className="mb-8 bg-green-50 border border-green-100 rounded-[2rem] p-6">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="text-green-600 text-2xl mt-1" />
              <div>
                <h2 className="font-black text-green-700 text-xl">Application Submitted</h2>
                <p className="text-green-700 text-sm mt-2">
                  Reference ID: <span className="font-bold">{successInfo.id}</span>
                </p>
                <p className="text-green-700 text-sm">
                  Eligibility Score: <span className="font-bold">{successInfo.score}/100</span>
                </p>
                <p className="text-green-700 text-sm">
                  Grade: <span className="font-bold">{successInfo.grade}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-blue-600 mb-5 flex items-center gap-2 text-lg">
              <FiUser /> Applicant Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="dob" type="date" value={form.dob} onChange={handleChange} className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="address" value={form.address} onChange={handleChange} placeholder="Residential Address" className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2" required />
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-green-600 mb-5 flex items-center gap-2 text-lg">
              <FiShield /> Identification & KYC
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select name="idType" value={form.idType} onChange={handleChange} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
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
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-600 mb-3">
                  Applicant Photo / Selfie
                </label>

                <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-white border border-dashed border-blue-300 text-blue-600 font-bold cursor-pointer hover:bg-blue-50 transition">
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

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <label className="block text-sm font-bold text-gray-600 mb-3">
                  Document Photo (ID Front / Main Document)
                </label>

                <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-white border border-dashed border-green-300 text-green-600 font-bold cursor-pointer hover:bg-green-50 transition">
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

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-purple-600 mb-5 flex items-center gap-2 text-lg">
              <FiUsers /> Guarantor Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="guarantorOneName" value={form.guarantorOneName} onChange={handleChange} placeholder="Guarantor 1 Name" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="guarantorOnePhone" value={form.guarantorOnePhone} onChange={handleChange} placeholder="Guarantor 1 Phone" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="guarantorOneAddress" value={form.guarantorOneAddress} onChange={handleChange} placeholder="Guarantor 1 Address" className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2" required />

              <input name="guarantorTwoName" value={form.guarantorTwoName} onChange={handleChange} placeholder="Guarantor 2 Name" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="guarantorTwoPhone" value={form.guarantorTwoPhone} onChange={handleChange} placeholder="Guarantor 2 Phone" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="guarantorTwoAddress" value={form.guarantorTwoAddress} onChange={handleChange} placeholder="Guarantor 2 Address" className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2" required />
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-orange-600 mb-5 flex items-center gap-2 text-lg">
              <FiDollarSign /> Loan Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="loanAmount" type="number" value={form.loanAmount} onChange={handleChange} placeholder="Loan Amount" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="durationMonths" type="number" value={form.durationMonths} onChange={handleChange} placeholder="Duration (Months)" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <input name="interestRate" type="number" value={form.interestRate} onChange={handleChange} placeholder="Interest Rate (%)" className="p-4 bg-gray-50 rounded-xl border border-gray-200" required />
              <textarea
                name="loanPurpose"
                value={form.loanPurpose}
                onChange={handleChange}
                placeholder="Purpose of Loan"
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 md:col-span-3 min-h-[110px]"
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
    </div>
  );
}

export default OnlineLoanApplication;