import { useState, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Webcam from 'react-webcam';
import {
  FiCamera,
  FiUser,
  FiShield,
  FiUsers,
  FiSave,
  FiBriefcase,
  FiMail,
} from 'react-icons/fi';

function SusuRegistration() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    occupation: '',
    maritalStatus: 'Single',

    motherName: '',
    fatherName: '',
    childrenNames: '',
    familyPhone: '',

    idType: 'Voter ID',
    idNumber: '',

    branchId: '',
    branchName: '',
    assignedAgentId: '',
    assignedAgentName: '',

    contributionType: 'daily',
    expectedAmount: '',
    cycleDays: 30,
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setImgSrc(null);
    setFormData({
      fullName: '',
      dob: '',
      phone: '',
      email: '',
      Password: '',
      address: '',
      occupation: '',
      maritalStatus: 'Single',

      motherName: '',
      fatherName: '',
      childrenNames: '',
      familyPhone: '',

      idType: 'Voter ID',
      idNumber: '',

      branchId: '',
      branchName: '',
      assignedAgentId: '',
      assignedAgentName: '',

      contributionType: 'daily',
      expectedAmount: '',
      cycleDays: 30,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!imgSrc) {
      alert('Please capture customer photo');
      return;
    }

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.email ||
      !formData.address ||
      !formData.idNumber
    ) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const expectedAmount = Number(formData.expectedAmount || 0);
      const cycleDays = Number(formData.cycleDays || 30);

      const customerPayload = {
        fullName: formData.fullName.trim(),
        dob: formData.dob,
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        Password: formData.Password,
        address: formData.address.trim(),
        occupation: formData.occupation.trim(),
        maritalStatus: formData.maritalStatus,
        

        motherName: formData.motherName.trim(),
        fatherName: formData.fatherName.trim(),
        childrenNames: formData.childrenNames.trim(),
        familyPhone: formData.familyPhone.trim(),

        idType: formData.idType,
        idNumber: formData.idNumber.trim(),

        branchId: formData.branchId.trim(),
        branchName: formData.branchName.trim(),
        assignedAgentId: formData.assignedAgentId.trim(),
        assignedAgentName: formData.assignedAgentName.trim(),

        contributionType: formData.contributionType,
        expectedAmount,
        cycleDays,

        photo: imgSrc,

        balance: 0,
        totalContributions: 0,
        missedContributions: 0,
        totalCollectedThisCycle: 0,
        lastContributionAmount: 0,
        lastContributionDate: null,

        payoutReady: false,
        totalPayouts: 0,

        status: 'Active',
        accountType: 'Susu',
        dateJoined: new Date().toISOString().split('T')[0],

        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'susu_customers'), customerPayload);

      await addDoc(collection(db, 'activity_logs'), {
        action: 'REGISTERED_CUSTOMER',
        customerId: docRef.id,
        customerName: formData.fullName.trim(),
        userName: 'System',
        createdAt: serverTimestamp(),
      });

      alert(`Registration Successful! Account ID: ${docRef.id}`);
      resetForm();
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-8">
      <h1 className="text-3xl font-black text-[#0a1f4a] mb-8">New Susu Registration</h1>

      <form
        onSubmit={handleRegister}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center h-fit">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FiCamera /> Customer Photo
          </h3>

          <div className="rounded-2xl overflow-hidden border-2 border-gray-100 mb-4 bg-gray-50 aspect-square flex items-center justify-center">
            {!imgSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: 'user' }}
              />
            ) : (
              <img src={imgSrc} alt="capture" className="w-full h-full object-cover" />
            )}
          </div>

          {!imgSrc ? (
            <button
              type="button"
              onClick={capture}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
            >
              Capture
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setImgSrc(null)}
              className="bg-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold"
            >
              Retake
            </button>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-blue-600 mb-6 flex items-center gap-2">
              <FiUser /> Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <input
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <input
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Occupation"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <div className="md:col-span-2 relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Customer Email"
                  className="w-full p-3 pl-11 bg-gray-50 rounded-xl border border-gray-200"
                  required
                />
              </div>
               <input
                 name="Password"
                 type="password"
                 value={formData.Password}
                 onChange={handleChange}
                 placeholder="Password"
                 className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                 required
                />

              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Residential Address"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 md:col-span-2"
                required
              />

              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <option>Single</option>
                <option>Married</option>
                <option>Divorced</option>
                <option>Widowed</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-purple-600 mb-6 flex items-center gap-2">
              <FiUsers /> Family Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                placeholder="Mother's Name"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <input
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                placeholder="Father's Name"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <input
                name="childrenNames"
                value={formData.childrenNames}
                onChange={handleChange}
                placeholder="Child/Children Names"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <input
                name="familyPhone"
                value={formData.familyPhone}
                onChange={handleChange}
                placeholder="Family Contact Number"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-green-600 mb-6 flex items-center gap-2">
              <FiShield /> National Identification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <option>Passport</option>
                <option>Driver License</option>
                <option>Voter ID</option>
                <option>National ID</option>
              </select>

              <input
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="ID Number"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-orange-600 mb-6 flex items-center gap-2">
              <FiBriefcase /> Susu Account Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                placeholder="Branch ID"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <input
                name="branchName"
                value={formData.branchName}
                onChange={handleChange}
                placeholder="Branch Name"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <input
                name="assignedAgentId"
                value={formData.assignedAgentId}
                onChange={handleChange}
                placeholder="Assigned Agent ID"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <input
                name="assignedAgentName"
                value={formData.assignedAgentName}
                onChange={handleChange}
                placeholder="Assigned Agent Name"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              />

              <select
                name="contributionType"
                value={formData.contributionType}
                onChange={handleChange}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
              >
                <option value="daily">Daily Contribution</option>
                <option value="weekly">Weekly Contribution</option>
              </select>

              <input
                name="expectedAmount"
                type="number"
                value={formData.expectedAmount}
                onChange={handleChange}
                placeholder="Expected Deposit Amount"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />

              <input
                name="cycleDays"
                type="number"
                value={formData.cycleDays}
                onChange={handleChange}
                placeholder="Cycle Days"
                className="p-3 bg-gray-50 rounded-xl border border-gray-200"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a1f4a] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg"
          >
            <FiSave /> {loading ? 'Processing...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SusuRegistration;