import fs from 'fs';
import path from 'path';

function listAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      listAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const studentFiles = listAllFiles('./student/src').map(f => f.replace('student\\src\\', '').replace('student/src/', ''));
const adminFiles = listAllFiles('./admin/src').map(f => f.replace('admin\\src\\', '').replace('admin/src/', ''));
const rootFiles = listAllFiles('./src').map(f => f.replace('src\\', '').replace('src/', ''));

console.log('Student files:', studentFiles.length);
console.log('Admin files:', adminFiles.length);
console.log('Root files:', rootFiles.length);

// Compare contents of a file between student and root src
if (fs.existsSync('./student/src/pages/StudentDashboard.jsx') && fs.existsSync('./src/pages/student/StudentDashboard.jsx')) {
  const s = fs.readFileSync('./student/src/pages/StudentDashboard.jsx', 'utf8');
  const r = fs.readFileSync('./src/pages/student/StudentDashboard.jsx', 'utf8');
  console.log('StudentDashboard match?', s === r);
}
