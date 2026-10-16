/* Livro de configurações: páginas, virada de folha e controles das preferências. */
window.SettingsBook = (() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const settings = window.GameSettings;
  const book = $('#book-dialog'), view = $('#settings-view');
  const order = ['index','audio','controls','language','access','howto','about','credits'];
  const spreads = Array.from(document.querySelectorAll('[data-settings-section]'));
  const goButtons = Array.from(document.querySelectorAll('[data-settings-go]'));
  const toggles = Array.from(document.querySelectorAll('[data-setting]'));
  const keyCaps = Array.from(document.querySelectorAll('[data-key]'));
  const speedOrder = ['slow','normal','fast'];
  const reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
  // Posição do papel de cada página dentro de livro-cenario.png (1280 × 854), em frações da cena.
  const paper = {left:{x:.09,y:.135,w:.41,h:.7}, right:{x:.5,y:.135,w:.41,h:.7}};
  const flipTime = 780;
  let current = 'index', busy = false, queued = null, generation = 0;

  const calm = () => settings.calm || Boolean(reduceQuery && reduceQuery.matches);
  const spreadOf = id => spreads.find(spread => spread.dataset.settingsSection === id);
  const titleOf = id => $(id === 'index' ? '#settings-title' : `#settings-${id}-title`);
  const menuButtonOf = id => goButtons.find(button => button.dataset.settingsGo === id);

  function restart(element,className) {
    if (!element || calm()) return;
    element.classList.remove(className);
    void element.offsetWidth; // reinicia a animação CSS
    element.classList.add(className);
  }
  // Cada escolha solta um coração que sobe na página ativa, como comemoração.
  function cheer() {
    if (calm()) return;
    const page = spreadOf(current)?.querySelector('.right-page') || spreadOf(current)?.querySelector('.page');
    if (!page) return;
    const heart = document.createElement('span');
    heart.className = 'cheer-heart'; heart.textContent = '♥'; heart.setAttribute('aria-hidden','true');
    page.append(heart);
    setTimeout(() => heart.remove(),950);
  }

  /* ---------- Páginas ---------- */
  function show(id) {
    for (const spread of spreads) spread.hidden = spread.dataset.settingsSection !== id;
    current = id;
    view.dataset.section = id;
    $('#settings-back').hidden = id === 'index';
  }
  function paperRect(side,scene,origin) {
    const p = paper[side];
    return {x:scene.left+p.x*scene.width-origin.left, y:scene.top+p.y*scene.height-origin.top, w:p.w*scene.width, h:p.h*scene.height, bx:p.x*scene.width, by:p.y*scene.height};
  }
  function placed(className,rect) {
    const element = document.createElement('div');
    element.className = className;
    element.setAttribute('aria-hidden','true');
    Object.assign(element.style,{left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.w}px`,height:`${rect.h}px`});
    return element;
  }
  // Cópia visual de uma página: sem ids, sem foco e fora da árvore de acessibilidade.
  function copyOf(page,pageRect,rect,scene,still) {
    const copy = page.cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    copy.querySelectorAll('[for]').forEach(node => node.removeAttribute('for'));
    copy.inert = true;
    copy.classList.add('leaf-copy');
    if (still) copy.classList.add('leaf-still');
    Object.assign(copy.style,{left:`${pageRect.left-scene.left-rect.bx}px`,top:`${pageRect.top-scene.top-rect.by}px`,width:`${pageRect.width}px`,height:`${pageRect.height}px`});
    return copy;
  }
  function paperFace(className,rect,scene,page,pageRect,still) {
    const face = document.createElement('div');
    face.className = className;
    face.style.backgroundSize = `${scene.width}px ${scene.height}px`;
    face.style.backgroundPosition = `${-rect.bx}px ${-rect.by}px`;
    face.append(copyOf(page,pageRect,rect,scene,still));
    return face;
  }
  /* Uma folha presa na lombada gira 180°: a frente mostra a página antiga e o verso, a nova.
     Enquanto gira, uma cópia da página que ainda não foi coberta fica parada embaixo. */
  function turnLeaf(target,forward,done) {
    const from = spreadOf(current), to = spreadOf(target);
    const [fromLeft,fromRight] = from.children, [toLeft,toRight] = to.children;
    const scene = view.parentElement.getBoundingClientRect(), origin = view.getBoundingClientRect();
    const leftPage = fromLeft.getBoundingClientRect(), rightPage = fromRight.getBoundingClientRect();
    const L = paperRect('left',scene,origin), R = paperRect('right',scene,origin);
    const start = forward ? R : L, end = forward ? L : R;
    const under = placed('page-under',end);
    under.style.backgroundSize = `${scene.width}px ${scene.height}px`;
    under.style.backgroundPosition = `${-end.bx}px ${-end.by}px`;
    under.append(copyOf(forward?fromLeft:fromRight,forward?leftPage:rightPage,end,scene,true));
    const shade = placed(`page-shade ${forward?'shade-forward':'shade-back'}`,start);
    const leaf = placed(`page-leaf ${forward?'turn-forward':'turn-back'}`,start);
    leaf.append(
      paperFace('leaf-face leaf-front',start,scene,forward?fromRight:fromLeft,forward?rightPage:leftPage,true),
      paperFace('leaf-face leaf-back',end,scene,forward?toLeft:toRight,forward?leftPage:rightPage,false)
    );
    view.append(under,shade,leaf);
    show(target);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true; clearTimeout(timer);
      under.remove(); shade.remove(); leaf.remove();
      done();
    };
    const timer = setTimeout(finish,flipTime+400);
    leaf.addEventListener('animationend',event => { if (event.target === leaf) finish(); });
  }
  // Em telas estreitas o livro vira uma coluna: as páginas novas entram girando de leve.
  function turnSimple(target,forward,done) {
    show(target);
    const pages = Array.from(spreadOf(target).children);
    for (const page of pages) { page.classList.remove('turn-in-forward','turn-in-back'); restart(page,forward?'turn-in-forward':'turn-in-back'); }
    setTimeout(() => { pages.forEach(page => page.classList.remove('turn-in-forward','turn-in-back')); done(); },480);
  }
  function go(target,focus='heading') {
    if (!order.includes(target)) return;
    if (busy) { queued = {target,focus}; return; }
    if (target === current) { if (focus === 'heading') titleOf(target)?.focus(); return; }
    const previous = current, forward = order.indexOf(target) > order.indexOf(previous), turn = generation;
    busy = true;
    GameAudio.page();
    const done = () => {
      if (turn !== generation) return;
      busy = false;
      if (focus === 'heading') titleOf(target)?.focus();
      else if (focus === 'menu') (menuButtonOf(previous) || titleOf(target))?.focus();
      if (queued) { const next = queued; queued = null; go(next.target,next.focus); }
    };
    if (calm()) { show(target); done(); }
    else if (narrowQuery && narrowQuery.matches) turnSimple(target,forward,done);
    else turnLeaf(target,forward,done);
  }
  goButtons.forEach(button => button.addEventListener('click',() => go(button.dataset.settingsGo,'heading')));
  $('#settings-back').addEventListener('click',() => go('index','menu'));

  /* ---------- Áudio ---------- */
  const sliders = {sound:$('#sound-volume'), music:$('#music-volume')};
  function paintAudio() {
    for (const [id,color] of [['sound','#65a559'],['music','#579cae']]) {
      const value = settings.get(id), slider = sliders[id];
      slider.value = String(value);
      $(`#${id}-value`).value = `${value}%`;
      slider.style.background = `linear-gradient(to right,${color} ${value}%,#4b393f ${value}%)`;
      slider.setAttribute('aria-valuetext',`${value} por cento`);
    }
    const muted = settings.get('mute');
    view.classList.toggle('is-muted',muted);
    GameAudio.setVolumes(muted?0:settings.get('sound'),muted?0:settings.get('music'));
  }
  for (const [id,slider] of Object.entries(sliders)) {
    slider.addEventListener('input',() => {
      const value = slider.value;
      if (settings.get('mute')) settings.set('mute',false); // mexer no volume tira o silêncio
      settings.set(id,value);
      restart($(`#${id}-value`),'is-popping');
    });
    slider.addEventListener('change',() => { GameAudio.click(); cheer(); });
  }
  $('#test-sound').addEventListener('click',() => { GameAudio.success(); cheer(); });
  function refreshMusic(active) {
    $('#music-toggle').setAttribute('aria-pressed',String(active));
    $('#music-status').textContent = active ? 'Pausar música de teste' : 'Ouvir música de teste';
  }
  $('#music-toggle').addEventListener('click',() => { refreshMusic(GameAudio.toggleMusic()); cheer(); });

  /* ---------- Interruptores de pata ---------- */
  function paintToggles() {
    for (const toggle of toggles) {
      const on = Boolean(settings.get(toggle.dataset.setting));
      toggle.setAttribute('aria-checked',String(on));
      $(`#${toggle.id}-state`).textContent = on ? 'Ligado' : 'Desligado';
    }
  }
  toggles.forEach(toggle => toggle.addEventListener('click',() => {
    const on = toggle.getAttribute('aria-checked') !== 'true';
    settings.set(toggle.dataset.setting,on);
    GameAudio.toggle(on);
    cheer();
  }));

  /* ---------- Controles ---------- */
  function paintSpeed() {
    const speed = settings.get('speed'), index = speedOrder.indexOf(speed);
    $('#speed-value').value = settings.speeds[speed].label;
    $('#speed-prev').setAttribute('aria-disabled',String(index === 0));
    $('#speed-next').setAttribute('aria-disabled',String(index === speedOrder.length-1));
    $('#walk-preview').dataset.speed = speed;
  }
  function stepSpeed(button,shift) {
    const next = speedOrder[speedOrder.indexOf(settings.get('speed'))+shift];
    if (!next) { restart(button,'is-shaking'); return; }
    settings.set('speed',next);
    GameAudio.click();
    restart($('#speed-value'),'is-popping');
  }
  $('#speed-prev').addEventListener('click',() => stepSpeed($('#speed-prev'),-1));
  $('#speed-next').addEventListener('click',() => stepSpeed($('#speed-next'),1));
  // Controle na tela: setas, joystick ou nenhum (para tablet e celular).
  const touchOptions = Array.from(document.querySelectorAll('.touch-option'));
  function paintTouch() {
    const mode = settings.get('touch');
    for (const option of touchOptions) option.setAttribute('aria-checked',String(option.dataset.touch === mode));
  }
  touchOptions.forEach(option => option.addEventListener('click',() => {
    if (settings.get('touch') === option.dataset.touch) return;
    settings.set('touch',option.dataset.touch);
    GameAudio.click();
    cheer();
  }));
  // Na página de controles, as teclas apertadas acendem no desenho do teclado.
  document.addEventListener('keydown',event => {
    if (!book.open || view.hidden || current !== 'controls' || !event.key) return;
    const key = event.key.toLowerCase();
    for (const cap of keyCaps) if (cap.dataset.key === key) restart(cap,'is-pressed');
  });

  /* ---------- Idioma ---------- */
  $('#lang-pt').addEventListener('click',() => {
    GameAudio.click(); cheer();
    $('#language-note').textContent = 'Você já está jogando em português!';
  });
  $('#lang-en').addEventListener('click',() => {
    GameAudio.click(); restart($('#lang-en'),'is-shaking');
    $('#language-note').textContent = 'O inglês ainda está chegando. Em breve!';
  });

  /* ---------- Padrões ---------- */
  $('#settings-reset').addEventListener('click',() => {
    settings.reset();
    GameAudio.success(); cheer();
    $('#settings-reset-note').textContent = 'Pronto! Tudo voltou ao jeito do começo.';
  });

  function paintAll() { paintAudio(); paintToggles(); paintSpeed(); paintTouch(); }
  settings.onChange(paintAll);
  paintAll();

  return {
    // Abre o livro. Sem argumento, começa no sumário; com um id, vai direto àquela página.
    open(section = 'index') {
      generation++; busy = false; queued = null;
      document.querySelectorAll('.page-leaf,.page-under,.page-shade').forEach(element => element.remove());
      $('#settings-reset-note').textContent = '';
      $('#language-note').textContent = 'O inglês ainda não está disponível.';
      show(order.includes(section) ? section : 'index');
    },
    go, refreshMusic,
    get current() { return current; }
  };
})();
