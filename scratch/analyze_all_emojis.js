import fs from 'fs';
import path from 'path';

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        getFiles(name, files);
      }
    } else {
      if (name.endsWith('.jsx') || name.endsWith('.js') || name.endsWith('.html')) {
        files.push(name);
      }
    }
  }
  return files;
}

const allFiles = [...getFiles('./student/src'), ...getFiles('./admin/src'), ...getFiles('./src')];

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{2190}-\u{21FF}\u{2702}-\u{27B0}\u{2460}-\u{24FF}\u{25A0}-\u{25FF}]/gu;

const uiMap = {};

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for emojis or Unicode arrows like →, ←, ✓, ✕, ☀, ☽
    const hasUnicodeUI = line.match(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}]|→|←|✓|✕|☀|☽|↻/gu);
    if (hasUnicodeUI) {
      const normalizedPath = file.replace(/\\/g, '/');
      if (!uiMap[normalizedPath]) uiMap[normalizedPath] = [];
      uiMap[normalizedPath].push({ line: idx + 1, text: line.trim(), matches: Array.from(new Set(hasUnicodeUI)) });
    }
  });
});

console.log(JSON.stringify(uiMap, null, 2));
fs.writeFileSync('./scratch/ui_emoji_analysis.json', JSON.stringify(uiMap, null, 2));
