const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf8');

if (!code.includes('PushManager')) {
  code = code.replace(/import FloatingQRCode from \"@\/components\/FloatingQRCode\";/, "import FloatingQRCode from \"@/components/FloatingQRCode\";\nimport PushManager from \"@/components/PushManager\";");
}

code = code.replace(/<PwaRegister \/>/g, "<PwaRegister />\n        <PushManager />");

fs.writeFileSync('app/layout.tsx', code);
console.log('updated app/layout.tsx');
