import { FiGlobe, FiSend, FiDownload, FiClock, FiShield } from 'react-icons/fi';

function RemittanceOffice() {
  const services = [
    { name: 'Western Union', status: 'Connected', color: 'text-green-500' },
    { name: 'MoneyGram', status: 'Connected', color: 'text-green-500' },
    { name: 'RIA Transfer', status: 'Pending Integration', color: 'text-yellow-500' },
    { name: 'Sendwave / TapTap', status: 'Pending Integration', color: 'text-yellow-500' },
    { name: 'Ecobank services', status: 'Pending Integration', color: 'text-yellow-500' },
    { name: 'BNB services', status: 'Pending Integration', color: 'text-yellow-500' },
    
  ];

  return (
    <div className="min-h-screen bg-[#f5f8ff] font-sans p-6 md:p-10">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#0a1f4a] tracking-tight flex items-center gap-3">
          Remittance Office <FiGlobe className="text-blue-500" />
        </h1>
        <p className="text-gray-500 mt-2">
          Manage inbound and outbound international transfers.
        </p>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <FiSend className="text-green-500 text-2xl mb-3" />
          <h3 className="font-black text-lg text-[#0a1f4a]">Send Money</h3>
          <p className="text-gray-500 text-sm mt-1">
            Initiate outbound transfers for customers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <FiDownload className="text-blue-500 text-2xl mb-3" />
          <h3 className="font-black text-lg text-[#0a1f4a]">Receive Money</h3>
          <p className="text-gray-500 text-sm mt-1">
            Process incoming remittance transactions.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <FiClock className="text-yellow-500 text-2xl mb-3" />
          <h3 className="font-black text-lg text-[#0a1f4a]">Transaction History</h3>
          <p className="text-gray-500 text-sm mt-1">
            View and track all remittance activities.
          </p>
        </div>

      </div>

      {/* PROVIDERS STATUS */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-black text-[#0a1f4a] mb-6">
          Connected Remittance Providers
        </h2>

        <div className="space-y-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 rounded-xl bg-[#f9fafb]"
            >
              <div>
                <p className="font-bold text-[#0a1f4a]">{service.name}</p>
                <p className="text-xs text-gray-400 uppercase">
                  Remittance Service
                </p>
              </div>

              <p className={`text-sm font-black ${service.color}`}>
                {service.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* NOTICE */}
      <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-3">
        <FiShield className="text-blue-500 mt-1" />
        <div>
          <p className="font-bold text-[#0a1f4a]">Integration Notice</p>
          <p className="text-sm text-gray-600 mt-1">
            Live transaction processing will be connected through official provider APIs 
            (Western Union, MoneyGram, RIA, etc.) after system deployment and business registration.
          </p>
        </div>
      </div>

    </div>
  );
}

export default RemittanceOffice;