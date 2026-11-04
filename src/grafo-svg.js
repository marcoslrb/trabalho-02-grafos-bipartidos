"use strict";
/*
 * Desenho do grafo em SVG (texto puro, sem DOM), usado pela aplicação e pelos slides.
 *
 * Duas informações visuais INDEPENDENTES:
 *  - TIPO do vértice: retângulo = CODIGO (coluna FUNÇÕES), círculo = TESTE (coluna TESTES).
 *    Também aparece em texto (título do vértice e cabeçalho das colunas), não só pela forma.
 *  - COR da BFS: preenchimento azul-petróleo (cor 0), laranja (cor 1) ou cinza (não visitado),
 *    com o número escrito dentro do vértice, para não depender só da cor.
 */
(function (exportar) {
  const esc = valor => String(valor).replace(/[&<>"']/g,
    ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  const COR_BFS = { "-1": "#737b82", "0": "#116b74", "1": "#a45209" };
  const VERMELHO = "#aa2442";

  /**
   * @param grafo     grafo da análise
   * @param estado    { cor, u, v } do passo atual da BFS (ou null)
   * @param alteradas Set com as funções selecionadas
   * @param ciclo     vértices do ciclo ímpar a destacar (ou [])
   * Todo texto vindo do TXT passa por esc(): rótulos nunca são interpretados como HTML.
   */
  function desenharGrafo(grafo, estado = null, alteradas = new Set(), ciclo = []) {
    const codigos = grafo.vertices.filter(n => n.tipo === "CODIGO");
    const testes = grafo.vertices.filter(n => n.tipo === "TESTE");
    const maior = Math.max(codigos.length, testes.length);
    const passo = maior > 12 ? 52 : 74;
    const altura = Math.max(320, maior * passo + 110);
    const X_CODIGO = 190, X_TESTE = 750;

    const pos = new Map();
    for (const [lista, x] of [[codigos, X_CODIGO], [testes, X_TESTE]])
      lista.forEach((n, i) => pos.set(n.id, { x, y: 90 + i * passo }));

    const par = (a, b) => [a, b].sort().join("|");
    const arestasCiclo = new Set();
    for (let i = 1; i < ciclo.length; i++) arestasCiclo.add(par(ciclo[i - 1], ciclo[i]));
    const noCiclo = new Set(ciclo);

    let arestas = "";
    for (const e of grafo.arestas) {
      const a = pos.get(e.u), b = pos.get(e.v);
      const mesmoTipo = grafo.porId.get(e.u).tipo === grafo.porId.get(e.v).tipo; // violação semântica
      const emCiclo = arestasCiclo.has(par(e.u, e.v));
      const atual = estado && ((estado.u === e.u && estado.v === e.v) || (estado.u === e.v && estado.v === e.u));
      const relacionada = alteradas.has(e.u) || alteradas.has(e.v);
      const cor = emCiclo || mesmoTipo ? VERMELHO : atual ? "#a45209" : relacionada ? "#6a4c93" : "#a4acb1";
      const largura = emCiclo || atual ? 5 : relacionada ? 3 : 2;
      // Aresta entre vértices da mesma coluna é curva, abrindo para FORA da coluna.
      const lado = a.x === X_CODIGO ? -1 : 1;
      const caminho = a.x === b.x
        ? `M ${a.x} ${a.y} Q ${a.x + lado * 150} ${(a.y + b.y) / 2} ${b.x} ${b.y}`
        : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
      const tracejado = mesmoTipo && !emCiclo ? ' stroke-dasharray="8 5"' : "";
      arestas += `<path d="${caminho}" fill="none" stroke="${cor}" stroke-width="${largura}"${tracejado}>` +
        `<title>${esc(e.u)} — ${esc(e.v)}${mesmoTipo ? " (liga o mesmo tipo: viola a regra CODIGO–TESTE)" : ""}</title></path>`;
    }

    let nos = "";
    for (const n of grafo.vertices) {
      const { x, y } = pos.get(n.id);
      const c = estado && estado.cor ? estado.cor[n.id] : -1;
      const fill = COR_BFS[c];
      const rotuloCor = c === -1 ? "cor —" : `cor ${c}`;
      const alterada = alteradas.has(n.id);
      const atual = estado && (estado.u === n.id || estado.v === n.id);
      const contorno = noCiclo.has(n.id) ? VERMELHO : alterada ? "#172c37" : atual ? "#e0a100" : "#ffffff";
      const espessura = noCiclo.has(n.id) || alterada || atual ? 4 : 2;
      const forma = n.tipo === "CODIGO"
        ? `<rect x="${x - 57}" y="${y - 25}" width="114" height="50" rx="7"/>`
        : `<circle cx="${x}" cy="${y}" r="28"/>`;
      const rotulo = n.rotulo.length > 27 ? n.rotulo.slice(0, 24) + "…" : n.rotulo;
      nos += `<g><title>${esc(n.id)} — ${esc(n.rotulo)}; tipo ${esc(n.tipo)}; ${rotuloCor}${alterada ? "; função alterada" : ""}</title>` +
        `<g fill="${fill}" stroke="${contorno}" stroke-width="${espessura}">${forma}</g>` +
        `<text x="${x}" y="${y + 1}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="17" font-weight="700">${esc(n.id)}</text>` +
        `<text x="${x}" y="${y + 16}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="11">${rotuloCor}</text>` +
        (alterada ? `<text x="${x + (n.tipo === "CODIGO" ? 57 : 28)}" y="${y - (n.tipo === "CODIGO" ? 27 : 24)}" text-anchor="end" fill="currentColor" font-family="sans-serif" font-size="12" font-weight="700">ALTERADA</text>` : "") +
        `<text x="${x}" y="${y + 45}" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="13">${esc(rotulo)}</text></g>`;
    }

    const vazio = grafo.vertices.length === 0
      ? `<text x="470" y="170" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="18">Grafo vazio: nenhum vértice declarado.</text>` : "";

    return `<svg viewBox="0 0 940 ${altura}" role="img" aria-label="Grafo de funções (retângulos) e testes (círculos)">` +
      `<text x="${X_CODIGO}" y="30" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="18" font-weight="700">FUNÇÕES (CODIGO) ▭</text>` +
      `<text x="${X_TESTE}" y="30" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="18" font-weight="700">TESTES (TESTE) ◯</text>` +
      `${vazio}${arestas}${nos}</svg>`;
  }

  exportar({ esc, desenharGrafo });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.GrafoSvg = o; });

