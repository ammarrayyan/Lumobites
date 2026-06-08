const fs = require('fs');
let code = fs.readFileSync('app/petsitting/page.tsx', 'utf8');

// 1. Import ChatModal
if (!code.includes('ChatModal')) {
  code = code.replace(/(import Navbar from '@\/components\/Navbar';)/, "$1\nimport ChatModal from '@/components/ChatModal';");
}

// 2. Add state
if (!code.includes('chatModalOpen')) {
  code = code.replace(/const \[ownerRequests, setOwnerRequests\] = useState<any\[\]>\(\[\]\);/, "const [ownerRequests, setOwnerRequests] = useState<any[]>([]);\n  const [chatModalOpen, setChatModalOpen] = useState(false);\n  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);\n  const [activeChatRole, setActiveChatRole] = useState<'owner'|'sitter'>('owner');");
}

// 3. Update owner dashboard 'Contact Info Shared' to Message Sitter
code = code.replace(/<p className=\"font-bold text-\\[#3B2410\\] mb-1\">dY\?_ Contact Info Shared<\/p>[\s\S]*?<p className=\"text-\\[#8B7E7D\\] text-\\[10px\\] mt-1\">Contact details visible while booking is active<\/p>/, 
  `<p className="font-bold text-[#3B2410] mb-1">💬 In-App Messaging</p>
   <p className="text-gray-600 mb-2">You can now message your sitter directly on Lumo Bites.</p>
   <button onClick={() => {
     setActiveChatBooking(req);
     setActiveChatRole('owner');
     setChatModalOpen(true);
   }} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-colors cursor-pointer">💬 Message Sitter</button>`
);

// 4. Update sitter dashboard Contact Info Shared to Message Owner
code = code.replace(/<p className=\"font-bold text-\\[#3B2410\\] mb-1\">dY\?_ Owner Contact Info<\/p>[\s\S]*?<p className=\"text-\\[#8B7E7D\\] text-\\[10px\\] mt-1\">Contact details visible while booking is active<\/p>/,
  `<p className="font-bold text-[#3B2410] mb-1">💬 In-App Messaging</p>
   <p className="text-gray-600 mb-2">You can now message the owner directly on Lumo Bites.</p>
   <button onClick={() => {
     setActiveChatBooking(req);
     setActiveChatRole('sitter');
     setChatModalOpen(true);
   }} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-colors cursor-pointer">💬 Message Owner</button>`
);

// 5. Add ChatModal at the end
if (!code.includes('<ChatModal')) {
  code = code.replace(/(<\/div>\s*<\/div>\s*<\/main>\s*<\/div>\s*)$/m, 
    `      <ChatModal 
        isOpen={chatModalOpen} 
        onClose={() => { setChatModalOpen(false); setActiveChatBooking(null); }} 
        bookingId={activeChatBooking?.id || ''} 
        currentUserEmail={activeChatRole === 'owner' ? email : (sitterEmail || '')}
        otherUserName={activeChatRole === 'owner' ? formatSitterName(activeChatBooking?.sitter_name) : (activeChatBooking?.owner_name || 'Owner')}
        bookingDetails={\`Booking #\${activeChatBooking?.id?.substring(0, 6) || ''} · \${activeChatBooking?.pet_name || ''} \${activeChatBooking?.pet_type === 'cat' ? '🐱' : '🐶'}\`}
      />\n$1`);
}

fs.writeFileSync('app/petsitting/page.tsx', code);
console.log('updated');
