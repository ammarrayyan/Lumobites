const fs = require('fs');

const formatter = `
export function formatSitterName(fullName) {
  if (!fullName) return 'Sitter';
  const parts = fullName.trim().split(/\\s+/);
  if (parts.length === 1) return parts[0];
  return \`\${parts[0]} \${parts[parts.length - 1].charAt(0)}.\`;
}
`;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('formatSitterName')) {
    // Insert after imports
    const importMatch = content.match(/import .*?;(\r?\n\r?\n)?/g);
    if (importMatch) {
      const lastImportIndex = content.indexOf(importMatch[importMatch.length - 1]) + importMatch[importMatch.length - 1].length;
      content = content.slice(0, lastImportIndex) + formatter + content.slice(lastImportIndex);
    }
  }

  // Replace {sitter.name} with {formatSitterName(sitter.name)} in the JSX
  content = content.replace(/>\{sitter\.name\}</g, '>{formatSitterName(sitter.name)}<');
  content = content.replace(/alt=\{sitter\.name\}/g, 'alt={formatSitterName(sitter.name)}');
  content = content.replace(/\{sitter\.name\.charAt\(0\)\}/g, '{formatSitterName(sitter.name).charAt(0)}');
  
  content = content.replace(/Request \{selectedSitter\.name\}/g, 'Request {formatSitterName(selectedSitter.name)}');
  content = content.replace(/reply from \{selectedSitter\.name\}\./g, 'reply from {formatSitterName(selectedSitter.name)}.');
  
  content = content.replace(/alt=\{selectedSitterForReviews\.name\}/g, 'alt={formatSitterName(selectedSitterForReviews.name)}');
  content = content.replace(/\{selectedSitterForReviews\.name\.charAt\(0\)\}/g, '{formatSitterName(selectedSitterForReviews.name).charAt(0)}');
  content = content.replace(/>\{selectedSitterForReviews\.name\}</g, '>{formatSitterName(selectedSitterForReviews.name)}<');
  content = content.replace(/for \{selectedSitterForReviews\.name\}\./g, 'for {formatSitterName(selectedSitterForReviews.name)}.');

  // For owner requests
  content = content.replace(/>\{req\.sitter_name\}<\/div>/g, '>{[\'accepted\', \'completed\'].includes(req.status) ? req.sitter_name : formatSitterName(req.sitter_name)}</div>');
  content = content.replace(/alt=\{req\.sitter_name\}/g, 'alt={[\'accepted\', \'completed\'].includes(req.status) ? req.sitter_name : formatSitterName(req.sitter_name)}');
  content = content.replace(/\{req\.sitter_name\.charAt\(0\)\}/g, '{formatSitterName(req.sitter_name).charAt(0)}');

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + filePath);
}

processFile('app/petsitting/page.tsx');
