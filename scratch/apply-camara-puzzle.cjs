const fs = require('fs');

let code = fs.readFileSync('js/labirinto-puzzle.js', 'utf8');

// 1. Header and SCENARIOS
code = code.replace(
  '/* Labirinto das runas: três cruzamentos (1024×434 _v3), câmara (1376×768) e portal; contrato onExit preservado. */',
  '/* Labirinto das runas: três cruzamentos (1024×434 _v3), câmara (1024×434) e portal; contrato onExit preservado. */'
);

code = code.replace(
  "    base + 'fase3_v3.webp',\r\n    base + 'camara_chave_bg.jpg'",
  "    base + 'fase3_v3.webp',\r\n    'assets/puzzles/chave/cena-chave.webp'"
);
// In case LF only
code = code.replace(
  "    base + 'fase3_v3.webp',\n    base + 'camara_chave_bg.jpg'",
  "    base + 'fase3_v3.webp',\n    'assets/puzzles/chave/cena-chave.webp'"
);

// 2. Chamber data normalization in prepare(input)
const oldCamaraData = `        camara: {
          ...c,
          pedestal: { ...c.pedestal, altura: cfg.PEDESTAL_H_CAMARA },
          chave: {
            ...c.chave,
            centro: [c.pedestal.pe[0], c.pedestal.pe[1] - cfg.PEDESTAL_H_CAMARA - 8 - c.chave.altura / 2]
          }
        }`;
const newCamaraData = `        camara: {
          ...c,
          pedestal: c.pedestal || { pe: [512, 240], altura: 0, raio: 0 },
          chave: {
            ...c.chave,
            centro: c.chave?.centro || [512, 218.2]
          }
        }`;
code = code.replace(oldCamaraData.replace(/\r\n/g, '\n'), newCamaraData);
code = code.replace(oldCamaraData.replace(/\n/g, '\r\n'), newCamaraData.replace(/\n/g, '\r\n'));

// 3. Preload 1x and 2x in prepare
const oldArtLoads = `      [art.hero, art.pedestal, art.key] = await Promise.all([
        image(\`assets/\${HERO_SHEET.src}\`),
        image(base + 'pedestal_pedra.png'),
        image('assets/hud/chave_logica.png')
      ]);`;
const newArtLoads = `      [art.hero, art.pedestal, art.key, art.bgCamara1x, art.bgCamara2x] = await Promise.all([
        image(\`assets/\${HERO_SHEET.src}\`),
        image(base + 'pedestal_pedra.png'),
        image('assets/hud/chave_logica.png'),
        image('assets/puzzles/chave/cena-chave.webp'),
        image('assets/puzzles/chave/cena-chave-2x.webp')
      ]);`;
code = code.replace(oldArtLoads.replace(/\r\n/g, '\n'), newArtLoads);
code = code.replace(oldArtLoads.replace(/\n/g, '\r\n'), newArtLoads.replace(/\n/g, '\r\n'));

// 4. Surface setup loop in prepare
const oldSurfaceLoop = `      for (let n = 0; n < 4; n++) {
        const chamber = n === 3;
        const bg = await image(SCENARIOS[n]);
        const mask = grades.getMask(n);
        if (!mask) throw Error(\`Grade \${n + 1} ausente: impossível navegar sem colisão.\`);

        const gInfo = grades.getInfo ? grades.getInfo(n) : { cols: chamber ? 172 : 128, rows: chamber ? 96 : 55, cell: 8 };
        const W = chamber ? 1376 : 1024;
        const H = chamber ? 768 : 434;

        // Overlay de depuração gerado via createImageData/putImageData (seguro em file://)
        const overlay = document.createElement('canvas'); overlay.width = gInfo.cols; overlay.height = gInfo.rows;
        const oc = overlay.getContext('2d'), imgData = oc.createImageData(gInfo.cols, gInfo.rows);
        for (let i = 0; i < mask.length; i++) {
          imgData.data[i * 4] = 0; imgData.data[i * 4 + 1] = 255; imgData.data[i * 4 + 2] = 0; imgData.data[i * 4 + 3] = mask[i] ? 75 : 0;
        }
        oc.putImageData(imgData, 0, 0);

        const config = chamber ? data.camara : data.fases[n];
        const spawn = config.spawn;
        const exits = chamber ? [] : config.saidas.map(e => ({ id: e.id, zone: e.zona, x: e.pe[0], y: e.pe[1], arco: e.arco }));
        const obstacle = chamber ? { x: config.pedestal.pe[0], y: config.pedestal.pe[1], r: config.pedestal.raio } : null;
        const field = L.field(mask, gInfo.cols, gInfo.rows, gInfo.cell, m.footW, m.footH, obstacle, LABIRINTO_CONFIG.CORNER_NUDGE);
        const nav = L.grid(field, gInfo.cell, chamber ? 2 : 0);
        const zones = chamber ? [config.soleira] : exits.map(e => e.zone);
        const failures = L.geometryTest(nav, spawn, zones, obstacle), label = chamber ? 'Câmara' : \`Fase \${n + 1}\`;
        if (chamber) {
          const path = L.path(nav, spawn[0], spawn[1], config.alvo[0], config.alvo[1]), end = path[path.length - 1];
          if (!end || Math.hypot(end.x - config.alvo[0], end.y - config.alvo[1]) > 1) failures.push('alvo final do portal sem acesso');
        }
        console[failures.length ? 'error' : 'info'](\`[Labirinto] \${label}: \${failures.join('; ') || 'spawn, cobertura e BFS OK'}\`);
        if (failures.length) throw Error(\`\${label}: \${failures.join('; ')}\`);
        surfaces[n] = {
          bg, overlay, field, nav, spawn, exits, w: W, h: H,
          safeXMin: W * 0.12, safeXMax: W * 0.88, safeW: W * 0.76
        };
      }
      console.info('[Labirinto] Pés 8×4; grade 8 px; fases 1–3 em 1024×434 (cover com zona segura); câmara em 1376×768.');`;

const newSurfaceLoop = `      for (let n = 0; n < 4; n++) {
        const chamber = n === 3;
        const bg = chamber ? (art.bgCamara1x || await image(SCENARIOS[n])) : await image(SCENARIOS[n]);
        const mask = grades.getMask(n);
        if (!mask) throw Error(\`Grade \${n + 1} ausente: impossível navegar sem colisão.\`);

        const gInfo = grades.getInfo ? grades.getInfo(n) : { cols: chamber ? 256 : 128, rows: chamber ? 109 : 55, cell: chamber ? 4 : 8 };
        const W = gInfo.width || 1024;
        const H = gInfo.height || 434;

        // Overlay de depuração gerado via createImageData/putImageData (seguro em file://)
        const overlay = document.createElement('canvas'); overlay.width = gInfo.cols; overlay.height = gInfo.rows;
        const oc = overlay.getContext('2d'), imgData = oc.createImageData(gInfo.cols, gInfo.rows);
        for (let i = 0; i < mask.length; i++) {
          imgData.data[i * 4] = 0; imgData.data[i * 4 + 1] = 255; imgData.data[i * 4 + 2] = 0; imgData.data[i * 4 + 3] = mask[i] ? 75 : 0;
        }
        oc.putImageData(imgData, 0, 0);

        const config = chamber ? data.camara : data.fases[n];
        const spawn = config.spawn;
        const exits = chamber ? [] : config.saidas.map(e => ({ id: e.id, zone: e.zona, x: e.pe[0], y: e.pe[1], arco: e.arco }));
        const obstacle = null;
        const field = L.field(mask, gInfo.cols, gInfo.rows, gInfo.cell, m.footW, m.footH, obstacle, LABIRINTO_CONFIG.CORNER_NUDGE);
        const nav = L.grid(field, gInfo.cell, 0);
        const zones = chamber ? [config.soleira] : exits.map(e => e.zone);
        const failures = L.geometryTest(nav, spawn, zones, obstacle), label = chamber ? 'Câmara' : \`Fase \${n + 1}\`;
        if (chamber) {
          const path = L.path(nav, spawn[0], spawn[1], config.alvo[0], config.alvo[1]), end = path[path.length - 1];
          if (!end || Math.hypot(end.x - config.alvo[0], end.y - config.alvo[1]) > 2) failures.push('alvo final do portal sem acesso');
        }
        console[failures.length ? 'error' : 'info'](\`[Labirinto] \${label}: \${failures.join('; ') || 'spawn, cobertura e BFS OK'}\`);
        if (failures.length) throw Error(\`\${label}: \${failures.join('; ')}\`);
        surfaces[n] = {
          bg, overlay, field, nav, spawn, exits, w: W, h: H,
          safeXMin: chamber ? W * 0.21 : W * 0.12,
          safeXMax: chamber ? W * 0.79 : W * 0.88,
          safeW: chamber ? W * 0.58 : W * 0.76,
          safeH: chamber ? H * 0.88 : H,
          safeYMin: chamber ? H * 0.06 : 0,
          safeYMax: chamber ? H * 0.94 : H
        };
      }
      console.info('[Labirinto] Pés 8×4; grade 8/4 px; cenários em 1024×434 (cover com zona segura); câmara com chave flutuante.');`;
code = code.replace(oldSurfaceLoop.replace(/\r\n/g, '\n'), newSurfaceLoop);
code = code.replace(oldSurfaceLoop.replace(/\n/g, '\r\n'), newSurfaceLoop.replace(/\n/g, '\r\n'));

// 5. canTake()
const oldCanTake = `function canTake() { return state === 'CAMARA_ANDAR' && !claimed && Math.hypot(hero.x - c.pedestal.pe[0], hero.y - c.pedestal.pe[1]) <= c.interacao; }`;
const newCanTake = `function canTake() {
      const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
      return state === 'CAMARA_ANDAR' && !claimed && Math.hypot(hero.x - discX, hero.y - discY) <= (c.interacao || 39);
    }`;
code = code.replace(oldCanTake, newCanTake);

// 6. resize()
const oldResizeLogic = `      const curF = surfaces[phase] || surfaces[0];
      const W = curF.w, H = curF.h;
      const screenAR = canvas.width / canvas.height;
      const imageAR = W / H;
      const safeAR = curF.safeW / H;

      if (screenAR >= safeAR) {
        // Tela 16:9 até ultrawide: cover total (corte horizontal nos lados até a zona segura, ou corte vertical em ultrawide)
        s = Math.max(canvas.width / W, canvas.height / H);
      } else {
        // Telas mais estreitas que 16:9 (16:10, 4:3): limita a escala para caber toda a zona segura
        s = canvas.width / curF.safeW;
      }
      offsetX = (canvas.width - W * s) / 2;
      offsetY = (canvas.height - H * s) / 2;`;

const newResizeLogic = `      const curF = surfaces[phase] || surfaces[0];
      const W = curF.w, H = curF.h;
      const coverScale = Math.max(canvas.width / W, canvas.height / H);
      const maxScaleSafe = Math.min(canvas.width / curF.safeW, canvas.height / (curF.safeH || H));
      s = Math.min(coverScale, maxScaleSafe);

      offsetX = (canvas.width - W * s) / 2;
      offsetY = (canvas.height - H * s) / 2;`;
code = code.replace(oldResizeLogic.replace(/\r\n/g, '\n'), newResizeLogic);
code = code.replace(oldResizeLogic.replace(/\n/g, '\r\n'), newResizeLogic.replace(/\n/g, '\r\n'));

// controls[3] in resize()
const oldControls3 = `      if (phase === 3) {
        controls[3].style.left = \`\${Math.round((offsetX + c.chave.centro[0] * s) / dpr)}px\`;
        controls[3].style.transform = 'translateX(-50%)';
        controls[3].style.top = \`\${Math.round((offsetY + (c.chave.centro[1] - c.chave.altura / 2 - 52) * s) / dpr)}px\`;
        controls[3].style.width = '210px';
      }`;
const newControls3 = `      if (phase === 3) {
        controls[3].style.left = \`\${Math.round((offsetX + c.chave.centro[0] * s) / dpr)}px\`;
        controls[3].style.transform = 'translateX(-50%)';
        controls[3].style.top = \`\${Math.round((offsetY + (c.chave.centro[1] - c.chave.altura / 2 - 44) * s) / dpr)}px\`;
        controls[3].style.width = '210px';
      }`;
code = code.replace(oldControls3.replace(/\r\n/g, '\n'), newControls3);
code = code.replace(oldControls3.replace(/\n/g, '\r\n'), newControls3.replace(/\n/g, '\r\n'));

// 7. down(event)
const oldDown = `      if (state === 'CAMARA_ANDAR' && Math.abs(x - c.chave.centro[0]) <= 45 && Math.abs(y - c.chave.centro[1]) <= c.chave.altura / 2 + 8) {
        collect(); return;
      }`;
const newDown = `      if (state === 'CAMARA_ANDAR') {
        const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
        const keyX = c.chave.centro[0], keyY = c.chave.centro[1];
        if (Math.hypot(x - discX, y - discY) <= (c.interacao || 39) ||
            (Math.abs(x - keyX) <= 45 && Math.abs(y - keyY) <= c.chave.altura / 2 + 10)) {
          collect(); return;
        }
      }`;
code = code.replace(oldDown.replace(/\r\n/g, '\n'), newDown);
code = code.replace(oldDown.replace(/\n/g, '\r\n'), newDown.replace(/\n/g, '\r\n'));

// 8. walk(dt) auto-collect when entering disc
const oldWalkExit = `      if (state === 'ANDAR') for (let i = 0; i < f.exits.length; i++) {
        if (L.hit(hero, f.exits[i].zone, m.footW, m.footH)) { choose(i); break; }
      }`;
const newWalkExit = `      if (state === 'ANDAR') for (let i = 0; i < f.exits.length; i++) {
        if (L.hit(hero, f.exits[i].zone, m.footW, m.footH)) { choose(i); break; }
      }
      if (state === 'CAMARA_ANDAR' && canTake()) {
        collect();
      }`;
code = code.replace(oldWalkExit.replace(/\r\n/g, '\n'), newWalkExit);
code = code.replace(oldWalkExit.replace(/\n/g, '\r\n'), newWalkExit.replace(/\n/g, '\r\n'));

// 9. keyArt() and portalArt()
const oldKeyAndPortal = `    function keyArt() {
      if (claimed && state !== 'PEGAR_CHAVE') return;
      const t = state === 'PEGAR_CHAVE' ? Math.min(1, elapsed / .8) : 0;
      const x = c.chave.centro[0];
      const y = c.chave.centro[1] + (calm ? 0 : Math.sin(time * 2.2) * c.chave.flutuacao) - 48 * t;
      const height = c.chave.altura;
      const width = height * (art.key?.naturalWidth || 229) / (art.key?.naturalHeight || 482);
      const size = 140 + 80 * t;
      ctx.globalAlpha = (1 - t) * (calm ? .35 : .35 + .1 * Math.sin(time * 2.2));
      ctx.drawImage(art.keyGlow, x - size / 2, y - size / 2, size, size);
      ctx.globalAlpha = 1 - t;
      if (art.key) ctx.drawImage(art.key, x - width / 2, y - height / 2, width, height);
      else { ctx.fillStyle = '#4ade80'; ctx.fillRect(x - 8, y - 32, 16, 64); ctx.fillRect(x, y + 20, 22, 8); }
      ctx.globalAlpha = 1;
    }

    function portalArt() {
      const r = c.portal.raio, x = c.portal.centro[0], y = c.portal.centro[1];
      ctx.globalAlpha = claimed ? (calm ? .55 : .55 + .1 * Math.sin(time * 3)) : .16;
      ctx.drawImage(art.portalGlow, x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }`;

const newKeyAndPortal = `    function keyArt() {
      if (claimed && state !== 'PEGAR_CHAVE') return;
      const t = state === 'PEGAR_CHAVE' ? Math.min(1, elapsed / .8) : 0;
      const x = c.chave.centro[0];
      const osc = calm ? 0 : Math.sin(time * 2.618) * (c.chave.flutuacao || 5.2);
      const y = c.chave.centro[1] + osc - 48 * t;
      const height = c.chave.altura || 61;
      const width = height * (art.key?.naturalWidth || 229) / (art.key?.naturalHeight || 482);
      const size = 130 + 70 * t;

      // Sombra projetada no chão da vaga central (elipse suave pulsando em ritmo inverso à flutuação)
      const discX = c.disco ? c.disco[0] : 512;
      const discY = c.disco ? c.disco[1] : 239.6;
      const shadowFactor = calm ? 0 : Math.sin(time * 2.618);
      const shadowScale = 1 - 0.08 * shadowFactor;
      const shadowAlpha = Math.max(0, 0.28 * (1 - 0.15 * shadowFactor) * (1 - t));
      ctx.save();
      ctx.fillStyle = \`rgba(0,0,0,\${shadowAlpha})\`;
      ctx.beginPath();
      ctx.ellipse(discX, discY, 20.3 * shadowScale, 7.0 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Brilho suave ao redor da chave
      ctx.globalAlpha = (1 - t) * (calm ? .35 : .35 + .1 * Math.sin(time * 2.618));
      ctx.drawImage(art.keyGlow, x - size / 2, y - size / 2, size, size);
      ctx.globalAlpha = 1 - t;

      // Chave verde de trevo
      if (art.key) ctx.drawImage(art.key, x - width / 2, y - height / 2, width, height);
      else { ctx.fillStyle = '#4ade80'; ctx.fillRect(x - 8, y - 32, 16, 64); ctx.fillRect(x, y + 20, 22, 8); }
      ctx.globalAlpha = 1;
    }

    function portalArt() {
      const r = c.portal.raio, x = c.portal.centro[0], y = c.portal.centro[1];
      ctx.globalAlpha = claimed ? (calm ? .55 : .55 + .1 * Math.sin(time * 3)) : (calm ? .20 : .20 + .06 * Math.sin(time * 2));
      ctx.drawImage(art.portalGlow, x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }`;
code = code.replace(oldKeyAndPortal.replace(/\r\n/g, '\n'), newKeyAndPortal);
code = code.replace(oldKeyAndPortal.replace(/\n/g, '\r\n'), newKeyAndPortal.replace(/\n/g, '\r\n'));

// 10. draw() background and stage
const oldDrawSetup = `    function draw() {
      const W = f.w, H = f.h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Preenchimento de fundo borrado e escurecido (nunca faixas pretas ou vazias)
      if (f.bg && (offsetY > 0 || offsetX > 0)) {
        ctx.save();
        ctx.filter = 'blur(16px) brightness(0.4)';
        // Desenha a cena cobrindo todo o canvas atrás
        const coverScale = Math.max(canvas.width / W, canvas.height / H);
        const bgW = W * coverScale, bgH = H * coverScale;
        ctx.drawImage(f.bg, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#101c19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Palco centralizado com escala única
      ctx.setTransform(s, 0, 0, s, offsetX, offsetY);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();

      ctx.imageSmoothingEnabled = true;
      if (f.bg) ctx.drawImage(f.bg, 0, 0, W, H);
      else { ctx.fillStyle = '#304e39'; ctx.fillRect(0, 0, W, H); }

      let drawn = false;
      if (phase === 3) {
        portalArt();
        if (hero.y < c.pedestal.pe[1]) { player(); drawn = true; }
        stone(c.pedestal.pe[0], c.pedestal.pe[1], cfg.PEDESTAL_H_CAMARA);
        keyArt();
      } else {
        for (let i = 0; i < order.length; i++) {
          const n = order[i];
          if (!drawn && hero.y < f.exits[n].y) { player(); drawn = true; }
          pedestal(n);
        }
      }
      if (!drawn) player();`;

const newDrawSetup = `    function draw() {
      const W = f.w, H = f.h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Fundo: usa 2x quando largura de exibição passar de 1100 px na câmara
      const activeBg = (phase === 3)
        ? ((canvas.width > 1100 && art.bgCamara2x) ? art.bgCamara2x : (art.bgCamara1x || f.bg))
        : f.bg;

      // Preenchimento de fundo borrado e escurecido (nunca faixas pretas ou vazias)
      if (activeBg && (offsetY > 0 || offsetX > 0)) {
        ctx.save();
        ctx.filter = 'blur(16px) brightness(0.4)';
        const coverScale = Math.max(canvas.width / W, canvas.height / H);
        const bgW = W * coverScale, bgH = H * coverScale;
        ctx.drawImage(activeBg, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#101c19';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Palco centralizado com escala única
      ctx.setTransform(s, 0, 0, s, offsetX, offsetY);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (activeBg) ctx.drawImage(activeBg, 0, 0, W, H);
      else { ctx.fillStyle = '#304e39'; ctx.fillRect(0, 0, W, H); }

      let drawn = false;
      if (phase === 3) {
        portalArt();
        const discY = c.disco ? c.disco[1] : 239.6;
        if (hero.y < discY) { player(); drawn = true; }
        keyArt();
      } else {
        for (let i = 0; i < order.length; i++) {
          const n = order[i];
          if (!drawn && hero.y < f.exits[n].y) { player(); drawn = true; }
          pedestal(n);
        }
      }
      if (!drawn) player();`;
code = code.replace(oldDrawSetup.replace(/\r\n/g, '\n'), newDrawSetup);
code = code.replace(oldDrawSetup.replace(/\n/g, '\r\n'), newDrawSetup.replace(/\n/g, '\r\n'));

// 11. Debug overlay in draw()
const oldDebugOverlay = `        if (phase === 3) {
          ctx.strokeStyle = '#ff42d0'; ctx.beginPath(); ctx.arc(c.pedestal.pe[0], c.pedestal.pe[1], c.pedestal.raio, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ffe230'; ctx.strokeRect(c.soleira[0], c.soleira[1], c.soleira[2], c.soleira[3]);
        }
        ctx.strokeStyle = '#fff'; ctx.strokeRect(hero.x - m.footW / 2, hero.y - m.footH / 2, m.footW, m.footH);
        ctx.fillStyle = '#fff'; ctx.fillRect(f.spawn[0] - 4, f.spawn[1] - 4, 8, 8);

        // Indicador de zona segura horizontal [12%, 88%]
        ctx.strokeStyle = '#ff880088'; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
        ctx.strokeRect(f.safeXMin, 0, f.safeW, H);
        ctx.setLineDash([]);

        panel(phase === 3 ? 200 : 112, H - 46, phase === 3 ? 976 : 800, 36);`;

const newDebugOverlay = `        if (phase === 3) {
          const discX = c.disco ? c.disco[0] : 512, discY = c.disco ? c.disco[1] : 239.6;
          ctx.strokeStyle = '#28ff35'; ctx.beginPath(); ctx.arc(discX, discY, c.interacao || 39, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ffe230'; ctx.strokeRect(c.soleira[0], c.soleira[1], c.soleira[2], c.soleira[3]);
          ctx.strokeStyle = '#c58bff'; ctx.beginPath(); ctx.arc(c.portal.centro[0], c.portal.centro[1], c.portal.raio, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = '#fff'; ctx.strokeRect(hero.x - m.footW / 2, hero.y - m.footH / 2, m.footW, m.footH);
        ctx.fillStyle = '#fff'; ctx.fillRect(f.spawn[0] - 4, f.spawn[1] - 4, 8, 8);

        // Indicador de zona segura
        ctx.strokeStyle = '#ff880088'; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
        ctx.strokeRect(f.safeXMin, f.safeYMin || 0, f.safeW, f.safeH || H);
        ctx.setLineDash([]);

        panel(112, H - 46, 800, 36);`;
code = code.replace(oldDebugOverlay.replace(/\r\n/g, '\n'), newDebugOverlay);
code = code.replace(oldDebugOverlay.replace(/\n/g, '\r\n'), newDebugOverlay.replace(/\n/g, '\r\n'));

fs.writeFileSync('js/labirinto-puzzle.js', code, 'utf8');
console.log('js/labirinto-puzzle.js updated successfully!');

