const fs = require('fs');
const crypto = require('crypto');

const files = ['README.md', 'index.html', 'script.js', 'style.css'];
const index = files.map(path => {
  const content = fs.readFileSync(path, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return { path, hash, content };
});

fs.mkdirSync('.index', { recursive: true });
fs.writeFileSync('.index/code-index.json', JSON.stringify({version:1, generated:new Date().toISOString(), files:index}, null, 2));
console.log('Wrote .index/code-index.json with', index.length, 'files');
