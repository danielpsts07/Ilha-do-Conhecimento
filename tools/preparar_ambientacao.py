"""Recorta atlas gerados e normaliza PNGs, preservando proporção e alpha.

Não desenha nem reconstrói imagens. As fontes ficam preservadas no projeto.
Uso: python tools/preparar_ambientacao.py
"""
from pathlib import Path
from PIL import Image, ImageDraw
import shutil
import html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'ambiente' / 'ilha-v4'
SOURCES = OUT / 'fontes'
GENERATED = Path(r'C:\Users\Daniel\.codex\generated_images\01a1377f-98c5-7ad3-94bd-a128545460fe')
FILES = {
    'construcoes.png': 'exec-ef6d7543-6f6d-4b36-8735-21f9117dfc44.png',
    'vegetacao.png': 'exec-c80f5b8f-4118-458e-a92f-3fe29a0623b9.png',
    'terrenos.png': 'exec-0843bd86-f9bd-45ae-8550-6423a4ac6118.png',
}

# As linhas dos atlas de sprites não têm alturas iguais: os recortes são
# medidos na imagem, em vez de presumir a disposição solicitada ao gerador.
STRUCTURES = [
    ('casa', (0,0,362,420), (192,176)),
    ('biblioteca', (362,0,724,420), (240,208)),
    ('celeiro', (724,0,1086,420), (240,216)),
    ('moinho', (1086,0,1448,420), (208,256)),
    ('portal', (0,420,362,754), (144,152)),
    ('fonte', (362,420,750,754), (152,112)),
    ('poco', (750,420,1080,754), (96,104)),
    ('arco', (1080,420,1448,754), (176,160)),
    ('coluna', (0,754,362,1086), (72,120)),
    ('rochedo', (362,754,724,1086), (192,128)),
    ('horta', (724,754,1086,1086), (192,144)),
    ('placa', (1112,754,1448,1086), (56,64)),
]
PROPS = [
    ('arvore-copa', (0,0,442,514), (128,160)),
    ('arvore-cipreste', (442,0,728,514), (88,160)),
    ('arbusto-florido', (728,0,1080,514), (72,64)),
    ('arbusto-frutas', (1080,0,1448,514), (72,64)),
    ('pedra-musgo', (0,514,412,788), (56,40)),
    ('toco', (412,514,728,788), (64,52)),
    ('flores', (728,514,1080,788), (48,40)),
    ('samambaia', (1080,514,1448,788), (48,40)),
    ('banco', (0,788,355,1086), (96,64)),
    ('cerca', (355,788,742,1086), (112,56)),
    ('colheita', (742,788,1080,1086), (72,64)),
    ('feno', (1080,788,1448,1086), (64,48)),
]
TERRAINS = ['grama','grama-floresta','terra','areia','pedra','agua']

def normalize(im, size):
    """Escala uniforme, nearest-neighbor e pés na mesma linha da caixa."""
    visible = im.getchannel('A').point(lambda a: 255 if a > 16 else 0)
    bounds = visible.getbbox()
    if not bounds:
        raise ValueError('Recorte sem sprite visível')
    crop = im.crop(bounds)
    factor = min((size[0]-4)/crop.width, (size[1]-4)/crop.height)
    crop = crop.resize((round(crop.width*factor), round(crop.height*factor)), Image.Resampling.NEAREST)
    result = Image.new('RGBA',size)
    result.alpha_composite(crop, ((size[0]-crop.width)//2, size[1]-crop.height-2))
    return result

def main():
    SOURCES.mkdir(parents=True, exist_ok=True)
    for target, name in FILES.items():
        dest = SOURCES / target
        if not dest.exists():
            shutil.copy2(GENERATED / name, dest)
    items=[]
    for source, entries in [('construcoes.png', STRUCTURES), ('vegetacao.png', PROPS)]:
        atlas=Image.open(SOURCES/source).convert('RGBA')
        for name, bounds, size in entries:
            sprite=normalize(atlas.crop(bounds),size)
            low,high=sprite.getchannel('A').getextrema()
            assert low==0 and high>=240,name
            sprite.save(OUT/(name+'.png'))
            items.append((name,sprite))
    atlas=Image.open(SOURCES/'terrenos.png').convert('RGB')
    assert atlas.size==(1536,1024)
    for index,name in enumerate(TERRAINS):
        x=(index%3)*512;y=(index//3)*512
        tile=atlas.crop((x,y,x+512,y+512)).resize((96,96),Image.Resampling.NEAREST)
        tile.save(OUT/('terreno-'+name+'.png'))
        items.append(('terreno-'+name,tile.convert('RGBA')))
    # Contato em fundo neutro para inspeção de alpha, recortes e escala.
    preview=Image.new('RGB',(960,6*208),'#eee1bc')
    draw=ImageDraw.Draw(preview)
    for i,(name,im) in enumerate(items):
        col=i%5;row=i//5;left=col*192;top=row*208
        factor=min(172/im.width,170/im.height)
        thumb=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
        preview.paste(thumb,(left+(192-thumb.width)//2,top+170-thumb.height),thumb)
        draw.text((left+10,top+181),name,fill='#51432f')
    preview.save(OUT/'conferencia.jpg',quality=95)
    cards=[]
    for name,im in items:
        label=html.escape(name)
        cards.append(f'<article><div class="preview"><img src="{label}.png" alt="{label}"></div><h2>{label}</h2><p>{im.width} × {im.height}</p><a href="{label}.png" download>Baixar PNG</a></article>')
    gallery='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ambientação — Ilha do Conhecimento</title><style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#233a31;color:#f3dfb8;font:14px system-ui}h1{font:32px Georgia}a{color:#e7d195}p{line-height:1.6;max-width:780px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-top:24px}article{padding:14px;background:#344c3d;border:1px solid #5b6e50;border-radius:5px}.preview{height:190px;display:grid;place-items:center;background:#eee1bc;border-radius:4px}.preview img{max-width:95%;max-height:180px;object-fit:contain;image-rendering:pixelated}h2{font-size:14px}article p{font-size:12px;margin:5px 0 10px}button{padding:10px;background:#e9d3a0;border:0;border-radius:4px;color:#51432f;font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #ffe288;outline-offset:3px}.dark .preview{background:#1d3029}.checker .preview{background-color:#bbb;background-image:conic-gradient(#eee 25%,transparent 0 50%,#eee 0 75%,transparent 0);background-size:16px 16px}footer{margin-top:28px;font-size:12px}</style></head><body><a href="../../catalogo.html">← Catálogo original</a><h1>Uma ilha com vida</h1><p>30 imagens de ambientação: construções, vegetação, objetos e seis texturas. Sprites com alpha real, proporções preservadas e base alinhada. Fontes geradas com ImageGen; <a href="prompts.md">prompts completos</a> e atlas preservados na pasta fontes.</p><button id="background">Fundo: claro</button><main>'''
    gallery+=''.join(cards)
    gallery+='''</main><footer>Os novos PNGs são locais. As texturas estão preparadas para uso repetido; inspecione o resultado no renderer ao mudar sua escala.</footer><script>let state=0;const names=['claro','escuro','quadriculado'];document.querySelector('button').onclick=()=>{state=(state+1)%3;document.body.className=['','dark','checker'][state];document.querySelector('button').textContent='Fundo: '+names[state]}</script></body></html>'''
    (OUT/'catalogo.html').write_text(gallery,encoding='utf-8')
    print('30 imagens preparadas; 24 sprites com alpha real e 6 texturas de 96 x 96.')

if __name__=='__main__':
    main()
