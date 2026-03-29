import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FiSmartphone,
  FiGlobe,
  FiPhoneCall,
  FiTrendingUp,
  FiSettings,
  FiFileText,
  FiLogOut,
  FiZap,
  FiDollarSign,
  FiShield,
  FiUser,
  FiChevronRight,
} from 'react-icons/fi';

function Dashboard() {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const categories = [
    {
      id: 'momo',
      label: 'Mobile Money',
      icon: <FiSmartphone />,
      color: '#fbbf24',
      shadow: 'rgba(251, 191, 36, 0.35)',
      sub: ['MTN & Orange'],
      route: '/workspace/momo',
    },
    {
      id: 'remittance',
      label: 'Remittance',
      icon: <FiGlobe />,
      color: '#3b82f6',
      shadow: 'rgba(59, 130, 246, 0.35)',
      sub: ['Western Union'],
      route: '/workspace/remittance',
    },
    {
      id: 'telecom',
      label: 'Telecom',
      icon: <FiPhoneCall />,
      color: '#10b981',
      shadow: 'rgba(16, 185, 129, 0.35)',
      sub: ['SIM & Airtime'],
      route: '/workspace/telecom',
    },
    {
      id: 'finance',
      label: 'Financial Services',
      icon: <FiTrendingUp />,
      color: '#8b5cf6',
      shadow: 'rgba(139, 92, 246, 0.35)',
      sub: ['Susu & Microfinance'],
      route: '/workspace/finance',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <FiFileText />,
      color: '#6366f1',
      shadow: 'rgba(99, 102, 241, 0.35)',
      sub: ['Bills & Fees'],
      route: '/workspace/payments',
    },
    {
      id: 'forex',
      label: 'Foreign Exchange',
      icon: <FiDollarSign />,
      color: '#ec4899',
      shadow: 'rgba(236, 72, 153, 0.35)',
      sub: ['USD & LRD'],
      route: '/foreign-exchange',
    },
    {
      id: 'admin-hub',
      label: 'Management',
      icon: <FiSettings />,
      color: '#f43f5e',
      shadow: 'rgba(244, 63, 94, 0.35)',
      sub: ['Full System Audit'],
      route: '/admin-hub',
    },
  ];

  const handleEntry = (cat) => {
    navigate(cat.route);
  };

  const isAdmin =
    ['admin', 'supervisor'].includes(String(userData?.role || '').toLowerCase());

  return (
    <div className="min-h-screen bg-[#f5f8ff] font-sans pb-16">
      <nav className="sticky top-0 z-50 border-b border-[#e8eefc] bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-5 md:px-8 xl:px-10 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0a1f4a] to-[#165bbd] flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0a1f4a] uppercase">
                My Money
              </h1>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 font-bold">
                Teller Operations System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => navigate('/staff-profile')}
              className="hidden md:flex items-center gap-2 rounded-2xl bg-[#f4f8ff] border border-[#e7eefc] px-4 py-3 text-[#0a1f4a] font-bold hover:bg-white transition-all"
            >
              <FiUser />
              Profile
            </button>

            <div className="text-right border-l border-[#e7eefc] pl-4 md:pl-5">
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#165bbd]">
                Staff Portal
              </p>
              <p className="text-sm md:text-lg font-black text-[#0a1f4a]">
                {userData?.name || 'Staff User'}
              </p>
              <p className="text-[10px] uppercase text-gray-400 font-bold mt-1">
                {userData?.role || 'authorized staff'}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-2xl bg-[#fff1f2] border border-[#ffe0e5] p-3 text-[#e11d48] hover:scale-105 transition-all"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 md:px-8 xl:px-10 mt-8 md:mt-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0a1f4a] via-[#0f2f76] to-[#165bbd] p-8 md:p-10 text-white shadow-[0_25px_80px_rgba(10,31,74,0.18)]">
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] font-black text-blue-100">
                Service Terminal
              </p>
              <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                Operations Hub <FiZap className="text-yellow-300" />
              </h2>
              <p className="mt-4 max-w-2xl text-blue-100 leading-relaxed">
                System unlocked. Select a workspace to continue service operations,
                monitoring, and transaction management.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[260px]">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-[10px] uppercase font-black text-blue-100">Role</p>
                <p className="mt-2 text-lg font-black uppercase">
                  {userData?.role || 'staff'}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-[10px] uppercase font-black text-blue-100">Branch</p>
                <p className="mt-2 text-lg font-black">
                  {userData?.branchName || 'HQ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {categories
            .filter((cat) => (cat.id === 'admin-hub' ? isAdmin : true))
            .map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleEntry(cat)}
                className="group bg-white rounded-[2.4rem] border border-[#edf2ff] p-8 shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)] relative overflow-hidden"
              >
                <div
                  className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-20"
                  style={{ backgroundColor: cat.color }}
                />

                <div
                  className="relative z-10 w-18 h-18 md:w-20 md:h-20 rounded-[1.7rem] flex items-center justify-center text-3xl mb-7"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                    boxShadow: `0 10px 30px ${cat.shadow}`,
                  }}
                >
                  {cat.icon}
                </div>

                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Workspace
                  </p>
                  <h3 className="mt-3 text-2xl font-black text-[#0a1f4a] tracking-tight">
                    {cat.label}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {cat.sub.map((s) => (
                      <span
                        key={s}
                        className="bg-[#f5f8ff] border border-[#edf2ff] px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-[0.12em]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-[#165bbd]">
                      Enter Office
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-[#f5f8ff] border border-[#edf2ff] flex items-center justify-center text-[#165bbd] group-hover:bg-[#165bbd] group-hover:text-white transition-all">
                      <FiChevronRight />
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-10 rounded-[2rem] bg-white border border-[#edf2ff] p-6 md:p-8 shadow-sm">
          <div className="flex items-start gap-3">
            <FiShield className="text-[#165bbd] mt-1" />
            <div>
              <h3 className="text-lg font-black text-[#0a1f4a]">Operational Notice</h3>
              <p className="text-gray-500 mt-2 leading-relaxed">
                Access to management tools is restricted by staff role. Teller,
                supervisor, and admin accounts will only see workspaces permitted by
                their assigned privileges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;