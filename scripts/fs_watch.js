const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const LOG = path.resolve(__dirname, '../logs/fs_events.log');
const repoRoot = path.resolve(__dirname, '..');

function log(line) {
  const ts = new Date().toISOString();
  fs.appendFileSync(LOG, `[${ts}] ${line}\n`);
}

log('--- starting fs watcher ---');

// Recursive mtime snapshotter
let prev = new Map();
function snapshot() {
  const out = new Map();
  function walk(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const it of items) {
        const full = path.join(dir, it);
        try {
          const st = fs.statSync(full);
          if (st.isDirectory()) {
            // skip node_modules and .git to reduce noise
            if (full.includes('node_modules') || full.includes('.git') || full.includes('.vite')) continue;
            walk(full);
          } else {
            out.set(full, st.mtimeMs);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
  walk(repoRoot);
  return out;
}

function diffAndLog() {
  try {
    const cur = snapshot();
    for (const [file, mtime] of cur.entries()) {
      const prevM = prev.get(file);
      if (!prevM) {
        log(`NEW ${file}`);
      } else if (mtime !== prevM) {
        log(`MOD ${file}`);
      }
    }
    for (const file of prev.keys()) {
      if (!cur.has(file)) {
        log(`DEL ${file}`);
      }
    }
    prev = cur;
  } catch (e) {
    log('snapshot error: ' + e.toString());
  }
}

// initial
prev = snapshot();
setInterval(diffAndLog, 1000);

// lightweight native watchers on top-level directories
['src', 'public', 'scripts', '.'].forEach((d)=>{
  const dir = path.join(repoRoot, d);
  try {
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      const full = path.join(dir, filename);
      if (full.includes('node_modules') || full.includes('.git') || full.includes('.vite')) return;
      log(`watcher ${eventType} ${full}`);
    });
  } catch (e) {
    log(`watch setup failed for ${dir}: ${e}`);
  }
});

// periodic lsof snapshot for files under repo to find writer processes
setInterval(()=>{
  exec(`lsof +D ${repoRoot} 2>/dev/null | awk '{print $1, $2, $3, $9}' | sed 's/  */ /g' | head -n 200`, (err, out) => {
    if (err) return;
    if (!out.trim()) return;
    log('LSOF SNAPSHOT:\n' + out.trim());
  });
}, 5000);

// indicate alive
setInterval(()=>{ log('tick'); }, 15000);

console.log('fs watcher started, logging to', LOG);
