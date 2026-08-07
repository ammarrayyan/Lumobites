// Test pet sitting profile access matrix for signed-out, free signed-in, and pro signed-in users

function getProfileAccessState(reqEmail, isOwnerPro) {
  const isSignedIn = !!reqEmail;
  
  return {
    sitterPhotos: 'VISIBLE (Always public avatars)',
    sitterBios: isSignedIn ? 'UNBLURRED (Full Bio Text) ✅' : 'BLURRED (Gated) 🔒',
    reviewRatings: isSignedIn ? 'VISIBLE (Star Rating & Count) ✅' : 'LOCKED (Sign in required) 🔒',
    requestBookingButton: isSignedIn ? 'ENABLED ("Request Sitter") ✅' : 'GATED ("Sign in to view full profile & book") 🔒',
    clinicInquiryButton: isSignedIn ? 'ENABLED ("Inquire About Boarding") ✅' : 'GATED ("Sign in to Inquire") 🔒',
    daycareInquiryButton: isSignedIn ? 'ENABLED ("Inquire About Daycare") ✅' : 'GATED ("Sign in to Inquire") 🔒',
    aiSitterSearchUsage: isOwnerPro ? 'UNLIMITED PRO ACCESS 🚀' : 'LIMITED FREE TIER ACCESS (2 Lifetime Uses) 📊',
  };
}

console.log('=== TESTING PET SITTING ACCESS MATRIX ===');

const scenarios = [
  { name: 'Scenario A: Signed-Out User (Visitor)', reqEmail: '', isOwnerPro: false },
  { name: 'Scenario B: Free Signed-In User (e.g. ammar.rayyan12@gmail.com)', reqEmail: 'ammar.rayyan12@gmail.com', isOwnerPro: false },
  { name: 'Scenario C: Pro Paid Member', reqEmail: 'member@lumobites.com', isOwnerPro: true },
];

for (const s of scenarios) {
  console.log(`\n--- ${s.name} ---`);
  const access = getProfileAccessState(s.reqEmail, s.isOwnerPro);
  for (const [key, val] of Object.entries(access)) {
    console.log(`  ${key.padEnd(24)}: ${val}`);
  }
}
