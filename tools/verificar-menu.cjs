// Verificação de fluxos em DOM simulado; não substitui QA visual no navegador.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
class Element {
  constructor(tag, attributes, offset) {
    this.tagName=tag.toUpperCase();this.attributes=attributes;this.offset=offset;
    this.id=attributes.id;this.dataset={};this.style={};this.events={};this.value=attributes.value||'';
    this.hidden='hidden' in attributes;this.disabled=false;this.textContent='';this.open=false;
    for(const [key,value] of Object.entries(attributes))if(key.startsWith('data-'))this.dataset[key.slice(5)]=value;
    this.classes=new Set((attributes.class||'').split(' '));
    this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),replace:(a,b)=>{if(this.classes.delete(a))this.classes.add(b);}};
  }
  addEventListener(type,fn){(this.events[type] ||= []).push(fn);}
  emit(type,event={}){for(const fn of this.events[type]||[])fn({target:this,...event});}
  click(){if(!this.disabled)this.emit('click');}
  setAttribute(key,value){this.attributes[key]=value;}
  removeAttribute(key){delete this.attributes[key];}
  showModal(){assert(!this.open);this.open=true;}
  close(){this.open=false;this.emit('close');}
  focus(){this.focused=true;}
  closest(){return elements.find(el=>el.tagName==='DIALOG'&&this.offset>el.offset&&this.offset<html.indexOf('</dialog>',el.offset));}
  getBoundingClientRect(){return{left:0,top:0,right:100,bottom:100};}
}
const elements=[];
for(const match of html.matchAll(/<([a-z][\w-]*)([^>]*?)>/g)){
  const attrs={};for(const a of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';
  elements.push(new Element(match[1],attrs,match.index));
}
const select=selector=>elements.filter(el=>selector[0]==='#'?el.id===selector.slice(1):selector[0]==='.'?el.classes.has(selector.slice(1)):selector[0]==='['?selector.slice(1,-1) in el.attributes:el.tagName.toLowerCase()===selector);
const document={querySelector:selector=>select(selector)[0],querySelectorAll:select,events:{},addEventListener(type,fn){(this.events[type]||=[]).push(fn);}};
const storage=new Map();let sounds=0,music=false;
const GameIsland={active:false,start(){this.active=true;},stop(){this.active=false;}};
const context=vm.createContext({document,GameIsland,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},GameAudio:{setVolumes(){},click(){},success(){sounds++;},toggleMusic(){return music=!music;},stopMusic(){music=false;}}});
vm.runInContext(fs.readFileSync(path.join(root,'js/main.js'),'utf8'),context);
const $=s=>document.querySelector(s),button=(attr,value)=>select(`[${attr}]`).find(el=>el.attributes[attr]===value);
const key=value=>{for(const fn of document.events.keydown||[])fn({key:value,preventDefault(){}});};
button('data-open','settings').click();assert($('#book-dialog').open);assert(!$('#settings-view').hidden);
$('#sound-volume').value='25';$('#sound-volume').emit('input');assert.equal(storage.get('ilha.sound'),'25');assert.equal($('#sound-value').value,'25%');
$('#music-toggle').click();assert(music);assert.equal($('#music-toggle').attributes['aria-pressed'],'true');
select('[data-close]').find(el=>el.closest()?.id==='book-dialog').click();assert(!$('#book-dialog').open);
button('data-open','tutorial').click();assert(!$('#tutorial-view').hidden);assert($('#settings-view').hidden);
for(let n=0;n<40;n++)key('d');assert.equal($('#practice-player').style.left,'91%');
for(let n=0;n<40;n++)key('w');assert.equal($('#practice-player').style.top,'36%');
$('#next-step').click();assert(!$('#interaction-practice').hidden);
key('e');const firstSoundCount=sounds;key('e');assert.equal(sounds,firstSoundCount);assert($('#interact-button').disabled);assert.match($('#interaction-result').textContent,/pegou/);
$('#next-step').click();button('data-region','2').click();assert.match($('#region-description').textContent,/Geometria/);
$('#next-step').click();assert(!$('#book-dialog').open);
button('data-open','tutorial').click();assert(!$('#interact-button').disabled);assert.equal($('#practice-player').style.cssText,'left:42%;top:65%');
$('#previous-step').click();assert(!$('#book-dialog').open);
button('data-open','start').click();assert(GameIsland.active);assert(!$('#message-dialog').open);
button('data-open','settings').click();$('#settings-exit').click();assert(!$('#book-dialog').open);assert($('#message-dialog').open);
$('#message-confirm').click();assert(!music);assert(!GameIsland.active);assert(!$('#message-dialog').open);
button('data-open','exit').click();
$('#message-confirm').click();assert(!music);assert($('#message-confirm').hidden);assert.match($('#message-title').textContent,/Até logo/);
$('#message-back').click();assert(!$('#message-dialog').open);
console.log('Fluxos verificados: volumes, música, movimento limitado, coleta única, regiões, retorno, início e saída.');
