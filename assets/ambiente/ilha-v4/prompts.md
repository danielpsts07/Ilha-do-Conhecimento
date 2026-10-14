# Prompts da ambientação — versão 4

Ferramenta: ImageGen integrada ao Codex, modo padrão. Os três atlas foram gerados antes da integração no código. Fontes preservadas em `fontes/`; recorte e normalização técnica em `tools/preparar_ambientacao.py`.

## Construções

```text
Use case: stylized-concept.
Asset type: production-ready transparent pixel-art environment sprite atlas for an existing top-down 2D children's exploration RPG "Ilha do Conhecimento". This is one cohesive atlas image.
Primary request: exactly TWELVE isolated environment sprites in a strict FOUR COLUMN by THREE ROW equal-cell grid on a truly transparent background. NO cell lines, NO labels, NO text. Landscape 4:3 canvas, generous empty transparent gutters. All twelve assets fully visible, separate, no overlap, no clipping, centered in their individual cells, feet/base aligned near the bottom of each cell.
Style: carefully authored 16-bit adventure pixel art, visible clean square pixel clusters, charming small-town details, believable construction, slightly irregular silhouettes, restrained detail density, clear dark warm outlines, no smooth vector shapes, no rendering blur, no glossy 3D. Top-down RPG camera with visible roofs and south-facing facades, orthographic, NOT isometric. Consistent gentle afternoon lighting from top left, muted moss and olive green, warm cream plaster, terracotta red and dusty blue roofs, slate-grey stones, turquoise water, warm dark brown shadows. Scale designed for a 40-pixel-high visible child sprite at runtime.
Exact grid contents, reading left to right:
ROW 1: (1) cozy cottage, terracotta tiled roof, cream plaster and timber, two shutters, small potted flowers by the front door; (2) small village library, dusty blue tiled roof, cream-and-timber walls, a carved OPEN BOOK emblem above the door, NO lettering; (3) modest red timber farm barn, weathered boards, straw tucked by the door, warm tile roof; (4) friendly white-plaster windmill, slate foundation, timber roof, four straight wooden canvas sails, complete visible mill and sails, symmetrical functional geometry.
ROW 2: (5) ancient small stone portal arch, softly glowing lavender center, ivy creeping on one side, wide south-facing opening; (6) small circular village fountain, worn grey stone rim, clear turquoise pool, simple vertical water spout, NO surrounding ground slab; (7) compact village stone well with wooden posts, rope bucket, modest shingle shelter; (8) ancient sandstone ruin arch with two separate columns, unobstructed empty transparent passage, moss in cracks, convincing stone blocks.
ROW 3: (9) single antique sandstone column with a chipped capital and ivy at the base; (10) small broad slate rock outcrop, layered natural facets, moss and tiny ferns at its base; (11) a rectangular vegetable garden patch seen from above, four orderly rows of leafy carrots, brown earth, tiny wooden corner stakes, no border landscape; (12) a small wooden trail sign on a single short post, weathered warm timber, blank board, NO marks or lettering, tiny grass at base.
Constraints: real alpha transparency including the empty passage under the ruin arch; every item is a separately extractable cutout sprite; do not paint a checkerboard, do not include scenery around the sprites, no characters, no UI, no watermark, no logos, no written text. Keep silhouettes compact and legible at small scale.
```

## Vegetação e objetos

```text
Use case: stylized-concept.
Asset type: one production-ready transparent pixel-art vegetation and village-props sprite atlas for a top-down 2D children's exploration RPG.
Primary request: exactly TWELVE isolated landscape sprites in a strict FOUR COLUMN by THREE ROW equal-cell grid on a truly transparent background. NO labels, NO text, NO cell outlines, NO background scene. Generous transparent gutters, every complete sprite inside its own cell, feet aligned near cell bottoms, no overlaps or cropped silhouettes.
Style: carefully authored 16-bit adventure pixel art, clear square pixel clusters, natural asymmetry, restrained readable detailing, warm dark outlines. Orthographic top-down RPG camera with the south-facing side visible, NOT isometric. Gentle afternoon lighting from top left. Palette shared with cream-and-timber cottages, terracotta roofs, sandstone ruins, turquoise water: moss and olive leaf greens, emerald shadows, subtle sunny yellow leaves, warm dark brown wood and grey stones. Welcoming, calm, crafted, charming but no faces on objects.
Exact grid contents reading left to right:
ROW 1: (1) rounded leafy tree with a slightly irregular canopy, thick short trunk and exposed roots; (2) narrow young cypress tree, tall conical leafy silhouette and small visible trunk; (3) compact low flowering bush with small cream and yellow blooms; (4) compact low berry bush with just a few deep red berries.
ROW 2: (5) low mossy grey rock with a few small ferns; (6) old tree stump with visible growth rings and two small mushrooms at its base; (7) a loose wildflower cluster of cream, yellow and tiny lilac flowers with blades of grass, NO rectangular soil tile; (8) a small cluster of ferns and long meadow grass, NO soil tile.
ROW 3: (9) rustic little wooden bench, front-facing with seat top visible, believable five-plank construction; (10) short horizontal rustic two-rail wooden fence with three straight posts, viewed from the south; (11) one wooden barrel beside two stacked harvest crates containing a few carrots; (12) two small golden hay bales, one round and one square, bound with brown twine.
Constraints: real alpha transparency, no checkerboard painted into the image, no ground slabs around objects, no characters, no UI, no watermark, no red halos or selection outlines, no blurry shading, no glossy 3D, no disconnected decorative fragments. All props should remain recognizable at 35-70 px tall, trees at 130-150 px tall.
```

## Terrenos

```text
Use case: stylized-concept.
Asset type: ONE pixel-art terrain texture atlas, an opaque rectangle split into exactly THREE COLUMNS and TWO ROWS of equally sized square seamless repeatable texture swatches.
Primary request: six subtle, flat top-down terrain textures for a friendly 16-bit exploration RPG, consistent with pixel-art cream-and-timber cottages, mossy rocks and leafy trees. Each swatch fills its square to the very edge. No gutters, no frames, no grid lines, no labels. Texture only: no objects, no trees, no buildings, no paths with directional outlines, no raised cubes, no isolated floating tiles.
Exact grid left to right:
TOP ROW: (1) softly varied meadow grass, muted olive green, sparse tiny grass-pixel clusters, underlying color around #87a15b; (2) shaded forest floor grass, deeper moss green around #6c8749, few tiny leafy marks, calm broad color areas; (3) compact warm ochre walking-path earth, worn smooth dirt around #c5a570, subtle small pebbles and irregular worn patches.
BOTTOM ROW: (4) light warm sandy soil around #dfc58f, delicate sparse sandy pixel texture; (5) gently worn small irregular stone paving, desaturated grey-green around #9da68f, low contrast joints, occasional moss between stones; (6) calm turquoise water around #58adbb, several sparse short light turquoise horizontal ripple clusters, without foam or shore.
Style: real square pixel clusters, crisp raster edges, limited earthy palette, readable at 64x64 runtime resolution. Subtle texture density and calm color, no over-detailed noise, no smooth gradients, no painting blur. All six swatches are flat top-down ground planes; lighting uniform. Individually seamless and tileable on all four edges: identical underlying color and pattern continuity across opposite edges. No text, watermark, logos, checkerboard or transparency.
```
