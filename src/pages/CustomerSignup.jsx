import { useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FiUser, FiMail, FiLock, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function CustomerSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    temporaryPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const temporaryPassword = formData.temporaryPassword.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!email || !temporaryPassword || !confirmPassword) {
      alert('Please fill in all fields.');
      return;
    }

    if (temporaryPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (temporaryPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Find matching Susu customer profile first
      const customerQuery = query(
        collection(db, 'susu_customers'),
        where('email', '==', email)
      );

      const customerSnap = await getDocs(customerQuery);

      if (customerSnap.empty) {
        alert('No registered Susu customer was found with this email.');
        setLoading(false);
        return;
      }

      const customerDoc = customerSnap.docs[0];
      const customerData = customerDoc.data();

      // 2. Optional temporary password check against the registration record
      if (
        customerData.temporaryPassword &&
        customerData.temporaryPassword !== temporaryPassword
      ) {
        alert('Temporary password is incorrect.');
        setLoading(false);
        return;
      }

      // 3. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        temporaryPassword
      );

      // 4. Link auth account back to customer profile
      await updateDoc(doc(db, 'susu_customers', customerDoc.id), {
        authUid: userCredential.user.uid,
        accountLinked: true,
        accountLinkedAt: serverTimestamp(),
      });

      // 5. Log activity
      await updateDoc(doc(db, 'susu_customers', customerDoc.id), {
        signupCompleted: true,
      });

      alert('Customer account created successfully. You are now signed in.');
      navigate('/customer-dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        alert('This email already has an account. Please log in instead.');
      } else if (err.code === 'auth/invalid-email') {
        alert('Invalid email address.');
      } else if (err.code === 'auth/weak-password') {
        alert('Password is too weak.');
      } else {
        alert(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4">
            <FiUser />
          </div>
          <h1 className="text-3xl font-black text-[#0a1f4a]">Customer Signup</h1>
          <p className="text-gray-400 text-sm mt-2">
            Create your Susu customer login using your registered email and temporary password.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Registered Email"
              className="w-full p-4 pl-11 bg-gray-50 rounded-2xl border border-gray-200"
              required
            />
          </div>

          <div className="relative">
            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="temporaryPassword"
              type="password"
              value={formData.temporaryPassword}
              onChange={handleChange}
              placeholder="Temporary Password"
              className="w-full p-4 pl-11 bg-gray-50 rounded-2xl border border-gray-200"
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full p-4 pl-11 bg-gray-50 rounded-2xl border border-gray-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#165bbd] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#0a1f4a] transition-all"
          >
            {loading ? 'Creating Account...' : 'Create Customer Account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full mt-4 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold"
        >
          Back to Main Login
        </button>
      </div>
    </div>
  );
}

export default CustomerSignup;