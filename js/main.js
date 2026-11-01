(() => {
  const $ = selector => document.querySelector(selector);
  const book = $('#book-dialog'), message = $('#message-dialog');
  const settings = $('#settings-view'), tutorial = $('#tutorial-view');
  const regionButtons = Array.from(document.querySelectorAll('[data-region]')).filter(button => ['0','1','2','3'].includes(button.dataset.region));
  let trigger, step = 0, collected = false;
  const position = {x:42,y:65};
  const pages = [
    {title:'Explore a ilha',copy:'Sua aventura começa com pequenos passos. Use W, A, S e D ou as setas para caminhar e descobrir novos lugares.',tip:'Você também pode usar os botões ao lado para experimentar.',view:'movement-practice'},
    {title:'Encontre e interaja',copy:'Ao encontrar um objeto importante, aproxime-se e aperte E. É assim que você vai conversar com o mundo e conquistar suas chaves.',tip:'Nesta prática, a personagem já está perto da chave. Experimente apertar E.',view:'interaction-practice'},
    {title:'Quatro chaves, um gato',copy:'Cada região guarda um desafio de matemática. Conquiste as quatro chaves, volte à montanha e liberte seu amigo!',tip:'Errar faz parte de aprender. Você sempre poderá tentar de novo.',view:'regions-practice'}
  ];
  const regionText = ['Lógica: observe e repita uma sequência.','Álgebra: descubra o número que está faltando.','Geometria: gire a peça para encontrar o encaixe.','Operações: escolha a resposta da conta.'];

  // Volumes e demais preferências ficam em js/game-settings.js e js/settings-book.js.
  function renderPage() {
    const page=pages[step];
    $('#tutorial-title').textContent=page.title;
    $('#tutorial-copy').textContent=page.copy;
    $('#tutorial-tip').textContent=page.tip;
    $('#step-count').textContent=`0${step+1} / 03`;
    $('#key-guide').hidden=step!==0;
    for(const p of pages) $(`#${p.view}`).hidden=p.view!==page.view;
    $('#previous-step').textContent=step===0?'Menu':'Voltar';
    $('#next-step').textContent=step===2?'Entendi!':'Próxima';
    document.querySelectorAll('[data-step]').forEach(button=>{
      if(Number(button.dataset.step)===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
  }
  function move(direction) {
    const shift={up:[0,-7],down:[0,7],left:[-7,0],right:[7,0]}[direction];
    position.x=Math.min(91,Math.max(9,position.x+shift[0]));
    position.y=Math.min(96,Math.max(36,position.y+shift[1]));
    const player=$('#practice-player');
    player.style.left=`${position.x}%`;player.style.top=`${position.y}%`;
    player.src=`assets/personagem/personagem-${direction==='up'?'costas':direction==='down'?'frente':'lado'}.png`;
    player.style.transform=`translate(-50%,-100%)${direction==='left'?' scaleX(-1)':''}`;
  }
  function interact() {
    if(collected)return;
    collected=true;$('.key-pedestal').classList.add('collected');
    $('#interaction-result').textContent='Você pegou a chave de prática! As chaves da aventura estão nos desafios.';
    $('#interact-button').textContent='Chave conquistada ✓';
    $('#interact-button').disabled=true;
    GameAudio.success();
  }
  function resetTutorial() {
    step=0;collected=false;position.x=42;position.y=65;
    $('#practice-player').style.cssText='left:42%;top:65%';
    $('#practice-player').src='assets/personagem/personagem-frente.png';
    $('.key-pedestal').classList.remove('collected');
    $('#interaction-result').textContent='Uma chave de prática espera por você.';
    $('#interact-button').innerHTML='Interagir <kbd>E</kbd>';
    $('#interact-button').disabled=false;
    $('#region-description').textContent='Toque em uma chave para descobrir o desafio.';
    regionButtons.forEach(button=>button.setAttribute('aria-pressed','false'));
    renderPage();
  }
  function openBook(kind,section) {
    if(message.open)message.close();
    const pauseDialog=$('#island-pause-dialog');
    if(pauseDialog?.open)pauseDialog.close(); // aberto pela pausa: o livro substitui a pausa
    settings.hidden=kind!=='settings';tutorial.hidden=kind!=='tutorial';
    book.setAttribute('aria-labelledby',kind==='settings'?'settings-title':'tutorial-title');
    if(kind==='tutorial')resetTutorial();
    else SettingsBook.open(section);
    // Foca o título da página aberta: sumário, ou a seção pedida (ex.: "audio").
    const focusTarget=kind==='tutorial'?'#next-step':section&&section!=='index'?`#settings-${section}-title`:'#settings-title';
    if(book.open)$(focusTarget)?.focus();
    else book.showModal();
  }
  function openMessage() {
    confirmQuitTab=false;
    if(book.open)book.close();
    $('#island-preview').hidden=true;
    $('#message-confirm').hidden=false;
    $('#message-chapter').textContent='ATÉ A PRÓXIMA AVENTURA';
    $('#message-title').textContent='Quer sair por agora?';
    $('#message-copy').textContent='Você pode voltar ao menu e continuar depois, nesta mesma sessão. Seus desafios e suas chaves ficam guardados. Recarregar a página reinicia a aventura.';
    $('#message-back').textContent='Continuar aqui';$('#message-confirm').textContent='Voltar ao menu';
    $('#message-confirm').classList.replace('green','red');
    message.showModal();
  }
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{
    // Pela pausa, o foco volta à engrenagem da ilha (a pausa já terá fechado).
    if(button.closest('dialog')!==book)trigger=button.id==='island-pause-settings'?($('#island-settings-button')||button):button;
    GameAudio.click();
    const kind=button.dataset.open;
    if(kind==='settings'||kind==='tutorial')openBook(kind,button.dataset.settingsStart);
    else if(kind==='start')GameIsland.start();
    else if(kind==='exit')askQuitTab();
    else openMessage();
  }));
  // "X" no canto do menu: pergunta a confirmação antes de encerrar e fechar a aba.
  let confirmQuitTab=false;
  function askQuitTab() {
    confirmQuitTab=true;
    if(book.open)book.close();
    $('#island-preview').hidden=true;
    $('#message-confirm').hidden=false;
    $('#message-chapter').textContent='ATÉ A PRÓXIMA AVENTURA';
    $('#message-title').textContent='Quer mesmo sair do jogo?';
    $('#message-copy').textContent='O jogo vai se encerrar e a aba será fechada. Como esta é uma aventura de navegador, nada fica salvo ao sair.';
    $('#message-back').textContent='Continuar aqui';$('#message-confirm').textContent='Sair do jogo';
    $('#message-confirm').classList.replace('green','red');
    message.showModal();
  }
  function quitTab() {
    GameAudio.stopMusic();SettingsBook.refreshMusic(false);
    if(typeof window.close==='function')window.close();
    $('#message-confirm').hidden=true;
    $('#message-title').textContent='Até logo, explorador!';
    $('#message-copy').textContent='Você pode fechar esta aba do navegador quando quiser.';
    $('#message-back').textContent='Voltar';
    // Alguns navegadores só fecham abas abertas por script; mostramos um aviso se não fechar.
    setTimeout(()=>{if(!message.open)message.showModal();},150);
  }
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{GameAudio.click();button.closest('dialog').close();}));
  $('#settings-exit').addEventListener('click',()=>{GameAudio.click();openMessage();});
  $('#message-back').addEventListener('click',()=>{GameAudio.click();confirmQuitTab=false;message.close();});
  $('#message-confirm').addEventListener('click',()=>{
    GameAudio.click();
    // Confirmação do "X" do canto: encerra e fecha a aba.
    if(confirmQuitTab){confirmQuitTab=false;message.close();quitTab();return;}
    GameAudio.stopMusic();SettingsBook.refreshMusic(false);
    message.close();
    if(GameIsland.active)GameIsland.stop();
    else {
      $('#message-title').textContent='Até logo, explorador!';
      $('#message-copy').textContent='Demonstração encerrada. Use o botão abaixo para voltar ao menu ou feche a aba do navegador.';
      $('#message-confirm').hidden=true;$('#message-back').textContent='Voltar ao menu';
      message.showModal();
    }
  });
  $('#previous-step').addEventListener('click',()=>{GameAudio.click();if(step===0)book.close();else{step--;renderPage();}});
  $('#next-step').addEventListener('click',()=>{GameAudio.click();if(step===2)book.close();else{step++;renderPage();}});
  document.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{step=Number(button.dataset.step);renderPage();GameAudio.click();}));
  document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>move(button.dataset.move)));
  $('#interact-button').addEventListener('click',interact);
  regionButtons.forEach(button=>button.addEventListener('click',()=>{
    regionButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    $('#region-description').textContent=regionText[Number(button.dataset.region)];GameAudio.click();
  }));
  document.addEventListener('keydown',event=>{
    if(!book.open||tutorial.hidden||event.ctrlKey||event.altKey||event.metaKey)return;
    const direction={w:'up',a:'left',s:'down',d:'right',arrowup:'up',arrowleft:'left',arrowdown:'down',arrowright:'right'}[event.key.toLowerCase()];
    if(step===0&&direction){event.preventDefault();move(direction);}
    if(step===1&&event.key.toLowerCase()==='e'){event.preventDefault();interact();}
  });
  for(const dialog of [book,message]) {
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const bounds=dialog.getBoundingClientRect();
      if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
    });
    dialog.addEventListener('close',()=>{if(dialog===message)confirmQuitTab=false;if(!book.open&&!message.open&&trigger)trigger.focus();});
  }
})();
