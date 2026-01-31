/**
 * Post-build script to copy dynamic route folders with Apache-safe names
 * Copies [slug], [chapter], [id] to _slug_, _chapter_, _id_
 * This fixes Apache .htaccess compatibility issues with bracket characters
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

const copyMappings = [
  { from: 'manga/[slug]/[chapter]', to: 'manga/_slug_/_chapter_' },
  { from: 'manga/[slug]', to: 'manga/_slug_', excludeSubfolders: ['[chapter]'] },
  { from: 'blog/[id]', to: 'blog/_id_' },
];

function copyFolderSync(src, dest, excludeSubfolders = []) {
  if (!fs.existsSync(src)) return false;
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (excludeSubfolders.includes(entry.name)) continue;
    
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  return true;
}

console.log('🔧 Fixing dynamic route folders for Apache compatibility...\n');

for (const mapping of copyMappings) {
  const fullFrom = path.join(outDir, mapping.from);
  const fullTo = path.join(outDir, mapping.to);
  
  if (copyFolderSync(fullFrom, fullTo, mapping.excludeSubfolders || [])) {
    console.log(`✓ Copied: ${mapping.from} → ${mapping.to}`);
  } else {
    console.log(`⚠ Folder not found: ${mapping.from}`);
  }
}

console.log('\n✅ Dynamic route folders fixed!');
console.log('📁 Upload the "out" folder to Hostinger');
