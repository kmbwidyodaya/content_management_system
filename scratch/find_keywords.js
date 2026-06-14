import fs from 'fs';

const content = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
const lines = content.split('\n');

const keywords = ['isMemberModalOpen', 'isEditMemberModalOpen', 'change_pw', 'handleAddMember', 'handleEditMember'];

keywords.forEach(keyword => {
  console.log(`=== Matches for "${keyword}" ===`);
  lines.forEach((line, idx) => {
    if (line.includes(keyword)) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
});
