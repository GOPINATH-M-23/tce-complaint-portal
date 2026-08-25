import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./scratch/emoji_results.json', 'utf8'));

const fileMap = {};

data.forEach(item => {
  if (!fileMap[item.file]) {
    fileMap[item.file] = [];
  }
  fileMap[item.file].push({ line: item.line, matches: item.matches, text: item.text });
});

console.log(`Total files with emojis/symbols: ${Object.keys(fileMap).length}\n`);

for (const [file, items] of Object.entries(fileMap)) {
  console.log(`=== ${file} (${items.length} occurrences) ===`);
  items.forEach(i => {
    console.log(`  Line ${i.line}: [${i.matches.join(', ')}] ${i.text}`);
  });
  console.log('\n');
}
