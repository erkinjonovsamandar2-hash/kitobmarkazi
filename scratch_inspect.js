const fs = require('fs');
const path = require('path');

const dir = 'f:\\AppSheet Projects\\GIPHM';
const terms = ['60106735', '08-B0038410-BIZ', 'SME8002074', '8000005800', 'D25MTPCVE001713', '1916'];

function walk(currentDir) {
  const list = fs.readdirSync(currentDir);
  list.forEach(file => {
    const full = path.join(currentDir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        walk(full);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.gs')) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          terms.forEach(term => {
            if (content.includes(term)) {
              console.log(`Found term "${term}" in ${path.relative(dir, full)}`);
            }
          });
        } catch (e) {
          // ignore
        }
      }
    }
  });
}

walk(dir);
