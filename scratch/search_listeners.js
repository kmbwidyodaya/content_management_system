import fs from 'fs';

const files = ['src/App.jsx', 'src/components/Dashboard.jsx', 'src/components/Beranda.jsx', 'src/components/Login.jsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('visibilitychange') || line.includes('focus') || line.includes('addEventListener') || line.includes('window.location.reload')) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
