const fs = require('fs');

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="c"></canvas>
<script>
async function run() {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  const results = {};

  const images = ['fase1_v3.webp', 'fase2_v3.webp', 'fase3_v3.webp'];
  for (const name of images) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = '../assets/puzzles/labirinto/' + name;
    });
    c.width = img.width;
    c.height = img.height;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    // Detect pedestals by looking for gray rectangular blocks
    // In these images, pedestals are square/rounded-square stone slabs:
    // They have distinctive slate-gray color: R ~ 140-180, G ~ 150-190, B ~ 160-205 (slightly cool bluish gray)
    const grayPixels = [];
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        // Pedestal gray: relatively neutral, bluish/cool gray, brightness 120-195
        if (maxDiff < 30 && r > 115 && r < 195 && g > 125 && g < 195 && b > 135 && b < 210) {
          grayPixels.push({ x, y, r, g, b });
        }
      }
    }

    // Cluster gray pixels to find pedestals
    // Grid 8x8 clustering
    const cellCounts = {};
    for (const p of grayPixels) {
      const cx = Math.floor(p.x / 8);
      const cy = Math.floor(p.y / 8);
      const k = cy * 128 + cx;
      cellCounts[k] = (cellCounts[k] || 0) + 1;
    }

    // Dense cells (more than 30 gray pixels per 64px cell)
    const denseCells = Object.keys(cellCounts).filter(k => cellCounts[k] >= 30).map(k => {
      const cy = Math.floor(Number(k) / 128);
      const cx = Number(k) % 128;
      return { cx, cy, x: cx * 8, y: cy * 8 };
    });

    // Group adjacent dense cells into clusters (pedestals)
    const clusters = [];
    const visited = new Set();
    for (const cell of denseCells) {
      const key = cell.cx + ',' + cell.cy;
      if (visited.has(key)) continue;
      const group = [];
      const queue = [cell];
      visited.add(key);
      while (queue.length > 0) {
        const curr = queue.shift();
        group.push(curr);
        for (const neighbor of denseCells) {
          const nkey = neighbor.cx + ',' + neighbor.cy;
          if (!visited.has(nkey) && Math.abs(neighbor.cx - curr.cx) <= 1 && Math.abs(neighbor.cy - curr.cy) <= 1) {
            visited.add(nkey);
            queue.push(neighbor);
          }
        }
      }
      if (group.length >= 8) { // Pedestals are ~70-90px wide, so ~8-12 cells minimum
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const g of group) {
          minX = Math.min(minX, g.x);
          maxX = Math.max(maxX, g.x + 8);
          minY = Math.min(minY, g.y);
          maxY = Math.max(maxY, g.y + 8);
        }
        clusters.push({
          minX, maxX, minY, maxY,
          width: maxX - minX,
          height: maxY - minY,
          centerX: (minX + maxX) / 2,
          centerY: (minY + maxY) / 2
        });
      }
    }

    results[name] = {
      width: img.width,
      height: img.height,
      pedestals: clusters
    };
  }
  window.__RESULTS__ = results;
  const div = document.createElement('div');
  div.id = 'res';
  div.textContent = JSON.stringify(results, null, 2);
  document.body.appendChild(div);
  console.log('RESULTS_READY');
}
run();
</script>
</body>
</html>
`;

fs.writeFileSync('scratch/analyze.html', html);
console.log('Wrote scratch/analyze.html');
