const fs = require('fs');
const path = require('path');

const files = [
  'app/account-deletion/page.tsx',
  'app/account/page.tsx',
  'app/affiliate/dashboard/page.tsx',
  'app/affiliate/page.tsx',
  'app/brand/[slug]/page.tsx',
  'app/chat/page.tsx',
  'app/city-board/[id]/page.tsx',
  'app/city-board/page.tsx',
  'app/explore/page.tsx',
  'app/ingredients/page.tsx',
  'app/lost-pets/[id]/page.tsx',
  'app/lost-pets/manage/page.tsx',
  'app/lost-pets/page.tsx',
  'app/lost-pets/post/page.tsx',
  'app/page.tsx',
  'app/petsitting/page.tsx',
  'app/petsitting/review/[sitterId]/page.tsx',
  'app/photo/page.tsx',
  'app/privacy/page.tsx',
  'app/recalls/page.tsx',
  'app/scan/page.tsx',
  'app/supplies/page.tsx',
  'app/terms/page.tsx',
  'app/twin/page.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove import
    content = content.replace(/import\s+Navbar\s+from\s+['"]@\/components\/Navbar['"];?\r?\n?/g, '');
    
    // Remove JSX element
    content = content.replace(/(\s*)<Navbar\s*\/>\r?\n?/g, '$1');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${file}`);
  } else {
    console.warn(`File not found: ${file}`);
  }
}
