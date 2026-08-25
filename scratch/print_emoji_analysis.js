import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./scratch/ui_emoji_analysis.json', 'utf8'));

for (const [file, items] of Object.entries(data)) {
  console.log(`FILE: ${file}`);
  items.forEach(i => {
    console.log(`  Line ${i.line}: [${i.matches.join(', ')}] -> ${i.text}`);
  });
  console.log('');
}
