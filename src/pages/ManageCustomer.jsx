import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiUserPlus, FiUsers, FiSearch, FiFileText, FiShield, FiCamera } from 'react-icons/fi';

function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // FORM DATA (Combined Susu & Microfinance)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', dob: '',
    type: 'Susu', // Susu or Loan
    idType: 'Voter ID', idNumber: '',
    guarantorName: '', guarantorPhone: '',
    businessName: '', savingsBalance: 0, loanBalance: 0
  });

  useEffect(() => {
    onSnapshot(query(collection(db, "customers"), orderBy("createdAt", "desc")), (snap) => {
      setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "customers"), {
        ...form,
        status: 'Active',
        creditScore: 50, // Default starting score
        createdAt: serverTimestamp()
      });
      alert("Success! Customer Profile Created.");
      setShowForm(false);
    } catch (err) { alert(err.message); }
    setLoading(false);
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-[#0a1f4a]">CUSTOMER MANAGEMENT</h1>
            <p className="text-gray-400">KYC & Credit Scoring Terminal</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "View List" : "+ Register Customer"}
          </button>
        </div>

        {showForm ? (
          /* --- ADMISSION FORM (KYC) --- */
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 animate-in">
             <h2 className="text-xl font-bold mb-8 flex items-center gap-2"><FiUserPlus color="#3b82f6"/> New KYC Profile</h2>
             <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input placeholder="Full Name" className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, name: e.target.value})} required/>
                <input placeholder="Phone Number" className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, phone: e.target.value})} required/>
                <input type="date" className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, dob: e.target.value})} required/>
                <select className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, idType: e.target.value})}>
                    <option>Voter ID</option><option>Passport</option><option>Driver License</option>
                </select>
                <input placeholder="National ID Number" className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, idNumber: e.target.value})} required/>
                <select className="p-4 bg-gray-50 rounded-2xl border border-gray-100" onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="Susu">Entry Level (Susu)</option>
                    <option value="Loan">Business Level (Loan Client)</option>
                </select>
                
                <div className="md:col-span-2 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-600 uppercase mb-4 flex items-center gap-2"><FiShield/> Guarantor Details (For Microfinance)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Guarantor Name" className="p-4 bg-white rounded-xl border border-blue-100" onChange={e => setForm({...form, guarantorName: e.target.value})}/>
                        <input placeholder="Guarantor Phone" className="p-4 bg-white rounded-xl border border-blue-100" onChange={e => setForm({...form, guarantorPhone: e.target.value})}/>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="md:col-span-2 bg-[#0a1f4a] text-white py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-black transition-all">
                    {loading ? "Authorizing..." : "Create Banking Portfolio"}
                </button>
             </form>
          </div>
        ) : (
          /* --- CUSTOMER LIST --- */
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold flex items-center gap-2"><FiUsers/> Active Portfolios</h3>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <FiSearch className="text-gray-400"/>
                    <input placeholder="Search customer..." className="bg-transparent outline-none text-sm" onChange={e => setSearchTerm(e.target.value)}/>
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
                     <th className="pb-6">Name</th>
                     <th className="pb-6">Type</th>
                     <th className="pb-6">Balance</th>
                     <th className="pb-6">Credit Score</th>
                     <th className="pb-6">Action</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm">
                    {filtered.map(c => (
                        <tr key={c.id} className="border-t border-gray-50">
                            <td className="py-6">
                                <div className="font-black text-gray-800">{c.name}</div>
                                <div className="text-[10px] text-gray-400">{c.phone}</div>
                            </td>
                            <td className="py-6">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${c.type === 'Loan' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                                    {c.type}
                                </span>
                            </td>
                            <td className="py-6 font-black text-gray-800">${c.savingsBalance}</td>
                            <td className="py-6">
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{width: `${c.creditScore}%`}}></div>
                                </div>
                            </td>
                            <td className="py-6">
                                <button className="text-blue-600 font-bold text-xs uppercase tracking-widest">Open Profile</button>
                            </td>
                        </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageCustomers;