import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getFiles(name, files);
      }
    } else {
      if (name.endsWith('.jsx') || name.endsWith('.js') || name.endsWith('.html') || name.endsWith('.tsx') || name.endsWith('.ts')) {
        files.push(name);
      }
    }
  }
  return files;
}

const dirs = ['./student/src', './admin/src', './src'];
let results = [];

// Match non-ascii characters or specific unicode ranges
for (const dir of dirs) {
  const files = getFiles(dir);
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Find non-ascii characters excluding standard quotes/dashes if any
      const matches = line.match(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2190}-\u{21FF}\u{2702}-\u{27B0}\u{2460}-\u{24FF}\u{25A0}-\u{25FF}\u{2000}-\u{206F}]/gu);
      if (matches) {
        // Filter out normal spaces/punctuation
        const emojiMatches = matches.filter(m => m.charCodeAt(0) > 127 && m !== '—' && m !== '’' && m !== '…' && m !== '–' && m !== '“' && m !== '”');
        if (emojiMatches.length > 0) {
          results.push({
            file: filePath,
            line: index + 1,
            matches: Array.from(new Set(emojiMatches)),
            text: line.trim()
          });
        }
      }
    });
  }
}

fs.writeFileSync('./scratch/emoji_results.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} lines with potential UI symbols/emojis. Saved to scratch/emoji_results.json`);
