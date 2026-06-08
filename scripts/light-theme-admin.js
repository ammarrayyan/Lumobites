const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, '../components/admin'),
  path.join(__dirname, '../app/admin')
];

const replacements = [
  { regex: /bg-\[\#111\]/g, replacement: 'bg-[#FDFAF7]' }, // Main background
  { regex: /bg-\[\#1a1a1a\]/g, replacement: 'bg-white' }, // Card background
  { regex: /bg-\[\#222\]/g, replacement: 'bg-white' }, // Card background variant
  { regex: /bg-black\/50/g, replacement: 'bg-white' }, // Inputs background
  { regex: /bg-black\/20/g, replacement: 'bg-gray-100' }, // Table headers
  { regex: /bg-black\/10/g, replacement: 'bg-gray-50' },
  { regex: /bg-black/g, replacement: 'bg-white' }, // generic black backgrounds (except text-black)
  
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-gray-50' },
  { regex: /hover:bg-white\/10/g, replacement: 'hover:bg-gray-100' },
  { regex: /hover:bg-white\/20/g, replacement: 'hover:bg-gray-200' },
  
  { regex: /bg-white\/5/g, replacement: 'bg-gray-50' },
  { regex: /bg-white\/10/g, replacement: 'bg-gray-100' },
  { regex: /bg-white\/20/g, replacement: 'bg-gray-200' },
  
  { regex: /border-white\/5/g, replacement: 'border-gray-200' },
  { regex: /border-white\/10/g, replacement: 'border-gray-200' },
  { regex: /border-white\/20/g, replacement: 'border-gray-300' },
  { regex: /border-white\/30/g, replacement: 'border-gray-300' },
  
  { regex: /text-white\/40/g, replacement: 'text-gray-500' },
  { regex: /text-white\/50/g, replacement: 'text-gray-500' },
  { regex: /text-white\/60/g, replacement: 'text-gray-500' },
  { regex: /text-white\/70/g, replacement: 'text-[#555555]' },
  { regex: /text-white\/80/g, replacement: 'text-[#555555]' },
  
  { regex: /text-white/g, replacement: 'text-[#191919]' },
  
  { regex: /text-blue-400/g, replacement: 'text-blue-600' },
  { regex: /text-green-400/g, replacement: 'text-green-600' },
  { regex: /text-amber-400/g, replacement: 'text-amber-600' },
  { regex: /text-red-400/g, replacement: 'text-red-600' },
  { regex: /text-orange-400/g, replacement: 'text-orange-600' },
  { regex: /text-emerald-400/g, replacement: 'text-emerald-600' },
  { regex: /text-purple-400/g, replacement: 'text-purple-600' },
  { regex: /text-pink-400/g, replacement: 'text-pink-600' },
  { regex: /text-indigo-400/g, replacement: 'text-indigo-600' },
  { regex: /border-white/g, replacement: 'border-gray-200' },
  
  // Specific fixes
  { regex: /text-\[\#c2e59c\]/g, replacement: 'text-emerald-700' }, // Light green on dark -> darker green on light
  { regex: /text-\[\#64b3f4\]/g, replacement: 'text-blue-600' }, // Light blue -> darker blue
  { regex: /from-\[\#c2e59c\]/g, replacement: 'from-[#c2e59c]' }, // gradients are usually ok, but text inside should be black, which it usually is
  
  { regex: /bg-\[\#1a1a1a\]/g, replacement: 'bg-white' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix bg-black that might match text-black
      // Actually bg-black is matched specifically above
      
      let newContent = content;
      for (const { regex, replacement } of replacements) {
        newContent = newContent.replace(regex, replacement);
      }
      
      // Fix potential text-[#191919]/70 invalid classes that might have been created
      newContent = newContent.replace(/text-\[\#191919\]\/(\d+)/g, 'text-gray-500');
      
      // Fix text-black since background is now white
      // Actually if it was text-black on a gradient, it's still fine.
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of directories) {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
}
