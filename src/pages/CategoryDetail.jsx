import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Database of sub-services based on your list
  const subServices = {
    momo: ["MTN Mobile Money Cash-In", "MTN Mobile Money Cash-Out", "Orange Money Cash-In", "Orange Money Cash-Out"],
    remit: ["Western Union Send", "Western Union Receive"],
    telecom: ["MTN SIM Registration", "Orange SIM Registration", "Airtime Sales", "Data Bundle Sales"],
    finance: ["Susu Collection Services", "Micro-Savings Account Support"],
    payments: ["Utility Bill Payment", "School Fee Payment", "Other Merchant Payments"],
    admin: ["Transaction Receipt Reprint", "Account Support"]
  };

  const list = subServices[id] || [];

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <nav className="bg-[#0a1f4a] text-white p-4 flex items-center gap-4">
        <button onClick={() => navigate('/')}><FiArrowLeft size={24} /></button>
        <h2 className="font-bold capitalize">{id.replace('-', ' ')} Services</h2>
      </nav>

      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Select Specific Service</h1>
        <div className="flex flex-col gap-3">
          {list.map((service, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/transaction/${encodeURIComponent(service)}`)}
              className="bg-white p-5 rounded-xl border border-gray-200 flex justify-between items-center hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <span className="font-semibold text-gray-700">{service}</span>
              <FiChevronRight className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CategoryDetail;