const fs = require('fs');

const formatter = `
export function formatSitterName(fullName: string | null | undefined): string {
  if (!fullName) return 'Sitter';
  const parts = fullName.trim().split(/\\s+/);
  if (parts.length === 1) return parts[0];
  return \`\${parts[0]} \${parts[parts.length - 1].charAt(0)}.\`;
}
`;

let code = fs.readFileSync('lib/email-template.ts', 'utf8');
if (!code.includes('formatSitterName')) {
  fs.writeFileSync('lib/email-template.ts', code + '\n' + formatter);
}

// Now process API routes
const paths = [
  'app/api/petsitting/request/route.ts',
  'app/api/petsitting/request/accept/route.ts',
  'app/api/petsitting/request/decline/route.ts',
  'app/api/petsitting/request/cancel/route.ts',
  'app/api/petsitting/request/complete/route.ts',
  'app/api/petsitting/request/confirm-completed/route.ts',
  'app/api/petsitting/request/report-no-show/route.ts',
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  let text = fs.readFileSync(p, 'utf8');
  if (!text.includes('formatSitterName')) {
    text = text.replace(/import \{ brandedEmail, emailStyles \} from '@\/lib\/email-template';/, "import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';");
    text = text.replace(/import \{ emailStyles, brandedEmail \} from '@\/lib\/email-template';/, "import { brandedEmail, emailStyles, formatSitterName } from '@/lib/email-template';");
    
    // Replace sitter?.name or sitter.name strings in the files, EXCEPT in accept/route.ts's contact info box.
    // Let's do it carefully.
    
    if (p.includes('accept/route.ts')) {
       // user said "After booking accepted — owner sees full name in contact details ✅"
       // but the subject/intro should be formatted.
       text = text.replace(/const sitterNameStr = sitter\?\.name \|\| 'A local sitter';/, "const fullSitterNameStr = sitter?.name || 'A local sitter';\n    const sitterNameStr = formatSitterName(sitter?.name);");
       text = text.replace(/<strong>Sitter:<\/strong> \$\{sitterNameStr\}/, "<strong>Sitter:</strong> ${fullSitterNameStr}");
    } else if (p.includes('decline/route.ts')) {
       text = text.replace(/const sitterNameStr = sitter\?\.name \|\| 'The sitter';/, "const sitterNameStr = formatSitterName(sitter?.name);");
    } else if (p.includes('cancel/route.ts')) {
       text = text.replace(/const sitterName = reqRow\.sitters\?\.name \|\| 'Sitter';/, "const sitterName = formatSitterName(reqRow.sitters?.name);");
       text = text.replace(/const sitterName = reqRow\.sitters\?\.name \|\| 'Your sitter';/, "const sitterName = formatSitterName(reqRow.sitters?.name);");
    } else if (p.includes('complete/route.ts')) {
       text = text.replace(/const sitterName = sitter\?\.name \|\| 'your sitter';/, "const sitterName = formatSitterName(sitter?.name);");
    } else if (p.includes('confirm-completed/route.ts') || p.includes('report-no-show/route.ts')) {
       text = text.replace(/const sitterName = reqRow\.sitters\?\.name \|\| 'your sitter';/, "const sitterName = formatSitterName(reqRow.sitters?.name);");
    } else if (p.endsWith('request/route.ts')) {
       text = text.replace(/Hi <strong>\$\{sitter\.name\}<\/strong>/, "Hi <strong>${formatSitterName(sitter.name)}</strong>");
    }
    
    fs.writeFileSync(p, text);
    console.log('Processed ' + p);
  }
}
