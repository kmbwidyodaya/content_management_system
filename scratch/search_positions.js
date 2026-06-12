import fs from 'fs';

const content = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('positions')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
