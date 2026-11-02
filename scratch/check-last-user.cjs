const fs = require('fs');
const transcriptPath = 'C:/Users/gpjac/.gemini/antigravity/brain/8f76a54d-2cb1-4716-aac0-2a47eab4da56/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  const obj = JSON.parse(lines[i]);
  if (obj.source === 'USER_EXPLICIT' || obj.type === 'USER_INPUT') {
    console.log(`Step ${i}:`);
    console.log(obj.content);
    if (obj.media) console.log('Media:', JSON.stringify(obj.media, null, 2));
    break;
  }
}

