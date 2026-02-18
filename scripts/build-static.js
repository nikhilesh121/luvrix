#!/usr/bin/env node
/**
 * Build Static Export Script
 * Temporarily removes getServerSideProps from pages for static export
 * Then restores them after build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const BACKUP_DIR = path.join(__dirname, '..', '.static-backup');

// Pages that have getServerSideProps for SEO
const PAGES_WITH_GSSP = [
  'index.js',
  'about.js',
  'contact.js',
  'categories.js',
  'leaderboard.js',
  'publishers.js',
  'giveaway-terms.js',
  'blog.js',
  'blog/[slug].js',
  'manga/index.js',
  'manga/[slug]/index.js',
  'giveaway/index.js',
  'giveaway/[slug].js',
  'policy/privacy.js',
  'policy/terms.js',
  'policy/disclaimer.js',
  'policy/dmca.js',
  'user/[username].js',
];

// Pages to completely remove for static export (they need server-side)
const PAGES_TO_REMOVE = [
  'sitemaps/[type].js',
  'sitemaps/index.js',
];

// Function to remove getServerSideProps - finds start and removes to end of function
function removeGetServerSideProps(content) {
  // Find the start of getServerSideProps
  const patterns = [
    /\/\/ SSR required for SEO[^\n]*\nexport async function getServerSideProps/,
    /\/\/ Server-side data fetching[^\n]*\nexport async function getServerSideProps/,
    /export async function getServerSideProps/,
  ];
  
  let startIndex = -1;
  for (const pattern of patterns) {
    const match = content.search(pattern);
    if (match !== -1 && (startIndex === -1 || match < startIndex)) {
      startIndex = match;
    }
  }
  
  if (startIndex === -1) return content;
  
  // Find the end of the function by counting braces
  let braceCount = 0;
  let endIndex = startIndex;
  let inFunction = false;
  
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  // Remove the function and any preceding comment line
  let removeStart = startIndex;
  // Check for preceding comment
  const beforeStart = content.substring(Math.max(0, startIndex - 100), startIndex);
  const commentMatch = beforeStart.match(/\n(\/\/[^\n]*\n)$/);
  if (commentMatch) {
    removeStart = startIndex - commentMatch[1].length;
  }
  
  return content.substring(0, removeStart) + content.substring(endIndex);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function backupAndModify() {
  console.log('📦 Backing up pages and removing getServerSideProps...\n');
  ensureDir(BACKUP_DIR);

  // Remove pages that can't be statically exported
  for (const pagePath of PAGES_TO_REMOVE) {
    const fullPath = path.join(PAGES_DIR, pagePath);
    const backupPath = path.join(BACKUP_DIR, pagePath);

    if (fs.existsSync(fullPath)) {
      ensureDir(path.dirname(backupPath));
      const content = fs.readFileSync(fullPath, 'utf8');
      fs.writeFileSync(backupPath, content);
      fs.unlinkSync(fullPath);
      console.log(`  ✓ Removed: ${pagePath}`);
    }
  }

  // Modify pages by removing getServerSideProps
  for (const pagePath of PAGES_WITH_GSSP) {
    const fullPath = path.join(PAGES_DIR, pagePath);
    const backupPath = path.join(BACKUP_DIR, pagePath);

    if (fs.existsSync(fullPath)) {
      // Backup original
      ensureDir(path.dirname(backupPath));
      const content = fs.readFileSync(fullPath, 'utf8');
      fs.writeFileSync(backupPath, content);

      // Remove getServerSideProps using brace-counting
      let modified = removeGetServerSideProps(content);
      
      fs.writeFileSync(fullPath, modified);
      console.log(`  ✓ Modified: ${pagePath}`);
    }
  }
}

function restore() {
  console.log('\n🔄 Restoring original pages...\n');

  // Restore removed pages
  for (const pagePath of PAGES_TO_REMOVE) {
    const fullPath = path.join(PAGES_DIR, pagePath);
    const backupPath = path.join(BACKUP_DIR, pagePath);

    if (fs.existsSync(backupPath)) {
      ensureDir(path.dirname(fullPath));
      const content = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(fullPath, content);
      console.log(`  ✓ Restored: ${pagePath}`);
    }
  }

  // Restore modified pages
  for (const pagePath of PAGES_WITH_GSSP) {
    const fullPath = path.join(PAGES_DIR, pagePath);
    const backupPath = path.join(BACKUP_DIR, pagePath);

    if (fs.existsSync(backupPath)) {
      const content = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(fullPath, content);
      console.log(`  ✓ Restored: ${pagePath}`);
    }
  }

  // Clean up backup directory
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
  console.log('\n✓ Backup cleaned up');
}

async function main() {
  console.log('🚀 Building Static Export for Hostinger\n');
  console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'https://api.luvrix.com');
  console.log('');

  try {
    // Step 1: Backup and modify pages
    backupAndModify();

    // Step 2: Run Next.js build with static export
    console.log('\n🔨 Running Next.js static build...\n');
    execSync('npx next build --no-lint', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        STATIC_EXPORT: 'true',
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.luvrix.com',
      },
    });

    console.log('\n✅ Static build complete!');
    console.log('📁 Output directory: ./out');
    console.log('\nUpload the contents of ./out to Hostinger public_html');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
  } finally {
    // Step 3: Always restore original pages
    restore();
  }
}

main();
