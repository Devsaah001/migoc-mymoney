import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';

function CustomerLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/customer-dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        alert('Account not found. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        alert('Incorrect password.');
      } else {
        alert(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow border">
        <h1 className="text-2xl font-black mb-6 text-center">Customer Login</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 p-3 border rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full pl-10 p-3 border rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          onClick={() => navigate('/customer-signup')}
          className="w-full mt-4 text-blue-600 font-bold"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

export default CustomerLogin;