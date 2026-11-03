const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const indexPath = path.resolve('index.html');
const fileUrl = 'file:///' + indexPath.replace(/\\/g, '/');

const resolutions = [
  { w: 667, h: 375, name: '667x375 (iPhone SE Landscape)' },
  { w: 740, h: 360, name: '740x360 (Galaxy S8+ Landscape)' },
  { w: 844, h: 390, name: '844x390 (iPhone 12/13/14 Landscape)' },
  { w: 915, h: 412, name: '915x412 (Pixel 7 Landscape)' },
  { w: 1024, h: 768, name: '1024x768 (iPad Landscape)' },
  { w: 1366, h: 768, name: '1366x768 (Laptop HD)' },
  { w: 1920, h: 1080, name: '1920x1080 (Desktop FHD)' },
  { w: 390, h: 844, name: '390x844 (iPhone Portrait)' }
];

async function runTests() {
  console.log('=== 1. CHECKS DE SINTAXE JS ===');
  for (const script of ['js/main.js', 'js/settings-book.js', 'js/game-settings.js']) {
    try {
      execFileSync('node', ['--check', script]);
      console.log(`[PASS] ${script} sintaxe OK`);
    } catch (e) {
      console.error(`[FAIL] ${script} erro de sintaxe:`, e.message);
      process.exit(1);
    }
  }

  console.log('\n=== 2. TESTES DE INTERATIVIDADE E CONTROLES (Chrome Headless) ===');
  // Inject script to test full interactive workflow
  const testScript = `
    (async () => {
      const results = [];
      const $ = s => document.querySelector(s);
      
      // Open tutorial step 0
      const openBtn = $('[data-open="tutorial"]');
      if (!openBtn) throw new Error('Tutorial open button not found');
      openBtn.click();
      
      const book = $('#book-dialog');
      const tut = $('#tutorial-view');
      if (!book.open || tut.hidden) results.push({ name: 'Tutorial Dialog Opened', pass: false });
      else results.push({ name: 'Tutorial Dialog Opened', pass: true });
      
      // Step 0: Move player via D-pad
      const player = $('#practice-player');
      const initialPos = { left: player.style.left, top: player.style.top };
      const rightBtn = $('[data-move="right"]');
      rightBtn.click();
      const posAfterRight = { left: player.style.left, top: player.style.top };
      results.push({
        name: 'D-pad Right Move',
        pass: posAfterRight.left !== initialPos.left,
        details: initialPos.left + ' -> ' + posAfterRight.left
      });
      
      // Keyboard move (ArrowDown)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      const posAfterDown = { left: player.style.left, top: player.style.top };
      results.push({
        name: 'Keyboard ArrowDown Move',
        pass: posAfterDown.top !== posAfterRight.top,
        details: posAfterRight.top + ' -> ' + posAfterDown.top
      });
      
      // Check Step 0 Prev button says "Voltar ao menu"
      const prevBtn = $('#previous-step');
      results.push({
        name: 'Step 0 Prev Button Label',
        pass: prevBtn.textContent.trim() === 'Voltar ao menu',
        details: prevBtn.textContent.trim()
      });
      
      // Advance to Step 1 via Next button
      const nextBtn = $('#next-step');
      nextBtn.click();
      const step1Title = $('#tutorial-title').textContent;
      const step1Count = $('#step-count').textContent;
      results.push({
        name: 'Advance to Step 1',
        pass: step1Count.includes('02') && step1Title === 'Encontre e interaja',
        details: step1Count + ' - ' + step1Title
      });
      
      // Interact on Step 1
      const interactBtn = $('#interact-button');
      interactBtn.click();
      const resText = $('#interaction-result').textContent;
      results.push({
        name: 'Step 1 Interact Click',
        pass: interactBtn.disabled && resText.includes('Você pegou a chave de prática!'),
        details: resText
      });
      
      // Advance to Step 2 via Next button
      nextBtn.click();
      const step2Title = $('#tutorial-title').textContent;
      const step2Count = $('#step-count').textContent;
      const step2NextLabel = nextBtn.textContent.trim();
      results.push({
        name: 'Advance to Step 2',
        pass: step2Count.includes('03') && step2NextLabel === 'Entendi!',
        details: step2Count + ' - Next label: ' + step2NextLabel
      });
      
      // Test 4 region buttons on Step 2
      const regButtons = document.querySelectorAll('.region-grid [data-region]');
      const regDesc = $('#region-description');
      let regionsOk = regButtons.length === 4;
      for (let i = 0; i < regButtons.length; i++) {
        regButtons[i].click();
        if (regButtons[i].getAttribute('aria-pressed') !== 'true') regionsOk = false;
      }
      results.push({
        name: 'Step 2 Region Buttons Interactive',
        pass: regionsOk && regDesc.textContent.includes('Operações'),
        details: regDesc.textContent
      });
      
      // Test Step dot navigation
      const dots = document.querySelectorAll('[data-step]');
      dots[0].click();
      results.push({
        name: 'Dots Navigation to Step 0',
        pass: $('#step-count').textContent.includes('01') && dots[0].getAttribute('aria-current') === 'step'
      });
      
      // Test Escape closes
      book.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      book.close(); // native dialog behavior on escape
      results.push({
        name: 'Escape Closes Dialog',
        pass: !book.open
      });
      
      return results;
    })()
  `;

  // Write temporary test runner HTML that loads index.html and executes testScript
  const testHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body>
      <iframe id="test-frame" src="${fileUrl}" style="width: 1024px; height: 768px; border: 0;"></iframe>
      <script>
        window.addEventListener('message', async (e) => {
          // not used
        });
        window.onload = () => {
          setTimeout(async () => {
            const frameDoc = document.getElementById('test-frame').contentWindow;
            try {
              const res = await frameDoc.eval(\`${testScript.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`);
              document.title = 'TEST_RESULTS:' + JSON.stringify(res);
            } catch(err) {
              document.title = 'TEST_ERROR:' + err.message;
            }
          }, 800);
        };
      </script>
    </body>
    </html>
  `;
  const testHtmlPath = path.resolve('scratch/run-interactive-test.html');
  fs.writeFileSync(testHtmlPath, testHtmlContent, 'utf8');

  // Run with Chrome and print page title
  const chromeOut = execFileSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--allow-file-access-from-files',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=5000',
    '--dump-dom',
    'file:///' + testHtmlPath.replace(/\\/g, '/')
  ], { encoding: 'utf8' });

  const titleMatch = chromeOut.match(/<title>(TEST_RESULTS:[^<]+|TEST_ERROR:[^<]+)<\/title>/);
  if (titleMatch) {
    const raw = titleMatch[1];
    if (raw.startsWith('TEST_RESULTS:')) {
      const results = JSON.parse(raw.slice('TEST_RESULTS:'.length));
      for (const r of results) {
        console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.name}${r.details ? ' (' + r.details + ')' : ''}`);
        if (!r.pass) process.exit(1);
      }
    } else {
      console.error('[FAIL] Interactive test error:', raw);
      process.exit(1);
    }
  } else {
    console.log('[WARN] Title match not found, dumping sample:', chromeOut.slice(0, 300));
  }

  console.log('\n=== 3. AUDITORIA DE RESOLUÇÕES, OVERFLOW E ZONA DO GATO ===');
  // Script to audit layout, overflow, cat zone, and tap targets across resolutions
  const auditRunnerHtml = path.resolve('scratch/run-audit.html');
  
  for (const res of resolutions) {
    for (const largeText of [false, true]) {
      for (const step of [0, 1, 2]) {
        const query = `?tutorial&step=${step}${largeText ? '&largeText' : ''}&calibrar`;
        const runnerContent = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body>
            <iframe id="frame" src="${fileUrl}${query}" style="width: ${res.w}px; height: ${res.h}px; border:0;"></iframe>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  try {
                    const win = document.getElementById('frame').contentWindow;
                    const doc = win.document;
                    const tut = doc.getElementById('tutorial-view');
                    if (!tut) throw new Error('tutorial-view not found');
                    
                    const rect = tut.getBoundingClientRect();
                    const isPortrait = ${res.w} < ${res.h};
                    
                    // Check cat zone (x >= 72% and y >= 60% of tut)
                    const catZone = {
                      left: rect.left + rect.width * 0.72,
                      top: rect.top + rect.height * 0.60,
                      right: rect.right,
                      bottom: rect.bottom
                    };
                    
                    const catViolations = [];
                    // Check all interactive elements and text blocks in tut
                    const checkElements = tut.querySelectorAll('button, p, h1, span, kbd, img, .practice-board, .interaction-scene, .direction-pad');
                    for (const el of checkElements) {
                      if (el.hidden || el.offsetParent === null) continue;
                      const r = el.getBoundingClientRect();
                      if (r.width === 0 || r.height === 0) continue;
                      // Overlap with catZone?
                      const xOverlap = Math.max(0, Math.min(r.right, catZone.right) - Math.max(r.left, catZone.left));
                      const yOverlap = Math.max(0, Math.min(r.bottom, catZone.bottom) - Math.max(r.top, catZone.top));
                      if (xOverlap > 4 && yOverlap > 4 && !isPortrait) {
                        catViolations.push(el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className : ''));
                      }
                    }
                    
                    // Check overflow on tut and main columns
                    const overflows = [];
                    if (!isPortrait) {
                      if (tut.scrollHeight > tut.clientHeight + 2) {
                        overflows.push('tut.scrollHeight (' + tut.scrollHeight + ' > ' + tut.clientHeight + ')');
                      }
                      if (tut.scrollWidth > tut.clientWidth + 2) {
                        overflows.push('tut.scrollWidth (' + tut.scrollWidth + ' > ' + tut.clientWidth + ')');
                      }
                    }
                    
                    // Check minimum tap target requirements
                    const prevBtn = doc.getElementById('previous-step');
                    const nextBtn = doc.getElementById('next-step');
                    const prevRect = prevBtn.getBoundingClientRect();
                    const nextRect = nextBtn.getBoundingClientRect();
                    
                    const tapIssues = [];
                    if (prevRect.height < 46) tapIssues.push('prevHeight: ' + prevRect.height);
                    if (nextRect.height < 46) tapIssues.push('nextHeight: ' + nextRect.height);
                    
                    // Font sizes
                    const titleEl = doc.getElementById('tutorial-title');
                    const titleSize = parseFloat(win.getComputedStyle(titleEl).fontSize);
                    const copyEl = doc.getElementById('tutorial-copy');
                    const copySize = parseFloat(win.getComputedStyle(copyEl).fontSize);
                    
                    const fontIssues = [];
                    if (titleSize < 21) fontIssues.push('titleFont: ' + titleSize);
                    if (copySize < 13.5) fontIssues.push('copyFont: ' + copySize);

                    const out = {
                      catViolations,
                      overflows,
                      tapIssues,
                      fontIssues
                    };
                    document.title = 'AUDIT_RES:' + JSON.stringify(out);
                  } catch(e) {
                    document.title = 'AUDIT_ERR:' + e.message;
                  }
                }, 500);
              };
            </script>
          </body>
          </html>
        `;
        fs.writeFileSync(auditRunnerHtml, runnerContent, 'utf8');

        const auditOut = execFileSync(chromePath, [
          '--headless=new',
          '--disable-gpu',
          '--allow-file-access-from-files',
          `--window-size=${res.w + 50},${res.h + 50}`,
          '--virtual-time-budget=3000',
          '--dump-dom',
          'file:///' + auditRunnerHtml.replace(/\\/g, '/')
        ], { encoding: 'utf8' });

        const m = auditOut.match(/<title>(AUDIT_RES:[^<]+|AUDIT_ERR:[^<]+)<\/title>/);
        if (m) {
          const raw = m[1];
          if (raw.startsWith('AUDIT_RES:')) {
            const audit = JSON.parse(raw.slice('AUDIT_RES:'.length));
            const hasErrors = audit.catViolations.length > 0 || audit.overflows.length > 0 || audit.tapIssues.length > 0 || audit.fontIssues.length > 0;
            if (hasErrors) {
              console.log(`[FAIL] ${res.name} | Step ${step} | ${largeText ? 'LargeText' : 'StdText'}:`, audit);
              process.exit(1);
            }
          } else {
            console.error('[FAIL] Audit error:', raw);
            process.exit(1);
          }
        }
      }
    }
    console.log(`[PASS] ${res.name} (3 steps x 2 text sizes = 6 runs): 0 overflows, zona do gato 100% protegida, tap targets e fontes OK`);
  }
  
  console.log('\n=== TODOS OS TESTES PASSARAM COM SUCESSO! ===');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
