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
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#4A3E3D] mb-4">
        Partnerships & Press
      </h1>
      <p className="text-gray-500 mb-12">
        We're always open to working with businesses and organizations 
        that share our passion for pet care.
      </p>

      {/* Partnership Types */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-bold text-[#4A3E3D]">We Partner With</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5">
            <h3 className="font-bold text-[#4A3E3D] mb-2">Pet Food Brands</h3>
            <p className="text-sm text-gray-500">
              Get featured in our AI food recommendations 
              reaching thousands of pet owners daily.
            </p>
          </div>
          <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5">
            <h3 className="font-bold text-[#4A3E3D] mb-2">Veterinary Clinics</h3>
            <p className="text-sm text-gray-500">
              License our AI pet food scanner and 
              lost pet matching technology for your practice.
            </p>
          </div>
          <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5">
            <h3 className="font-bold text-[#4A3E3D] mb-2">Animal Shelters</h3>
            <p className="text-sm text-gray-500">
              Integrate with our lost pet network to 
              help reunite more pets with their families.
            </p>
          </div>
          <div className="bg-[#FAF6F4] border border-[#E8DDD4] rounded-2xl p-5">
            <h3 className="font-bold text-[#4A3E3D] mb-2">Investors & Press</h3>
            <p className="text-sm text-gray-500">
              Interested in Lumo Bites' growth story? 
              We'd love to connect.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white border border-[#E8DDD4] rounded-2xl p-8">
        <h2 className="text-xl font-bold text-[#4A3E3D] mb-6">Get In Touch</h2>
        
        {isSuccess ? (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] p-4 rounded-xl text-center font-medium">
            Thank you! We'll be in touch within 2 business days.
          </div>
        ) : (
          <form action="/api/partnerships" method="POST" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#4A3E3D]">Name</label>
              <input 
                type="text" 
                name="name"
                required
                className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#4A3E3D]">Company</label>
              <input 
                type="text"
                name="company"
                className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C]"
                placeholder="Your company name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#4A3E3D]">Email</label>
              <input 
                type="email"
                name="email"
                required
                className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C]"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#4A3E3D]">Type of Inquiry</label>
              <select 
                name="type"
                className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-[#8B5E3C]"
              >
                <option>Pet Brand Partnership</option>
                <option>Veterinary Clinic Licensing</option>
                <option>Animal Shelter Integration</option>
                <option>Investment Inquiry</option>
                <option>Press & Media</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#4A3E3D]">Message</label>
              <textarea
                name="message"
                required
                rows={4}
                className="w-full mt-1 border border-[#E8DDD4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5E3C]"
                placeholder="Tell us about your interest..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#8B5E3C] text-white py-3 rounded-xl font-medium transition-colors hover:bg-[#734A2E]"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
