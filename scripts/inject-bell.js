const fs = require('fs');
let code = fs.readFileSync('components/Navbar.tsx', 'utf8');

if (!code.includes('NotificationBell')) {
  code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport NotificationBell from './NotificationBell';");
}

// Find email state. Navbar already has lumo_pro_email and lumo_sitter_email logic
// Let's find where it defines the "Go PRO" button and add NotificationBell right before it or next to it.
// The user wants: `1. Add bell icon 🔔 next to Go PRO button`
// `3. Only show bell when user is logged in (lumo_pro_email or lumo_sitter_email in localStorage)`

// Navbar has `proEmail` state: `const [proEmail, setProEmail] = useState<string | null>(null);`
// and `sitterEmail` state.
// We can pass `proEmail || sitterEmail` to NotificationBell.

code = code.replace(
  /<div className=\"relative\">\s*<button\s*onClick=\{\(\) => setShowUpgradeMenu\(!showUpgradeMenu\)\}\s*className=\"bg-\[\#D97706\] hover:bg-\[\#B45309\] text-white text-xs font-bold px-4 py-1\.5 rounded-full \s*shadow-sm transition-colors flex items-center gap-1\"\s*>\s*Go PRO <Sparkles className=\"w-3 h-3\" \/>\s*<\/button>/g,
  `{(proEmail || sitterEmail) && <NotificationBell email={proEmail || sitterEmail || ''} />}
                <div className="relative">
                  <button
                    onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
                    className="bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1"
                  >
                    Go PRO <Sparkles className="w-3 h-3" />
                  </button>`
);

code = code.replace(
  /<div className=\"relative\">\s*<button\s*onClick=\{\(\) => setShowUpgradeMenu\(!showUpgradeMenu\)\}\s*className=\"bg-\[\#D97706\] hover:bg-\[\#B45309\] text-white text-\[11px\] font-bold px-3 py-1\.5 rounded-full \s*shadow-sm transition-colors flex items-center gap-1\"\s*>\s*Go PRO <Sparkles className=\"w-3 h-3\" \/>\s*<\/button>/g,
  `{(proEmail || sitterEmail) && <NotificationBell email={proEmail || sitterEmail || ''} />}
              <div className="relative">
                <button
                  onClick={() => setShowUpgradeMenu(!showUpgradeMenu)}
                  className="bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-colors flex items-center gap-1"
                >
                  Go PRO <Sparkles className="w-3 h-3" />
                </button>`
);

fs.writeFileSync('components/Navbar.tsx', code);
console.log('updated Navbar.tsx');
