const fs = require('fs');
const transcriptPath = 'C:/Users/gpjac/.gemini/antigravity/brain/8f76a54d-2cb1-4716-aac0-2a47eab4da56/.system_generated/logs/transcript_full.jsonl';
const readline = require('readline');

async function getStep(targetStep) {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let count = 0;
  for await (const line of rl) {
    if (count === targetStep) {
      const obj = JSON.parse(line);
      console.log('--- FULL USER PROMPT ---');
      console.log(obj.content);
      return;
    }
    count++;
  }
}
getStep(2041);

