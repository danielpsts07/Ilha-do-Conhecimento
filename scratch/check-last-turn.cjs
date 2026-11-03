const fs = require('fs');
const transcriptPath = 'C:/Users/gpjac/.gemini/antigravity/brain/8f76a54d-2cb1-4716-aac0-2a47eab4da56/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
console.log('Total steps:', lines.length);
for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
  const obj = JSON.parse(lines[i]);
  console.log(`--- Step ${i} [${obj.type} - ${obj.source}] ---`);
  if (obj.content) console.log(obj.content.substring(0, 300));
  if (obj.media) console.log('Media:', JSON.stringify(obj.media));
}

