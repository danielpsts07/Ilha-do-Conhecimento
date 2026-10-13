"""Recortes solicitados: mantém pixels das fontes e normaliza em caixas por categoria."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader
import shutil
import html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
TEMP = Path(r'C:\Users\Daniel\AppData\Local\Temp')
GEN = Path(r'C:\Users\Daniel\.codex\generated_images\01a1372a-9f61-70b2-a831-acb511168b49')
sources = {
 'config': Image.open(TEMP/'codex-clipboard-a385f5ad-e2da-4157-b440-8f1831681499.png').convert('RGBA'),
 'extra': Image.open(TEMP/'codex-clipboard-9916f948-733e-4b7c-a9b2-e0f012b183bf.png').convert('RGBA'),
 'book': Image.open(TEMP/'codex-clipboard-6be55013-fe05-45d3-8971-af1eecbfb365.png').convert('RGBA'),
 'pdf': PdfReader(r'C:\Users\Daniel\Downloads\Ilha_do_Conhecimento_Assets_Polidos.pdf').pages[0].images[0].image.convert('RGBA'),
}
entries = []

def clear_edge_background(im):
    """Remove o papel claro conectado às bordas, sem apagar interiores fechados."""
    im = im.copy()
    w,h = im.size
    px = im.load()
    seen = set()
    queue = deque()
    corners = [px[x,y][:3] for x,y in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]]
    brightest = max(sum(c) for c in corners)
    samples = [(r,g,b) for r,g,b in corners if r > 190 and g > 170 and b > 150 and r+g+b >= brightest-25]
    if not samples: samples=[(247,235,202)]
    def is_background(x,y):
        r,g,b,a = px[x,y]
        return a == 0 or min(max(abs(r-cr),abs(g-cg),abs(b-cb)) for cr,cg,cb in samples) < 30
    def add(x,y):
        if 0 <= x < w and 0 <= y < h and (x,y) not in seen and is_background(x,y):
            seen.add((x,y)); queue.append((x,y))
    for x in range(w): add(x,0); add(x,h-1)
    for y in range(h): add(0,y); add(w-1,y)
    while queue:
        x,y = queue.popleft()
        px[x,y] = (0,0,0,0)
        for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]: add(nx,ny)
    return im

def discard_tiny_fragments(im):
    px=im.load();w,h=im.size;visited=set();groups=[]
    for y in range(h):
        for x in range(w):
            if (x,y) in visited or px[x,y][3]==0: continue
            q=deque([(x,y)]);visited.add((x,y));group=[]
            while q:
                ax,ay=q.popleft();group.append((ax,ay))
                for nx,ny in [(ax-1,ay),(ax+1,ay),(ax,ay-1),(ax,ay+1)]:
                    if 0<=nx<w and 0<=ny<h and (nx,ny) not in visited and px[nx,ny][3]>0:
                        visited.add((nx,ny));q.append((nx,ny))
            groups.append(group)
    if groups:
        limit=max(4,max(map(len,groups))*.012)
        for group in groups:
            if len(group)<limit:
                for x,y in group:px[x,y]=(0,0,0,0)
    return im

def normalized(im,size,align='center'):
    bbox = im.getbbox()
    if bbox: im=im.crop(bbox)
    # Resize uniforme: nunca estica um eixo isoladamente.
    ratio = min((size[0]-8)/im.width,(size[1]-8)/im.height)
    im = im.resize((max(1,round(im.width*ratio)),max(1,round(im.height*ratio))), Image.Resampling.NEAREST)
    canvas = Image.new('RGBA',size,(0,0,0,0))
    xy = ((size[0]-im.width)//2, size[1]-im.height-4 if align=='feet' else (size[1]-im.height)//2)
    canvas.alpha_composite(im,xy)
    return canvas

def save(name,im,category,size=None,source='',align='center'):
    path = OUT/category/(name+'.png'); path.parent.mkdir(parents=True,exist_ok=True)
    if size: im=normalized(im,size,align)
    im.save(path)
    entries.append((name,category,im.size,source,path))

def cut(source,name,box,category,size,transparent=True,align='center'):
    im=sources[source].crop(box)
    if transparent: im=discard_tiny_fragments(clear_edge_background(im))
    save(name,im,category,size,source,align)

# Botões vazios: texto será HTML, para manter legibilidade e reutilização.
for name,box in [
 ('botao-pergaminho',(251,524,495,598)),
 ('botao-pergaminho-curto',(255,602,400,677)),
 ('botao-quadrado',(415,602,489,677))]:
    cut('extra',name,box,'ui/botoes',(96,96) if name=='botao-quadrado' else (320,96))
for name,box in [('botao-verde',(315,449,613,539)),('botao-vermelho',(315,642,613,732))]:
    cut('config',name,box,'ui/botoes',(320,96))
for name,box in [('continuar',(315,544,613,636)),('sair',(315,739,613,829)),('som',(316,253,613,346)),('musica',(316,350,613,443))]:
    cut('config','botao-'+name,box,'ui/botoes',(320,96))
cut('extra','botao-como-jogar',(5,523,235,598),'ui/botoes',(320,96))
cut('config','painel-pergaminho',(309,31,624,247),'ui/paineis',(480,320))

# Coordenadas excluem as molduras de organização da prancha.
for name,box in [('som',(653,56,718,118)),('musica',(660,371,710,423)),('pata',(656,662,716,719)),('gato-rosto',(1090,536,1182,608))]:
    cut('config',name,box,'ui/icones',(64,64))
cut('extra','slider-pata',(618,374,669,430),'ui/icones',(64,64))
for name,box in [('configuracoes',(529,613,582,667)),('controle',(529,47,582,89)),('livro',(530,135,582,174))]:
    cut('extra',name,box,'ui/icones',(64,64))
cut('pdf','fechar',(183,1405,220,1444),'ui/icones',(64,64))
cut('config','play',(650,460,720,530),'ui/icones',(64,64),False)
cut('config','sair',(650,557,720,627),'ui/icones',(64,64),False)
cut('config','gato-tutorial',(1100,49,1240,210),'ui/ilustracoes',(192,224))

# Trilhos apenas: guias externos ficam fora do recorte.
for name,box in [('vazio',(768,70,1056,98)),('verde',(768,285,1056,313)),('azul',(768,382,1056,410))]:
    cut('config','slider-'+name,box,'ui/controles',(320,32))

# Poses estáticas iniciais; não equivalem a ciclos completos de animação.
for name,box in [('frente',(585,324,627,381)),('frente-alternativa',(633,324,673,381)),('lado',(679,324,716,381)),('costas',(723,324,765,381))]:
    cut('pdf','personagem-'+name,box,'personagens',(64,80),align='feet')
for name,box in [('frente',(840,329,875,372)),('frente-alternativa',(887,329,920,372)),('costas',(932,328,963,373)),('lado',(966,325,1008,373))]:
    cut('pdf','gato-'+name,box,'personagens',(64,80),align='feet')
cut('pdf','arvore',(254,700,323,775),'ambiente',(128,160),align='feet')
for name,box in [('amarela',(464,1400,493,1439)),('azul',(498,1400,530,1439)),('vermelha',(535,1400,565,1439)),('verde',(570,1400,600,1439))]:
    cut('pdf','chave-'+name,box,'objetos',(48,64))
cut('pdf','ilha-referencia',(16,317,518,660),'mapa',(768,576),False)
for name,box in [('grama',(21,706,46,731)),('pedra',(82,737,107,762)),('caminho',(56,772,84,800)),('agua',(117,710,152,745))]:
    im=sources['pdf'].crop(box).resize((64,64),Image.Resampling.NEAREST)
    save('tile-'+name,im,'ambiente/tiles',source='pdf; textura de teste, bordas não validadas como seamless')
for name,box in [('triangulo',(606,1248,642,1286)),('circulo',(656,1248,690,1286)),('quadrado',(703,1240,748,1287))]:
    cut('pdf','peca-'+name,box,'puzzles',(64,64))
for name,box in [('cinza',(470,1440,502,1476)),('verde',(540,1440,571,1476))]:
    cut('pdf','cadeado-'+name,box,'objetos',(48,64))

# O livro vazio é reaproveitável em configurações e tutorial.
book=sources['book']
save('livro-cenario',book.resize((1280,854),Image.Resampling.LANCZOS),'fundos',source='anexo livro vazio')
mask=Image.new('L',book.size,0)
ImageDraw.Draw(mask).polygon([(133,133),(179,109),(550,105),(632,138),(701,111),(1076,116),(1107,143),(1205,739),(1160,761),(667,748),(616,743),(560,742),(100,766),(64,732)],fill=255)
ImageDraw.Draw(mask).polygon([(548,696),(624,699),(636,795),(604,784),(565,817),(550,809)],fill=255)
isolated=book.copy();isolated.putalpha(mask)
save('livro-aberto',isolated,'ui/paineis',(1200,800),source='anexo livro vazio; recorte de contorno')
room=Image.open(GEN/'exec-e9c5ae2e-a432-44fd-9762-f27dcc179aea.png').convert('RGBA')
save('quarto-sem-interface',room.resize((1280,614),Image.Resampling.LANCZOS),'fundos',source='edição IA do quarto semifinal')
logo=Image.open(GEN/'exec-511aac24-558e-48fe-a537-f1365ec3b810.png').convert('RGBA')
save('logo-ilha-do-conhecimento',logo,'ui/logo',(640,384),source='extração IA do logo semifinal')

# Catálogo local, sem servidor, sem JSON.
cards=[]
for name,cat,size,source,path in entries:
    rel=path.relative_to(OUT).as_posix()
    cards.append(f'<article><div class="preview"><img src="{rel}" alt="{name}"></div><h2>{name}</h2><p>{cat} · {size[0]} × {size[1]}</p><a href="{rel}" download>Baixar PNG</a></article>')
(OUT/'catalogo.html').write_text('''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Assets — Ilha do Conhecimento</title><style>*{box-sizing:border-box}body{margin:0;padding:40px;background:#171824;color:#f3e4c5;font:14px system-ui}h1{font:36px Georgia;margin-bottom:8px}.intro{color:#c6b9a7;max-width:750px;line-height:1.7}button{padding:10px 16px;background:#f3dfb5;color:#332519;border:0;border-radius:5px;cursor:pointer}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:18px;margin-top:28px}article{background:#262736;border:1px solid #494657;border-radius:10px;overflow:hidden;padding:12px}.preview{height:190px;display:grid;place-items:center;border-radius:5px;background-color:#c8c8ca;background-image:conic-gradient(#eee 25%,transparent 0 50%,#eee 0 75%,transparent 0);background-size:20px 20px}.preview img{max-width:100%;max-height:170px;object-fit:contain;image-rendering:pixelated}h2{font-size:14px;overflow-wrap:anywhere}article p{font-size:12px;color:#bfb6ab}a{color:#9cdbaf}.dark .preview{background:#25283f}.light .preview{background:#fff1d5}footer{margin-top:30px;color:#bfb6ab}</style><h1>Ilha do Conhecimento</h1><p class="intro">Kit inicial de assets. Os botões vazios recebem texto em HTML. Transparência real nos sprites e proporção preservada. As poses da personagem e do gato são estáticas; ciclos completos ficam para outra etapa.</p><button id="background">Conferir fundo: quadriculado</button><main>'''+''.join(cards)+'''</main><footer>Fontes: anexos fornecidos e PDFs de assets. Quarto reconstruído e logo extraído com ferramenta de imagem. Sem mudanças no protótipo existente.</footer><script>let i=0;const names=['quadriculado','escuro','claro'];document.querySelector('button').onclick=()=>{i=(i+1)%3;document.body.className=['','dark','light'][i];document.querySelector('button').textContent='Conferir fundo: '+names[i]}</script></html>''',encoding='utf-8')

# Montagem para inspeção visual em três fundos, independente de acesso ao navegador.
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
cols=5;cell_w=270;cell_h=215
sheet=Image.new('RGB',(cols*cell_w,((len(entries)+cols-1)//cols)*cell_h),'#25283f')
draw=ImageDraw.Draw(sheet)
for index,(name,cat,size,source,path) in enumerate(entries):
    x=index%cols*cell_w;y=index//cols*cell_h
    draw.rectangle((x+5,y+5,x+cell_w-5,y+175),fill=['#fff1d5','#292c43','#9aa6a9'][index%3])
    im=Image.open(path);im.thumbnail((cell_w-20,160),Image.Resampling.NEAREST)
    sheet.paste(im,(x+(cell_w-im.width)//2,y+10+(160-im.height)//2),im)
    draw.text((x+10,y+181),name,fill='white',font=font)
    draw.text((x+10,y+200),f'{size[0]} x {size[1]}',fill='#c7bda8',font=font)
sheet.save(OUT/'conferencia.png')
lines=['# Kit inicial de assets','','Abra `catalogo.html` para conferir as imagens em fundos quadriculado, escuro e claro.','','## Padrões','','- Botões: 320 × 96; ícones: 64 × 64; personagens: 64 × 80, pés alinhados.','- Árvore: 128 × 160; chaves: 48 × 64; trilhos: 320 × 32.','- Redimensionamento uniforme com margem transparente, sem deformar proporções.','- Fundos têm largura de 1280; a altura respeita a proporção da fonte.','- PNG RGBA: fundo de papel removido por conexão às bordas, preservando interiores dos botões.','- Os desenhos de play e sair incluem sua placa colorida intencional.','','## Limites desta versão','','- Não é um pacote de gameplay completo: mapas de colisão, tiles conectáveis, peças de puzzles, cela separada e ciclos de caminhada ainda precisam de produção.','- As duas poses frontais dos personagens foram mantidas como alternativas, não rotuladas como direções ausentes.','- O mapa é uma referência visual composta, não um tilemap.','- O quarto teve as regiões cobertas por interface reconstruídas por IA; não é um recorte idêntico nesses pontos.','- Logo preparado com extração por IA; demais sprites recortados das fontes.','- Livro isolado por contorno: textura de página e sombras fazem parte do asset.','- O protótipo anterior permanece funcionando com seus próprios recortes. A integração dos novos assets é uma etapa posterior.','','## Arquivos','','| Arquivo | Tamanho | Origem |','| --- | --- | --- |']
for name,cat,size,source,path in entries:
    lines.append(f'| `{path.relative_to(OUT).as_posix()}` | {size[0]} × {size[1]} | {source} |')
(OUT/'README.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
registry=['// Caminhos relativos à pasta assets. Sem JSON e sem dependências.','window.ILHA_ASSETS = Object.freeze({']
for name,cat,size,source,path in entries:
    registry.append(f"  '{name}': Object.freeze({{ src: '{path.relative_to(OUT).as_posix()}', width: {size[0]}, height: {size[1]} }}),")
registry.append('});')
(OUT/'assets.js').write_text('\n'.join(registry)+'\n',encoding='utf-8')
print(f'{len(entries)} PNGs preparados em {OUT}')
