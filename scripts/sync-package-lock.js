// sync-package-lock.js
const { readFileSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');

// 1️⃣ Get the exact installed top‑level versions from node_modules
const installed = JSON.parse(execSync('npm list --depth=0 --json').toString());

// 2️⃣ Read current package.json
const pkgPath = 'package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

// Helper to merge & pin exact versions
function mergeAndPin(depType) {
  if (!pkg[depType] && !installed[depType]) return;
  pkg[depType] = pkg[depType] || {};

  if (installed[depType]) {
    Object.keys(installed[depType]).forEach((pkgName) => {
      const version = installed[depType][pkgName]?.version;
      if (version) {
        pkg[depType][pkgName] = version; // exact version, e.g. "1.2.3"
      }
    });
  }
}

mergeAndPin('dependencies');
mergeAndPin('devDependencies');
// Add 'optionalDependencies' if needed

// 3️⃣ Write back package.json (with 2‑space indentation)
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated – exact versions pinned, missing entries added.');

// 4️⃣ Regenerate package-lock.json WITHOUT touching node_modules
console.log('🔄 Regenerating package-lock.json...');
execSync('npm install --package-lock-only', { stdio: 'inherit' });
console.log('✅ package-lock.json is now consistent with package.json & node_modules.');