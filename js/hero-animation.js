/* Escolhe a coluna da folha da personagem a cada tick (60 por segundo).
   Folha menina-caminhada-8.png: colunas 0–3 = passo A (apoio, desce, passagem, sobe),
   4–7 = passo B, 8–9 = respiração parada. Sem DOM: testável fora do navegador. */
window.HeroAnimation = (() => {
  'use strict';
  const FRAMES_PER_STEP = 4, IDLE = 8;
  function column(p, calm) {
    if(p.moving) {
      // Quadro preso ao progresso do passo: 4 quadros iguais em qualquer velocidade.
      const phase = Math.min(FRAMES_PER_STEP - 1, Math.floor((p.prog - 1) / p.dur * FRAMES_PER_STEP));
      const shown = calm ? phase & ~1 : phase; // Menos animações: sem os quadros de sobe/desce.
      return (p.steps % 2) * FRAMES_PER_STEP + shown;
    }
    if(p.walk > 0) {
      // Andando no lugar (encostada numa parede): mesmo ciclo, 4 ticks por quadro.
      const index = Math.floor((p.walk - 1) / TICKS_PER_FRAME) % 8;
      return calm ? index & ~1 : index;
    }
    if(calm) return IDLE;
    return IDLE + Math.floor((p.idle || 0) / IDLE_BREATH_TICKS) % 2;
  }
  return Object.freeze({column, IDLE});
})();
