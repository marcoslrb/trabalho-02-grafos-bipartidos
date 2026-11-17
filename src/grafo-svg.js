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
    const compacto = maior > 12;
    const passo = compacto ? 56 : 114;
    const inicioY = compacto ? 76 : 100;
    const altura = Math.max(340, inicioY + Math.max(0, maior - 1) * passo + (compacto ? 64 : 74));
    const larguraSvg = compacto ? 940 : 720;
    const X_CODIGO = compacto ? 210 : 165;
    const X_TESTE = compacto ? 740 : 565;
    const rectW = compacto ? 114 : 154;
    const rectH = compacto ? 46 : 60;
    const circR = compacto ? 24 : 36;

    const pos = new Map();
    for (const [lista, x] of [[codigos, X_CODIGO], [testes, X_TESTE]])
      lista.forEach((n, i) => pos.set(n.id, { x, y: inicioY + i * passo }));

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
      const largura = emCiclo || atual ? 5 : relacionada ? 3.2 : 2.2;
      // Aresta entre vértices da mesma coluna sai pela borda externa, formando um arco visível fora dos nós.
      const lado = a.x === X_CODIGO ? -1 : 1;
      const xBorda = a.x + lado * (a.x === X_CODIGO ? rectW / 2 : circR);
      const abertura = Math.min(130, 55 + Math.abs(b.y - a.y) * 0.35);
      const caminho = a.x === b.x
        ? `M ${xBorda} ${a.y} Q ${xBorda + lado * abertura} ${(a.y + b.y) / 2} ${xBorda} ${b.y}`
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
      const contorno = noCiclo.has(n.id) ? VERMELHO : atual ? "#e0a100" : alterada ? "currentColor" : "#ffffff";
      const espessura = noCiclo.has(n.id) || alterada || atual ? 4 : 2;
      const forma = n.tipo === "CODIGO"
        ? `<rect x="${x - rectW / 2}" y="${y - rectH / 2}" width="${rectW}" height="${rectH}" rx="9"/>`
        : `<circle cx="${x}" cy="${y}" r="${circR}"/>`;
      const rotulo = n.rotulo.length > 27 ? n.rotulo.slice(0, 24) + "…" : n.rotulo;
      nos += `<g><title>${esc(n.id)} — ${esc(n.rotulo)}; tipo ${esc(n.tipo)}; ${rotuloCor}${alterada ? "; função alterada" : ""}</title>` +
        `<g fill="${fill}" stroke="${contorno}" stroke-width="${espessura}">${forma}</g>` +
        `<text x="${x}" y="${y + (compacto ? 0 : -1)}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="${compacto ? 17 : 22}" font-weight="700">${esc(n.id)}</text>` +
        `<text x="${x}" y="${y + (compacto ? 15 : 19)}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="${compacto ? 12 : 15}" font-weight="600">${rotuloCor}</text>` +
        (alterada ? `<text x="${x + (n.tipo === "CODIGO" ? rectW / 2 : circR)}" y="${y - (n.tipo === "CODIGO" ? rectH / 2 + 6 : circR + 6)}" text-anchor="end" fill="currentColor" font-family="sans-serif" font-size="${compacto ? 11.5 : 13}" font-weight="700" letter-spacing="0.5">ALTERADA</text>` : "") +
        `<text x="${x}" y="${y + (n.tipo === "CODIGO" ? rectH / 2 + 20 : circR + 20)}" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="${compacto ? 13 : 17}" font-weight="600">${esc(rotulo)}</text></g>`;
    }

    const vazio = grafo.vertices.length === 0
      ? `<text x="${larguraSvg / 2}" y="170" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="20">Grafo vazio: nenhum vértice declarado.</text>` : "";

    return `<svg viewBox="0 0 ${larguraSvg} ${altura}" role="img" aria-label="Grafo de funções (retângulos) e testes (círculos)">` +
      `<text x="${X_CODIGO}" y="34" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="${compacto ? 18 : 21}" font-weight="700">FUNÇÕES (CODIGO) ▭</text>` +
      `<text x="${X_TESTE}" y="34" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-size="${compacto ? 18 : 21}" font-weight="700">TESTES (TESTE) ◯</text>` +
      `${vazio}${arestas}${nos}</svg>`;
  }

  exportar({ esc, desenharGrafo });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.GrafoSvg = o; });

