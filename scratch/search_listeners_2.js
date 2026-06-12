import fs from 'fs';

const files = ['src/App.jsx', 'src/components/Dashboard.jsx', 'src/components/Beranda.jsx', 'src/components/Login.jsx'];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Look for focus events, tab change events, or event listeners.
      // Exclude Tailwind classes like "focus:outline"
      if ((line.includes('visibilitychange') || line.includes('focus') || line.includes('addEventListener') || line.includes('reload')) 
          && !line.includes('focus:') && !line.includes('focus-within') && !line.includes('focus-visible')) {
        console.log(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
