const settingsDialog = document.querySelector('#settings-dialog');
const messageDialog = document.querySelector('#message-dialog');
const title = document.querySelector('#message-title');
const text = document.querySelector('#message-text');
const preview = document.querySelector('#island-preview');
const controls = document.querySelector('#tutorial-controls');
const messageButton = document.querySelector('#message-button');
let exitPending = false;
let lastTrigger;

function showMessage(kind) {
  exitPending = kind === 'exit';
  preview.hidden = kind !== 'start';
  controls.hidden = kind !== 'tutorial';
  document.querySelector('#message-label').textContent = 'DEMONSTRAÇÃO';
  messageButton.textContent = exitPending ? 'Sair da demonstração' : 'Voltar ao menu';
  const messages = {
    start: ['Nossa aventura começa aqui!', 'Esta é uma demonstração da tela inicial. Na versão completa, você vai explorar a ilha, resolver quatro desafios matemáticos e conquistar as chaves para libertar seu gato.'],
    tutorial: ['Como será a aventura?', 'Na versão completa, use as setas ou W, A, S e D para andar e E para interagir. Explore as quatro regiões, resolva os desafios e reúna as quatro chaves. Os comandos de gameplay ainda não estão ativos neste protótipo.'],
    exit: ['Até a próxima aventura!', 'Deseja sair da demonstração? Você poderá voltar ao menu quando quiser. Para fechar a página, use o controle da aba do navegador.']
  };
  [title.textContent, text.textContent] = messages[kind];
  messageDialog.showModal();
}

document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', () => {
    lastTrigger = button;
    const action = button.dataset.action;
    if (action === 'settings') settingsDialog.showModal();
    else {
      if (settingsDialog.open) settingsDialog.close();
      showMessage(action);
    }
  });
});

document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

messageButton.addEventListener('click', () => {
  if (exitPending) {
    exitPending = false;
    title.textContent = 'Demonstração encerrada';
    text.textContent = 'O gato vai ficar esperando por você. Clique abaixo para retornar à tela inicial.';
    messageButton.textContent = 'Voltar ao menu';
  } else messageDialog.close();
});

for (const dialog of [settingsDialog, messageDialog]) {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    if (lastTrigger && !lastTrigger.closest('dialog')) lastTrigger.focus();
  });
}

for (const id of ['sound', 'music']) {
  const input = document.querySelector(`#${id}`);
  const output = document.querySelector(`.${id}-value`);
  const update = () => {
    output.value = `${input.value}%`;
    input.style.background = `linear-gradient(to right, ${id === 'sound' ? '#579957' : '#4799b1'} ${input.value}%, #472c39 ${input.value}%)`;
    input.setAttribute('aria-valuetext', `${input.value} por cento`);
  };
  input.addEventListener('input', update);
  update();
}
