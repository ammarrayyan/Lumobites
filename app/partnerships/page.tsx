export default async function PartnershipsPage({
  searchParams
}: {
  searchParams?: Promise<{ success?: string }> | { success?: string }
}) {
  let isSuccess = false;
  if (searchParams) {
    const resolvedParams = await Promise.resolve(searchParams);
    isSuccess = resolvedParams?.success === 'true';
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans py-16 px-4">
      <main className="max-w-3xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-[#2E2419] mb-3">
            Partnerships & Press
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed font-medium">
            We're always open to working with businesses and organizations 
            that share our passion for high-standard pet care.
          </p>
        </div>

        {/* Partnership Types */}
        <div 
          style={{ boxShadow: '0 2px 8px rgba(139, 94, 60, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)' }}
          className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
        >
          <div className="bg-[#FAF5EE] px-6 py-4 border-b border-[#EADBCE] flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#F0E6DA] text-[#8B5E3C] flex items-center justify-center text-xs">
                🤝
              </span>
              Who We Partner With
            </h2>
            <span className="text-[10px] font-bold text-[#8B5E3C] bg-white px-2.5 py-0.5 rounded-full border border-[#EADBCE]">
              5 Ecosystem Categories
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4.5 space-y-1">
              <h3 className="font-bold text-[#2E2419] text-sm">Pet Food Brands</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Get featured in our AI food recommendations reaching thousands of pet owners daily.
              </p>
            </div>
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4.5 space-y-1">
              <h3 className="font-bold text-[#2E2419] text-sm">Veterinary Clinics</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                License our AI pet food scanner and lost pet matching technology for your practice.
              </p>
            </div>
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4.5 space-y-1">
              <h3 className="font-bold text-[#2E2419] text-sm">Animal Shelters</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Integrate with our lost pet network to help reunite more pets with their families.
              </p>
            </div>
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4.5 space-y-1">
              <h3 className="font-bold text-[#2E2419] text-sm">Investors & Press</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Interested in Lumo Bites' growth story and pet health AI? We'd love to connect.
              </p>
            </div>
            <div className="bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl p-4.5 space-y-1 md:col-span-2">
              <h3 className="font-bold text-[#2E2419] text-sm">Lost Pet Networks</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Partner with Lumo Bites to connect your lost pet network with our AI photo matching technology — 
                helping reunite more pets with their families faster across your entire community.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div 
          style={{ boxShadow: '0 4px 20px rgba(139, 94, 60, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)' }}
          className="bg-white rounded-2xl border border-[#DFD3C7] shadow-xs overflow-hidden"
        >
          <div className="bg-[#FAF5EE] px-6 py-4 border-b border-[#EADBCE] flex items-center justify-between">
            <h2 className="font-extrabold text-sm text-[#2E2419] flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                ✉️
              </span>
              Partnership Inquiry Form
            </h2>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Direct Route to Leadership
            </span>
          </div>
          
          <div className="p-6 md:p-8">
            {isSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center font-bold text-sm leading-relaxed">
                ✨ Thank you! We'll be in touch within 2 business days.
              </div>
            ) : (
              <form action="/api/partnerships" method="POST" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#4A3E3D] block mb-1">Your Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      required
                      className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A3E3D] block mb-1">Company / Organization</label>
                    <input 
                      type="text" 
                      name="company" 
                      className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#4A3E3D] block mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      required
                      className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20"
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#4A3E3D] block mb-1">Type of Inquiry</label>
                    <select 
                      name="type" 
                      className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 font-bold"
                    >
                      <option>Pet Brand Partnership</option>
                      <option>Veterinary Clinic Licensing</option>
                      <option>Animal Shelter Integration</option>
                      <option>Lost Pet Network Partnership</option>
                      <option>Investment Inquiry</option>
                      <option>Press & Media</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#4A3E3D] block mb-1">Message</label>
                  <textarea 
                    name="message" 
                    required 
                    rows={4} 
                    className="w-full bg-[#FAF6F2] border border-[#E2D5C8] rounded-xl px-3.5 py-2.5 text-[#2E2419] text-sm focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 resize-none"
                    placeholder="Tell us about your organization and how we can collaborate..."
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#8B5E3C] hover:bg-[#734A2E] text-white py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-md cursor-pointer"
                >
                  Send Inquiry 🤝
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
