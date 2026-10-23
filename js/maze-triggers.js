/* =========================================================================
   SISTEMA DE GATILHOS E COLISÃO DO LABIRINTO DA MEMÓRIA (MazeTriggerSystem)
   Projeto: Ilha do Conhecimento
   Responsabilidade:
   - Definição geométrica das sebes verdes (paredes de colisão) em cada fase.
   - Posição e renderização dos pedestais de pedra cinzenta e lajetas.
   - Distribuição dinâmica da runa correta e distratores em cada fase.
   - Detecção de passagem/entrada nos corredores para acionar avanços ou reset.
   ========================================================================= */

window.MazeTriggerSystem = (() => {
  'use strict';

  // Lista oficial das 6 runas místicas
  const RUNES = Object.freeze(['flor', 'folha', 'estrela', 'lua', 'borboleta', 'pata']);

  // Metadados das runas: coordenadas no sprite sheet (1024×1024, 3 colunas × 2 linhas) e cores
  const RUNE_INFO = Object.freeze({
    estrela: {
      id: 'estrela',
      label: 'Estrela',
      color: '#facc15',
      glow: 'rgba(250, 204, 21, 0.85)',
      col: 0,
      row: 0
    },
    lua: {
      id: 'lua',
      label: 'Lua',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.85)',
      col: 1,
      row: 0
    },
    flor: {
      id: 'flor',
      label: 'Flor',
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.85)',
      col: 2,
      row: 0
    },
    folha: {
      id: 'folha',
      label: 'Folha',
      color: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.85)',
      col: 0,
      row: 1
    },
    borboleta: {
      id: 'borboleta',
      label: 'Borboleta',
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.85)',
      col: 1,
      row: 1
    },
    pata: {
      id: 'pata',
      label: 'Pata',
      color: '#fb923c',
      glow: 'rgba(251, 146, 60, 0.85)',
      col: 2,
      row: 1
    }
  });

  // Dimensão do espaço de design (16:9, exatamente como os backgrounds gerados)
  const DESIGN_W = 1376;
  const DESIGN_H = 768;

  // Embaralha um array sem mutar o original (Fisher-Yates)
  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* -------------------------------------------------------------------------
     CONFIGURAÇÃO DAS FASES (Geometria, Paredes, Pedestais e Gatilhos)
     ------------------------------------------------------------------------- */
  const PHASE_CONFIGS = {
    // FASE 1: BIFURCAÇÃO (2 CAMINHOS: Esquerda e Direita)
    1: {
      name: 'Fase 1: Bifurcação',
      spawn: { x: 688, y: 670, dir: 'up' },
      pedestalY: 480,
      paths: [
        {
          id: 'left',
          label: 'Caminho da Esquerda',
          pedestal: { x: 280, y: 480 },
          trigger: { xMin: 0, xMax: 170, yMin: 360, yMax: 540 }
        },
        {
          id: 'right',
          label: 'Caminho da Direita',
          pedestal: { x: 1096, y: 480 },
          trigger: { xMin: 1210, xMax: 1376, yMin: 360, yMax: 540 }
        }
      ],
      walls: [
        // Sebes inferiores do corredor de entrada
        { x: 0, y: 520, w: 610, h: 248 },
        { x: 766, y: 520, w: 610, h: 248 },
        // Parede central bloqueando a frente
        { x: 380, y: 0, w: 616, h: 420 },
        // Sebes superiores das alas laterais
        { x: 0, y: 0, w: 380, h: 360 },
        { x: 996, y: 0, w: 380, h: 360 }
      ]
    },

    // FASE 2: TRIFURCAÇÃO (3 CAMINHOS: Esquerda, Frente/Centro, Direita)
    2: {
      name: 'Fase 2: Trifurcação',
      spawn: { x: 688, y: 670, dir: 'up' },
      pedestalY: 480,
      paths: [
        {
          id: 'left',
          label: 'Caminho da Esquerda',
          pedestal: { x: 280, y: 480 },
          trigger: { xMin: 0, xMax: 170, yMin: 360, yMax: 540 }
        },
        {
          id: 'center',
          label: 'Caminho da Frente',
          pedestal: { x: 570, y: 290 },
          trigger: { xMin: 600, xMax: 776, yMin: 0, yMax: 140 }
        },
        {
          id: 'right',
          label: 'Caminho da Direita',
          pedestal: { x: 1096, y: 480 },
          trigger: { xMin: 1210, xMax: 1376, yMin: 360, yMax: 540 }
        }
      ],
      walls: [
        // Sebes inferiores do corredor de entrada
        { x: 0, y: 520, w: 610, h: 248 },
        { x: 766, y: 520, w: 610, h: 248 },
        // Blocos divisores entre corredor central e alas laterais
        { x: 380, y: 150, w: 230, h: 270 },
        { x: 766, y: 150, w: 230, h: 270 },
        // Sebes superiores das alas laterais
        { x: 0, y: 0, w: 380, h: 360 },
        { x: 996, y: 0, w: 380, h: 360 },
        // Paredes que fecham o topo fora do corredor central
        { x: 0, y: 0, w: 600, h: 150 },
        { x: 776, y: 0, w: 600, h: 150 }
      ]
    },

    // FASE 3: QUADRIFURCAÇÃO (4 CAMINHOS: Esquerda, Frente-Esquerda, Frente-Direita, Direita)
    3: {
      name: 'Fase 3: Quadrifurcação',
      spawn: { x: 688, y: 670, dir: 'up' },
      paths: [
        {
          id: 'left',
          label: 'Caminho da Esquerda',
          pedestal: { x: 260, y: 480 },
          trigger: { xMin: 0, xMax: 170, yMin: 360, yMax: 540 }
        },
        {
          id: 'center-left',
          label: 'Caminho Frente-Esquerda',
          pedestal: { x: 450, y: 300 },
          trigger: { xMin: 460, xMax: 610, yMin: 0, yMax: 140 }
        },
        {
          id: 'center-right',
          label: 'Caminho Frente-Direita',
          pedestal: { x: 926, y: 300 },
          trigger: { xMin: 766, xMax: 916, yMin: 0, yMax: 140 }
        },
        {
          id: 'right',
          label: 'Caminho da Direita',
          pedestal: { x: 1116, y: 480 },
          trigger: { xMin: 1210, xMax: 1376, yMin: 360, yMax: 540 }
        }
      ],
      walls: [
        // Sebes inferiores do corredor de entrada
        { x: 0, y: 520, w: 610, h: 248 },
        { x: 766, y: 520, w: 610, h: 248 },
        // Pilar central dividindo os dois corredores frontais
        { x: 620, y: 150, w: 136, h: 270 },
        // Blocos laterais separando as alas
        { x: 270, y: 150, w: 180, h: 270 },
        { x: 926, y: 150, w: 180, h: 270 },
        // Sebes superiores das alas
        { x: 0, y: 0, w: 380, h: 360 },
        { x: 996, y: 0, w: 380, h: 360 },
        // Paredes no topo fora dos corredores abertos
        { x: 0, y: 0, w: 460, h: 140 },
        { x: 610, y: 0, w: 156, h: 140 },
        { x: 916, y: 0, w: 460, h: 140 }
      ]
    },

    // CÂMARA FINAL: CLAREIRA CIRCULAR COM CHAVE E PORTAL MÍSTICO
    4: {
      name: 'Câmara da Memória',
      spawn: { x: 688, y: 660, dir: 'up' },
      keyPedestal: { x: 688, y: 425 },
      portal: { x: 688, y: 145, radius: 46 },
      walls: [
        // Limites externos que contornam a clareira circular e o corredor norte
        { x: 0, y: 520, w: 580, h: 248 },
        { x: 796, y: 520, w: 580, h: 248 },
        { x: 0, y: 0, w: 580, h: 360 },
        { x: 796, y: 0, w: 580, h: 360 },
        // Paredes do corredor norte do portal
        { x: 0, y: 0, w: 610, h: 200 },
        { x: 766, y: 0, w: 610, h: 200 }
      ]
    }
  };

  /* -------------------------------------------------------------------------
     CONFIGURAÇÃO DINÂMICA DA RODADA
     Sortear caminhos corretos e distratores para a fase atual
     ------------------------------------------------------------------------- */
  function setupPhase(phaseNumber, correctRuneId) {
    const config = PHASE_CONFIGS[phaseNumber];
    if (!config || !config.paths) return null;

    const pathCount = config.paths.length;
    // Sorteia dinamicamente qual caminho conterá a runa correta
    const correctPathIndex = Math.floor(Math.random() * pathCount);

    // Seleciona runas distratoras distintas que não sejam a runa correta
    const otherRunes = shuffle(RUNES.filter(r => r !== correctRuneId));

    // Monta a lista de caminhos ativos com suas runas vinculadas
    const activePaths = config.paths.map((p, index) => {
      const isCorrect = index === correctPathIndex;
      const runeId = isCorrect ? correctRuneId : otherRunes.pop();
      const runeInfo = RUNE_INFO[runeId];
      return {
        ...p,
        pathIndex: index,
        isCorrect,
        runeId,
        rune: runeInfo
      };
    });

    return {
      phaseNumber,
      name: config.name,
      spawn: { ...config.spawn },
      activePaths,
      correctPathIndex,
      correctRuneId,
      walls: config.walls
    };
  }

  /* -------------------------------------------------------------------------
     COLISÃO CONTRA SEBES (Sliding Box-Circle Collision)
     Mantém a personagem dentro dos caminhos andáveis de forma suave
     ------------------------------------------------------------------------- */
  function resolveWallCollision(phaseNumber, px, py, radius = 16) {
    const config = PHASE_CONFIGS[phaseNumber];
    if (!config) return { x: px, y: py };

    let x = px;
    let y = py;

    // Limites da tela
    x = Math.max(radius, Math.min(DESIGN_W - radius, x));
    y = Math.max(radius, Math.min(DESIGN_H - 10, y));

    const walls = config.walls || [];
    for (let iter = 0; iter < 2; iter++) {
      for (const w of walls) {
        // Ponto mais próximo do retângulo da cerca
        const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(y, w.y + w.h));

        const dx = x - closestX;
        const dy = y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          x += (dx / dist) * overlap;
          y += (dy / dist) * overlap;
        } else if (distSq === 0) {
          // Personagem dentro da caixa (caso raro): empurra para fora
          y += radius;
        }
      }
    }

    // Se estiver na câmara da chave, o pedestal central bloqueia colisão física
    if (phaseNumber === 4 && config.keyPedestal) {
      const kp = config.keyPedestal;
      const dx = x - kp.x;
      const dy = y - (kp.y + 10);
      const distSq = dx * dx + dy * dy;
      const pRad = 28;
      if (distSq < pRad * pRad) {
        const dist = Math.sqrt(distSq) || 0.001;
        x = kp.x + (dx / dist) * pRad;
        y = kp.y + 10 + (dy / dist) * pRad;
      }
    }

    return { x, y };
  }

  /* -------------------------------------------------------------------------
     VERIFICAÇÃO DE GATILHOS DE CORREDOR
     Checa se a jogadora entrou em alguma zona de gatilho
     ------------------------------------------------------------------------- */
  function checkTriggers(activePaths, px, py) {
    if (!activePaths) return null;
    for (const p of activePaths) {
      const t = p.trigger;
      if (px >= t.xMin && px <= t.xMax && py >= t.yMin && py <= t.yMax) {
        return {
          pathIndex: p.pathIndex,
          isCorrect: p.isCorrect,
          runeId: p.runeId,
          rune: p.rune,
          label: p.label
        };
      }
    }
    return null;
  }

  /* -------------------------------------------------------------------------
     VERIFICAÇÃO DE INTERAÇÃO COM A CHAVE E PORTAL (Fase 4)
     ------------------------------------------------------------------------- */
  function checkKeyProximity(px, py) {
    const config = PHASE_CONFIGS[4];
    if (!config || !config.keyPedestal) return false;
    const dx = px - config.keyPedestal.x;
    const dy = py - config.keyPedestal.y;
    return Math.hypot(dx, dy) <= 65;
  }

  function checkPortalCollision(px, py) {
    const config = PHASE_CONFIGS[4];
    if (!config || !config.portal) return false;
    const p = config.portal;
    return Math.hypot(px - p.x, py - p.y) <= 50;
  }

  return Object.freeze({
    RUNES,
    RUNE_INFO,
    DESIGN_W,
    DESIGN_H,
    PHASE_CONFIGS,
    shuffle,
    setupPhase,
    resolveWallCollision,
    checkTriggers,
    checkKeyProximity,
    checkPortalCollision
  });
})();
