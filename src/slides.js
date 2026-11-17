"use strict";
/*
 * Conteúdo e motor interativo da apresentação seguindo fielmente o
 * `modelo2-apresentacao-institucional.ppt` do Prof. Rafael Vargas Mesquita (Ifes).
 *
 * Identidade visual do modelo2-apresentacao-institucional.ppt:
 *  - Barra de 5 blocos do Ifes (#8ec627, #d01118, #319938, #8ec627, #319938 no topo da capa;
 *    #319938, #8ec627, #319938, #d01118, #8ec627 na base com degradê suave para o branco).
 *  - Marca oficial "INSTITUTO FEDERAL Espírito Santo" no canto inferior direito e no slide final.
 *  - Capa limpa com título em verde-escuro (#006400), subtítulo em verde (#006808) e autores em verde-limão (#62b412).
 *  - Slides de Contextualização e Aplicação com título em vermelho (#f22626) e tópicos em cinza (#525252).
 *  - Slides de Solução (Demonstração, Implementação, Interface Gráfica) com cabeçalho no topo
 *    em vermelho (#f22626) e subtítulo do arquivo em verde (#00994d), liberando toda a largura para o visual.
 *  - Slide de Implementação no estilo Sedgewick/Prof. Rafael: quadro de código cinza (#cccccc),
 *    faixa branca destacando o bloco ativo e setas vinho (←───) apontando para as linhas.
 *  - Slides Teste de Mesa :: Início e Término no layout de 4 colunas do professor:
 *    Grafo G + matriz adj[] pontilhada (branca no Início, salmão #f28b82 no Término) + código + Fila + tabela de vetores em vermelho.
 */
(function (exportar) {
  const N = typeof require === "function" ? require("./nucleo.js") : globalThis.Nucleo;
  const S = typeof require === "function" ? require("./grafo-svg.js") : globalThis.GrafoSvg;
  const { analisarTxt, executarBfs, validarSemantica, consultarImpacto, ACAO, LIMITE_RASTREAMENTO } = N;
  const { esc, desenharGrafo } = S;

  // Cenário mínimo para separar ESTRUTURA de SEMÂNTICA:
  // C1–C2–T1 é um caminho (portanto bipartido), mas C1–C2 liga duas funções.
  const TXT_SEMANTICA = [
    "V;C1;CODIGO;calcularDesconto",
    "V;C2;CODIGO;validarCupom",
    "V;T1;TESTE;testeDesconto",
    "E;C1;C2",
    "E;C2;T1"
  ].join("\n");

  /* ------------------------------------------------------------------ */
  /* Marca Institucional do Ifes e Figuras do Modelo do Professor        */
  /* ------------------------------------------------------------------ */

  /** Logo oficial do Instituto Federal do Espírito Santo em SVG vetorial puro. */
  function svgLogoIfes(classe = "ifes-logo-canto") {
    const q = (col, lin) =>
      `<rect x="${col * 16}" y="${lin * 16}" width="13.5" height="13.5" rx="2.2" fill="#319938"/>`;
    return `<svg class="${classe}" viewBox="0 0 250 66" role="img" aria-label="Instituto Federal Espírito Santo">` +
      `<circle cx="6.75" cy="6.75" r="6.75" fill="#d01118"/>` +
      q(1, 0) + q(2, 0) +
      q(0, 1) + q(1, 1) +
      q(0, 2) + q(1, 2) + q(2, 2) +
      q(0, 3) + q(1, 3) +
      `<text x="56" y="42" fill="#1a1a1a" font-family="Segoe UI, Arial, sans-serif" font-size="17.5" font-weight="800" letter-spacing=".3">INSTITUTO FEDERAL</text>` +
      `<text x="56" y="59" fill="#262626" font-family="Segoe UI, Arial, sans-serif" font-size="14">Espírito Santo</text>` +
      `</svg>`;
  }

  /** Retrato vetorial estilizado de Dénes König (1884–1944) para o Slide 2 (como Borůvka no slide 2 do professor). */
  function svgRetratoKonig() {
    const FOTO_KONIG = "data:image/jpeg;base64,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";
    return `<figure class="retrato-autor">` +
      `<img src="${FOTO_KONIG}" alt="Dénes König (1884–1944)"/>` +
      `<figcaption>Dénes König<br>(1884 – 1944)</figcaption></figure>`;
  }

  /** Figura no estilo Sedgewick & Wayne (como no slide 3 do professor: "graph" vs "bipartite" vs "odd cycle"). */
  function svgDefinicaoSedgewick() {
    const no = (x, y, id, pre = "#ffffff", txt = "#111111", borda = "#222222") =>
      `<circle cx="${x}" cy="${y}" r="15" fill="${pre}" stroke="${borda}" stroke-width="2"/>` +
      `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${txt}" font-family="Arial, sans-serif" font-size="12" font-weight="700">${id}</text>`;
    const lin = (x1, y1, x2, y2, cor = "#b5b5b5", w = 2) =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="${w}"/>`;
    return `<svg viewBox="0 0 520 220" role="img" aria-label="Comparação estilo Sedgewick: grafo original, bipartição em dois lados e ciclo ímpar">` +
      `<text x="80" y="20" text-anchor="middle" fill="#b22222" font-family="Arial, sans-serif" font-size="13.5" font-weight="700">grafo G</text>` +
      `<text x="260" y="20" text-anchor="middle" fill="#b22222" font-family="Arial, sans-serif" font-size="13.5" font-weight="700">bipartição (V₁ × V₂)</text>` +
      `<text x="438" y="20" text-anchor="middle" fill="#b22222" font-family="Arial, sans-serif" font-size="13.5" font-weight="700">ciclo ímpar (não bipartido)</text>` +
      /* 1. Grafo G em layout livre */
      lin(50, 60, 115, 55, "#222", 2.5) + lin(50, 60, 110, 150, "#222", 2.5) +
      lin(45, 130, 115, 105, "#222", 2.5) + lin(45, 130, 110, 150, "#222", 2.5) +
      lin(65, 185, 110, 150, "#999", 1.8) +
      no(50, 60, "C1") + no(45, 130, "C2") + no(65, 185, "C3") +
      no(115, 55, "T1") + no(115, 105, "T2") + no(110, 150, "T3") +
      /* 2. Bipartido separado nas duas colunas V1 (cor 0) e V2 (cor 1) */
      lin(215, 58, 305, 58, "#222", 2.5) + lin(215, 58, 305, 158, "#222", 2.5) +
      lin(215, 108, 305, 108, "#222", 2.5) + lin(215, 108, 305, 158, "#222", 2.5) +
      lin(215, 158, 305, 158, "#888", 2) +
      no(215, 58, "C1", "#116b74", "#fff", "#0d4f56") +
      no(215, 108, "C2", "#116b74", "#fff", "#0d4f56") +
      no(215, 158, "C3", "#116b74", "#fff", "#0d4f56") +
      no(305, 58, "T1", "#a45209", "#fff", "#7a3b00") +
      no(305, 108, "T2", "#a45209", "#fff", "#7a3b00") +
      no(305, 158, "T3", "#a45209", "#fff", "#7a3b00") +
      `<text x="260" y="198" text-anchor="middle" fill="#444" font-size="12">toda aresta cruza de V₁ para V₂</text>` +
      /* 3. Triângulo ímpar C1-T3-C2 */
      lin(395, 70, 485, 115, "#d01118", 3.5) +
      lin(395, 155, 485, 115, "#d01118", 3.5) +
      lin(395, 70, 395, 155, "#d01118", 3.5) +
      no(395, 70, "C1", "#116b74", "#fff", "#d01118") +
      no(395, 155, "C2", "#a45209", "#fff", "#d01118") +
      no(485, 115, "T3", "#d01118", "#fff", "#880000") +
      `<text x="440" y="198" text-anchor="middle" fill="#b22222" font-size="12" font-weight="700">C1–T3–C2: 3 arestas (conflito!)</text>` +
      `</svg>`;
  }

  function figura(svg, legenda) {
    return `<figure class="fig">${svg}<figcaption>${esc(legenda)}</figcaption></figure>`;
  }

  function tabela(cabecalho, linhas, classe = "tabela-compacta") {
    return `<table class="${classe}"><thead><tr>${cabecalho.map(c => `<th>${esc(c)}</th>`).join("")}</tr></thead>` +
      `<tbody>${linhas.map(l => `<tr>${l.join("")}</tr>`).join("")}</tbody></table>`;
  }
  const td = (texto, classe = "") => `<td${classe ? ` class="${classe}"` : ""}>${esc(texto)}</td>`;
  const tdHtml = (html, classe = "") => `<td${classe ? ` class="${classe}"` : ""}>${html}</td>`;

  function cartoes(lista, colunas = 3) {
    return `<div class="cartoes c${colunas}">` + lista.map(c =>
      `<div class="cartao ${c.tom || ""}"><h3>${esc(c.titulo)}</h3>` +
      (c.texto ? `<p>${esc(c.texto)}</p>` : "") +
      (c.itens ? `<ul>${c.itens.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : "") +
      `</div>`).join("") + `</div>`;
  }

  /** Diagrama da árvore BFS e paridade de nível. */
  function svgProva() {
    const t = (x, y, s, extra = "") =>
      `<text x="${x}" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="13.5" fill="#222" ${extra}>${s}</text>`;
    const no = (x, y, id, cor) =>
      `<circle cx="${x}" cy="${y}" r="19" fill="${cor}" stroke="#222" stroke-width="2"/>` +
      `<text x="${x}" y="${y + 5}" text-anchor="middle" font-family="sans-serif" font-size="13.5" font-weight="700" fill="#fff">${id}</text>`;
    const nivel = (y, rotulo) =>
      `<line x1="24" y1="${y}" x2="596" y2="${y}" stroke="#b8b8b8" stroke-dasharray="3 5"/>` +
      `<text x="30" y="${y - 6}" font-family="sans-serif" font-size="12" fill="#555">${rotulo}</text>`;
    return `<svg viewBox="0 0 620 275" role="img" aria-label="Árvore BFS: paridade de nível e ciclo ímpar">` +
      `<rect x="2" y="2" width="616" height="271" fill="#ffffff" stroke="#888" stroke-width="1.5"/>` +
      nivel(42, "nível 0 (raiz, cor 0)") + nivel(104, "nível d(a) — menor ancestral comum (LCA)") +
      `<line x1="24" y1="226" x2="596" y2="226" stroke="#b8b8b8" stroke-dasharray="3 5"/>` +
      `<text x="30" y="200" font-family="sans-serif" font-size="12" fill="#555">nível d(u) ≡ d(v) (mod 2) — mesma cor!</text>` +
      `<line x1="310" y1="42" x2="310" y2="104" stroke="#555" stroke-width="2.5"/>` +
      `<path d="M310 104 C 255 148, 215 186, 195 226" fill="none" stroke="#116b74" stroke-width="3.5" stroke-dasharray="8 5"/>` +
      `<path d="M310 104 C 365 148, 405 186, 425 226" fill="none" stroke="#a45209" stroke-width="3.5" stroke-dasharray="8 5"/>` +
      `<line x1="195" y1="226" x2="425" y2="226" stroke="#d01118" stroke-width="4.5"/>` +
      no(310, 42, "r", "#116b74") + no(310, 104, "a", "#555555") + no(195, 226, "u", "#a45209") + no(425, 226, "v", "#a45209") +
      t(200, 165, "d(u) − d(a)", 'font-weight="700" fill="#116b74"') +
      t(425, 165, "d(v) − d(a)", 'font-weight="700" fill="#a45209"') +
      t(310, 256, "aresta u–v: +1  ⇒  par + 1 = ciclo ímpar", 'font-weight="700" fill="#d01118"') +
      `</svg>`;
  }

  /** Mini grafo bipartido genérico, para o slide de outras aplicações. */
  function svgMini(tituloEsq, tituloDir, esq, dir, arestas) {
    const W = 380, H = 232, xE = 88, xD = 292;
    const ys = n => Array.from({ length: n }, (_, i) => n === 1 ? 124 : 66 + i * (126 / (n - 1)));
    const posE = esq.map((nome, i) => ({ nome, x: xE, y: ys(esq.length)[i] }));
    const posD = dir.map((nome, i) => ({ nome, x: xD, y: ys(dir.length)[i] }));
    const rDir = dir.some(nome => nome.length > 3) ? 31 : 24;
    const linhas = arestas.map(([i, j]) =>
      `<line x1="${posE[i].x}" y1="${posE[i].y}" x2="${posD[j].x}" y2="${posD[j].y}" stroke="#666" stroke-width="2.4"/>`).join("");
    const nosE = posE.map(p =>
      `<g fill="#fff" stroke="#222" stroke-width="2.2"><rect x="${p.x - 46}" y="${p.y - 19}" width="92" height="38" rx="7"/></g>` +
      `<text x="${p.x}" y="${p.y + 5}" text-anchor="middle" fill="#111" font-family="sans-serif" font-size="15.5" font-weight="700">${esc(p.nome)}</text>`).join("");
    const nosD = posD.map(p => {
      const fSize = p.nome.length >= 7 ? 13.5 : 15;
      return `<g fill="#fff" stroke="#222" stroke-width="2.2"><circle cx="${p.x}" cy="${p.y}" r="${rDir}"/></g>` +
        `<text x="${p.x}" y="${p.y + 5}" text-anchor="middle" fill="#111" font-family="sans-serif" font-size="${fSize}" font-weight="700">${esc(p.nome)}</text>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tituloEsq)} e ${esc(tituloDir)}: grafo bipartido">` +
      `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="#ffffff" stroke="#888"/>` +
      `<text x="${xE}" y="26" text-anchor="middle" fill="#222" font-family="sans-serif" font-size="15.5" font-weight="700">${esc(tituloEsq)}</text>` +
      `<text x="${xD}" y="26" text-anchor="middle" fill="#222" font-family="sans-serif" font-size="15.5" font-weight="700">${esc(tituloDir)}</text>` +
      `${linhas}${nosE}${nosD}</svg>`;
  }

  /**
   * Painel idêntico aos slides 7 e 8 (`Teste de Mesa :: Início` e `Teste de Mesa :: Término`)
   * do `modelo2-apresentacao-institucional.ppt` do Prof. Rafael:
   *  - Coluna 1: Grafo G (círculos P&B no estilo Sedgewick) + matriz adj[] pontilhada (branca no Início, salmão no Término)
   *  - Coluna 2: Caixa com o código da classe/função + chamada `res = executarBfs(G);`
   *  - Coluna 3: Tabela da Fila FIFO (`Fila<Vertice> fila`) + árvore BFS gerada no Término
   *  - Coluna 4: Tabela `Vetores BFS` (`v | cor[] | pai[] | comp[]`) com valores em vermelho (#cc0000)
   */
  function painelTesteDeMesaProf(grafo, estado, ehTermino) {
    // 1. Grafo G no estilo clássico P&B do professor (arestas da árvore BFS grossas em preto no Término)
    const pos = [
      { id: "C1", x: 56, y: 34 }, { id: "C2", x: 56, y: 74 },
      { id: "C3", x: 56, y: 114 }, { id: "C4", x: 56, y: 154 },
      { id: "T1", x: 204, y: 34 }, { id: "T2", x: 204, y: 74 },
      { id: "T3", x: 204, y: 114 }, { id: "T4", x: 204, y: 154 }
    ];
    const mapaPos = new Map(pos.map(p => [p.id, p]));
    const arestasHtml = grafo.arestas.map(a => {
      const p1 = mapaPos.get(a.u), p2 = mapaPos.get(a.v);
      const naArvore = ehTermino && (estado.pai[a.u] === a.v || estado.pai[a.v] === a.u);
      return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${naArvore ? "#111111" : "#b5b5b5"}" stroke-width="${naArvore ? "3.2" : "1.5"}"/>`;
    }).join("");
    const nosHtml = pos.map(p => {
      const c = ehTermino ? estado.cor[p.id] : -1;
      const fill = !ehTermino ? "#ffffff" : (c === 0 ? "#ffffff" : "#eaeaea");
      return `<circle cx="${p.x}" cy="${p.y}" r="14" fill="${fill}" stroke="#222222" stroke-width="1.8"/>` +
        `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11.5" font-weight="700" fill="#111">${p.id}</text>`;
    }).join("");
    const svgGrafo = `<svg viewBox="0 0 260 182" role="img" aria-label="Grafo G">` +
      `<rect x="1" y="1" width="258" height="180" fill="#f3f3f3" stroke="#999"/>` +
      arestasHtml + nosHtml + `</svg>`;

    // 2. Matriz adj[] com bordas pontilhadas (branca no Início, salmão #f28b82 no Término)
    const maxViz = 2;
    const linhasAdj = grafo.vertices.map(v => {
      const viz = grafo.adj.get(v.id);
      const celulas = [];
      for (let i = 0; i < Math.max(maxViz, viz.length); i++) {
        const val = viz[i] || "";
        const visitada = ehTermino && val !== "";
        celulas.push(`<td class="adj-cel ${visitada ? "visitada" : ""} ${val ? "" : "vazia"}">${esc(val)}</td>`);
      }
      return `<tr><td class="adj-idx">${esc(v.id)}</td>${celulas.join("")}</tr>`;
    }).join("");

    // 3. Código no quadro central (idêntico ao estilo do slide 7 e 8 do professor)
    const codigoTxt = [
      "function executarBfs(G) {",
      "  const cor = {}, pai = {}, comp = {};",
      "  for (const v of G.vertices) {",
      "    cor[v.id] = -1; pai[v.id] = null; comp[v.id] = 0;",
      "  }",
      "  let c = 0, exames = 0;",
      "  for (const r of G.vertices.map(v => v.id)) {",
      "    if (cor[r] !== -1) continue;",
      "    c++; cor[r] = 0; comp[r] = c;",
      "    const fila = [r]; let ini = 0;",
      "    while (ini < fila.length) {",
      "      const u = fila[ini++];",
      "      for (const v of G.adj.get(u)) {",
      "        exames++;",
      "        if (cor[v] === -1) {",
      "          cor[v] = 1 - cor[u]; pai[v] = u;",
      "          comp[v] = c; fila.push(v);",
      "        } else if (cor[v] === cor[u]) {",
      "          return { bipartido: false,",
      "                   ciclo: cicloImpar(u, v, pai) };",
      "        }",
      "      }",
      "    }",
      "  }",
      "  return { bipartido: true, cor, pai, comp };",
      "}"
    ].join("\n");

    // 4. Coluna da Fila FIFO q (igual ao Gabarito do professor: itens retirados aparecem riscados no Término)
    const ordemFila = [
      ["C1", 0], ["T1", 1], ["T3", 1], ["C2", 0],
      ["T2", 1], ["C3", 0], ["T4", 1], ["C4", 0]
    ];
    const linhasFila = ordemFila.map(([id, c]) =>
      `<tr><td class="tm-vermelho">${ehTermino ? `<del>${id}</del>` : "—"}</td>` +
      `<td class="tm-vermelho">${ehTermino ? `<del>${c}</del>` : "—"}</td></tr>`
    ).join("");

    // 5. Tabela Vetores da BFS (v | marcado[] | cor[] | pai[] | comp[])
    const linhasVetores = grafo.vertices.map(v => {
      const m = ehTermino ? "T" : "F";
      const c = ehTermino ? estado.cor[v.id] : -1;
      const p = ehTermino ? (estado.pai[v.id] ?? "-") : "-";
      const cp = ehTermino ? estado.componente[v.id] : 0;
      return `<tr><td>${esc(v.id)}</td>` +
        `<td class="tm-vermelho">${m}</td>` +
        `<td class="tm-vermelho">${c}</td>` +
        `<td class="tm-vermelho">${esc(String(p))}</td>` +
        `<td class="tm-vermelho">${cp}</td></tr>`;
    }).join("");

    // 6. Pequena árvore BFS gerada no Término (igual ao canto inferior do slide 8 do professor)
    const arvoreTermino = ehTermino
      ? `<svg class="tm-arvore" viewBox="0 0 210 110" role="img" aria-label="Árvore BFS gerada">` +
        `<line x1="55" y1="18" x2="25" y2="52" stroke="#222" stroke-width="1.8"/>` +
        `<line x1="55" y1="18" x2="85" y2="52" stroke="#222" stroke-width="1.8"/>` +
        `<line x1="85" y1="52" x2="85" y2="90" stroke="#222" stroke-width="1.8"/>` +
        `<line x1="145" y1="18" x2="145" y2="52" stroke="#222" stroke-width="1.8"/>` +
        `<circle cx="55" cy="18" r="12.5" fill="#fff" stroke="#222" stroke-width="1.5"/><text x="55" y="22" text-anchor="middle" font-size="11" font-weight="700">C1</text>` +
        `<circle cx="25" cy="52" r="12.5" fill="#eaeaea" stroke="#222" stroke-width="1.5"/><text x="25" y="56" text-anchor="middle" font-size="11" font-weight="700">T1</text>` +
        `<circle cx="85" cy="52" r="12.5" fill="#eaeaea" stroke="#222" stroke-width="1.5"/><text x="85" y="56" text-anchor="middle" font-size="11" font-weight="700">T3</text>` +
        `<circle cx="85" cy="90" r="12.5" fill="#fff" stroke="#222" stroke-width="1.5"/><text x="85" y="94" text-anchor="middle" font-size="11" font-weight="700">C2</text>` +
        `<circle cx="145" cy="18" r="12.5" fill="#fff" stroke="#222" stroke-width="1.5"/><text x="145" y="22" text-anchor="middle" font-size="11" font-weight="700">C3</text>` +
        `<circle cx="145" cy="52" r="12.5" fill="#eaeaea" stroke="#222" stroke-width="1.5"/><text x="145" y="56" text-anchor="middle" font-size="11" font-weight="700">T4</text>` +
        `<circle cx="190" cy="18" r="12.5" fill="#fff" stroke="#222" stroke-width="1.5"/><text x="190" y="22" text-anchor="middle" font-size="11" font-weight="700">C4</text>` +
        `</svg>`
      : `<div class="tm-nota-inicio">Antes do laço:<br>• <code>cor[v] = -1</code><br>• <code>pai[v] = null</code><br>• <code>exames = 0</code></div>`;

    return `<div class="tm-prof">` +
      `<div class="tm-col-esq">` +
      `<div class="tm-titulo-caixa">Grafo G</div>` +
      svgGrafo +
      `<div class="tm-adj-wrap">` +
      `<div class="tm-adj-vert">Representação do Grafo G</div>` +
      `<div><div class="tm-adj-label">adj[]</div><table class="tm-adj-tab"><tbody>${linhasAdj}</tbody></table></div>` +
      `</div></div>` +
      `<div class="tm-col-cod">` +
      `<pre class="tm-cod-box">${esc(codigoTxt)}</pre>` +
      `<p class="tm-chamada">let resultado;<br>resultado = executarBfs(G);</p>` +
      `</div>` +
      `<div class="tm-col-fila">` +
      `<table class="tm-wire"><thead><tr><th colspan="2">Fila FIFO q</th></tr><tr><th>v</th><th>cor</th></tr></thead><tbody>${linhasFila}</tbody></table>` +
      arvoreTermino +
      `</div>` +
      `<div class="tm-col-uf">` +
      `<table class="tm-wire"><thead><tr><th colspan="5">Estruturas da BFS</th></tr><tr><th>v</th><th>marcado[]</th><th>cor[]</th><th>pai[]</th><th>comp[]</th></tr></thead><tbody>${linhasVetores}</tbody></table>` +
      `</div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Widgets interativos embutidos nos slides                            */
  /* ------------------------------------------------------------------ */

  function htmlWidgetBrinquedo() {
    return `<div class="w-toy" data-widget="toy">` +
      `<div class="w-toy-esq">` +
      `<svg data-toy-svg viewBox="0 0 520 265" role="img" aria-label="Grafo interativo para testar bipartição com 2 cores"></svg>` +
      `<div class="w-barra">` +
      `<button type="button" data-toy-cor0>Pintar de Cor 0</button>` +
      `<button type="button" data-toy-cor1>Pintar de Cor 1</button>` +
      `<button type="button" data-toy-sol class="on">Auto 2-colorir (BFS)</button>` +
      `<button type="button" data-toy-tri>+ Aresta C1–C2 (criar ciclo ímpar)</button>` +
      `<button type="button" data-toy-limpar>↺ Limpar</button>` +
      `</div></div>` +
      `<div class="w-toy-dir">` +
      svgDefinicaoSedgewick() +
      `<div class="w-msg" data-toy-msg>Clique em um vértice à esquerda para alternar sua cor ou clique em "+ Aresta C1–C2".</div>` +
      `</div></div>`;
  }

  function htmlWidgetBfs() {
    return `<div class="w-bfs" data-widget="bfs">` +
      `<div class="w-bfs-topo-sedgewick">` +
      `<span class="sw-marca">Algorithms — Bipartite Two-Color BFS Demo</span>` +
      `<div class="w-barra-cenarios">` +
      `<button type="button" data-bfs-cenario="valido" class="on">cenario-valido.txt</button>` +
      `<button type="button" data-bfs-cenario="conflito">cenario-conflito.txt</button>` +
      `<button type="button" data-bfs-cenario="semantica">C1–C2–T1 (semântica)</button>` +
      `</div></div>` +
      `<div class="w-bfs-corpo">` +
      `<div class="w-bfs-grafo" data-bfs-svg></div>` +
      `<div class="w-bfs-painel">` +
      `<div class="w-status-linha"><span class="chip" data-bfs-acao>Inicialização</span><span class="hint" data-bfs-passo>passo 0</span></div>` +
      `<div class="w-desc" data-bfs-nota></div>` +
      `<div class="w-progresso"><div class="w-progresso-barra" data-bfs-barra></div></div>` +
      `<div class="w-kv">` +
      `<div><b>Fila FIFO:</b> <code data-bfs-fila>∅</code></div>` +
      `<div><b>Componentes:</b> <span data-bfs-comp>0</span> · <b>Exames em adj[]:</b> <span data-bfs-exames>0</span></div>` +
      `<div data-bfs-veredito class="w-veredito"></div>` +
      `</div>` +
      `<div class="w-barra">` +
      `<button type="button" data-bfs-ant>◀ Anterior</button>` +
      `<button type="button" data-bfs-play class="on">▶ Tocar</button>` +
      `<button type="button" data-bfs-prox>Próximo ▶</button>` +
      `<button type="button" data-bfs-fim>⏭ Final</button>` +
      `<button type="button" data-bfs-vel>1×</button>` +
      `<button type="button" data-bfs-ini>↺ Início</button>` +
      `</div>` +
      `<p class="hint">Atalhos: <b>Espaço</b> toca/pausa · <b>↓ / ↑</b> avança/volta passo · <b>← / →</b> muda de slide</p>` +
      `</div></div></div>`;
  }

  /**
   * Slide 5 (`Solução / BFS 2-Cores / Implementação`) exatamente no estilo do `slide_5.png`
   * do Prof. Rafael: caixa de código cinza (#cccccc) com faixa branca no trecho em foco e
   * setas vinho à direita (`←───`) explicando cada linha!
   */
  function htmlWidgetCodigo() {
    const linhas = [
      { g: 1, txt: "function executarBfs(grafo) {", nota: "" },
      { g: 1, txt: "  const cor = {}, pai = {}, comp = {};", nota: "inicializa vetores em O(V)" },
      { g: 1, txt: "  for (const raiz of grafo.vertices.map(v => v.id)) {", nota: "percorre todos os componentes" },
      { g: 1, txt: "    if (cor[raiz] !== -1) continue;", nota: "pula vértice já visitado" },
      { g: 1, txt: "    componentes++; cor[raiz] = 0;", nota: "nova raiz recebe cor 0" },
      { g: 2, txt: "    const fila = [raiz]; let inicio = 0;", nota: "fila FIFO com ponteiro" },
      { g: 2, txt: "    while (inicio < fila.length) {", nota: "enquanto houver vértices" },
      { g: 2, txt: "      const u = fila[inicio++];", nota: "retira em O(1) (sem shift)" },
      { g: 3, txt: "      for (const v of grafo.adj.get(u)) {", nota: "varre lista adj[u]" },
      { g: 3, txt: "        exames++;", nota: "conta exame (soma = 2E)" },
      { g: 3, txt: "        if (cor[v] === -1) {", nota: "vizinho ainda sem cor" },
      { g: 3, txt: "          cor[v] = 1 - cor[u]; pai[v] = u;", nota: "alterna cor (0↔1) e guarda pai" },
      { g: 3, txt: "          comp[v] = componentes; fila.push(v);", nota: "marca componente e enfileira" },
      { g: 4, txt: "        } else if (cor[v] === cor[u]) {", nota: "mesma cor ⇒ ciclo ímpar!" },
      { g: 4, txt: "          const ciclo = cicloImpar(u, v, pai);", nota: "reconstrói ciclo via LCA" },
      { g: 4, txt: "          return { bipartido: false, ciclo };", nota: "encerra e devolve prova" },
      { g: 4, txt: "        }", nota: "" },
      { g: 3, txt: "      }", nota: "" },
      { g: 2, txt: "    }", nota: "" },
      { g: 1, txt: "  }", nota: "" },
      { g: 5, txt: "  return { bipartido: true, cor, pai, comp };", nota: "2-coloração completa (V₁ e V₂)" },
      { g: 5, txt: "}", nota: "" }
    ];
    return `<div class="w-cod-prof" data-widget="codigo">` +
      `<div class="w-barra w-cod-barra">` +
      `<span class="small" style="font-weight:700;color:#444">Destaque (clique ou use ↓/↑):</span>` +
      `<button type="button" data-cod-passo="3" class="on">Bloco 3: Descoberta e 2-Cores</button>` +
      `<button type="button" data-cod-passo="4">Bloco 4: Conflito e Ciclo Ímpar</button>` +
      `<button type="button" data-cod-passo="1">Bloco 1: Componentes</button>` +
      `<button type="button" data-cod-passo="2">Bloco 2: Fila O(1)</button>` +
      `<button type="button" data-cod-passo="5">Bloco 5: Retorno</button>` +
      `<button type="button" data-cod-passo="0">Todos</button>` +
      `</div>` +
      `<div class="prof-code-grid">` +
      linhas.map((l, idx) =>
        `<div class="ln-cod prof-ln" data-cod-grupo="${l.g}">` +
        `<span class="prof-code-cell"><span class="ln-num">${String(idx + 1).padStart(2, " ")}</span>${esc(l.txt)}</span>` +
        `<span class="prof-arrow-cell">${l.nota ? `<span class="prof-seta">←───</span> <span class="prof-nota">${esc(l.nota)}</span>` : ""}</span>` +
        `</div>`
      ).join("") +
      `</div></div>`;
  }

  function htmlWidgetImpacto() {
    return `<div class="w-imp" data-widget="impacto">` +
      `<div class="w-imp-grafo" data-imp-svg></div>` +
      `<div class="w-imp-painel">` +
      `<div class="janela-app-header"><span>▣ IFES - SI - TPA - Trabalho 02: Grafo Bipartido (Simulador Interativo)</span><span>─  □  ✕</span></div>` +
      `<div class="janela-app-body">` +
      `<p class="rotulo-bloco">Funções alteradas no commit (clique para marcar/desmarcar):</p>` +
      `<div class="w-barra" data-imp-botoes>` +
      `<button type="button" data-imp-fn="C1" class="on">C1 · calcularDesconto</button>` +
      `<button type="button" data-imp-fn="C2" class="on">C2 · validarCupom</button>` +
      `<button type="button" data-imp-fn="C3">C3 · calcularFrete</button>` +
      `<button type="button" data-imp-fn="C4">C4 · registrarAuditoria</button>` +
      `</div>` +
      `<div class="w-barra">` +
      `<button type="button" data-imp-preset="C1,C2">Preset TXT (C1 + C2)</button>` +
      `<button type="button" data-imp-preset="C1">Só C1 (sem propagação)</button>` +
      `<button type="button" data-imp-preset="C4">Só C4 (isolado)</button>` +
      `<button type="button" data-imp-preset="">Limpar</button>` +
      `</div>` +
      `<div data-imp-resumo class="w-imp-resumo"></div>` +
      `<div data-imp-tabela></div>` +
      `</div></div></div>`;
  }

  /* ------------------------------------------------------------------ */
  /* Definição dos 13 slides no formato do modelo2 do Prof. Rafael       */
  /* ------------------------------------------------------------------ */

  function slidesDe({ valido, conflito }, verificacoes) {
    const g = analisarTxt(valido).grafo, b = executarBfs(g);
    const gc = analisarTxt(conflito).grafo, bc = executarBfs(gc);
    const gs = analisarTxt(TXT_SEMANTICA).grafo, bs = executarBfs(gs);
    const semantica = validarSemantica(gs);
    const ciclo = bc.ciclo.join(" → ");
    const quem = { M: "Marcos", A: "André" };

    // Mesmo cenário válido, mas com os TESTES declarados primeiro: as cores trocam de lado.
    const linhasValido = valido.split(/\r?\n/);
    const ehTeste = l => /^V;[^;]+;TESTE;/.test(l);
    const txtTestesPrimeiro = [...linhasValido.filter(ehTeste), ...linhasValido.filter(l => !ehTeste(l))].join("\n");
    const gt = analisarTxt(txtTestesPrimeiro).grafo, bt = executarBfs(gt);

    const grafoConflito = figura(desenharGrafo(gc, bc.rastro[bc.rastro.length - 1], new Set(), bc.ciclo),
      `Ciclo ímpar detectado e reconstruído via LCA: ${ciclo} (${bc.ciclo.length - 1} arestas).`);
    const grafoSemantica = figura(desenharGrafo(gs, { cor: bs.cor }, new Set()),
      `Caminho C1–C2–T1: a BFS aceita (2-colorível), mas a etapa 3 bloqueia pois ${semantica.violacoes.map(v => `${v.u}–${v.v}`).join(", ")} liga duas funções.`);
    const grafoTestesPrimeiro = figura(desenharGrafo(gt, { cor: bt.cor }, new Set()),
      `TESTES declarados primeiro: T1 recebe cor ${bt.cor.T1}, C1 recebe cor ${bt.cor.C1} e C4 (isolado) recebe cor ${bt.cor.C4}.`);

    // Slide 6 (Interface Gráfica + cenario-valido.txt anotado com setas como no slide 6 do professor)
    const visualInterfaceTxt = `<div class="ig-grid">` +
      `<div class="ig-txt-anotado">` +
      `<div class="ig-txt-titulo">cenario-valido.txt</div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;C1;CODIGO;calcularDesconto</span><span class="ig-seta">←── Vértices CODIGO (V₁)</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;C2;CODIGO;validarCupom</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;C3;CODIGO;calcularFrete</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;C4;CODIGO;registrarAuditoria</span><span class="ig-seta">←── Vértice isolado</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;T1;TESTE;testeDesconto</span><span class="ig-seta">←── Vértices TESTE (V₂)</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;T2;TESTE;testeCupom</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;T3;TESTE;testeCompraComCupom</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">V;T4;TESTE;testeFrete</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">E;C1;T1 · E;C1;T3 · E;C2;T2</span><span class="ig-seta">←── 5 Arestas (E)</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">E;C2;T3 · E;C3;T4</span></div>` +
      `<div class="ig-txt-linha"><span class="ig-cod">A;C1 · A;C2</span><span class="ig-seta">←── Funções alteradas (A)</span></div>` +
      `<div class="ig-txt-linha ig-conflito"><span class="ig-cod">+ E;C1;C2 (em cenario-conflito.txt)</span><span class="ig-seta">←── Fecha triângulo C1–T3–C2</span></div>` +
      `<p class="ig-legenda">Um grafo bipartido de funções × casos de teste</p>` +
      `</div>` +
      `<div class="ig-janela">` +
      `<div class="janela-app-header"><span>▣ IFES - SI - TPA - Trabalho 02: Grafo Bipartido (codigo-e-testes.html)</span><span>─  □  ✕</span></div>` +
      `<div class="janela-app-body">` +
      `<div class="ig-etapas">` +
      `<span class="chip ok">1. Sintaxe TXT: OK</span>` +
      `<span class="chip ok">2. Estrutura BFS: Bipartido (3 comp.)</span>` +
      `<span class="chip ok">3. Semântica: Válida (CODIGO×TESTE)</span>` +
      `<span class="chip ok">4. Impacto: T1, T2, T3 indicados</span>` +
      `</div>` +
      desenharGrafo(g, { cor: b.cor }, new Set(["C1", "C2"])) +
      `</div></div></div>`;

    // Tabela de conflito + estrutura vs semântica
    const ultimosConflito = bc.rastro.slice(-5);
    const tabelaConflito = tabela(["Passo", "Evento", "u → v", "Fila", "Exames"],
      ultimosConflito.map(s => [
        td(s.passo, "centro"),
        td(s.acao, s.acao === ACAO.CONFLITO ? "alerta" : ""),
        td([s.u, s.v].filter(Boolean).join(" → ") || "—", "centro"),
        td(s.fila.join(", ") || "∅"),
        td(s.exames, "centro")
      ]));

    const sim = ok => (ok ? "✔ Sim" : "✘ Não");
    const linhaEtapas = (nome, grafo, bfs) => {
      const sem = validarSemantica(grafo);
      const r = consultarImpacto(grafo, ["C1"], { estrutura: bfs, semantica: sem });
      return [
        td(nome, "negrito"),
        td(sim(bfs.bipartido), bfs.bipartido ? "bom" : "alerta"),
        td(sim(sem.valida), sem.valida ? "bom" : "alerta"),
        td(r.bloqueada ? "BLOQUEADA" : "LIBERADA", r.bloqueada ? "alerta" : "bom")
      ];
    };
    const tabelaEtapas = tabela(["Cenário analisado", "2. Bipartido? (BFS)", "3. Só CODIGO–TESTE?", "4. Consulta de Impacto"], [
      linhaEtapas("cenario-valido.txt (8V, 5E)", g, b),
      linhaEtapas("Caminho C1–C2–T1 (3V, 2E)", gs, bs),
      linhaEtapas("cenario-conflito.txt (8V, 6E)", gc, bc)
    ]);

    return [
      /* ---------------- SLIDE 1: CAPA (igual ao slide 1 do modelo2) ---------------- */
      {
        quem: quem.M, tempo: "0:00–1:00", capa: true,
        titulo: "Trabalho sobre Grafos — Grafo Bipartido",
        subtitulo: "Técnicas de Programação Avançada",
        autores: "Marcos Ribeiro e André Valane",
        topicos: [
          "Tema (Grupo 06): Reconhecimento de Grafo Bipartido por BFS com 2 cores.",
          "Aplicação prática: seleção de casos de teste impactados por alterações de código."
        ],
        fala: "Olá, professor Rafael e colegas. Eu sou o Marcos e, junto com o André, vamos apresentar o Trabalho 02 de Técnicas de Programação Avançada sobre Grafos Bipartidos. Nosso trabalho responde a uma pergunta prática do dia a dia de desenvolvimento: quando alteramos funções do código, quais testes precisam ser reexecutados?"
      },

      /* ---------------- SLIDE 2: PROBLEMA: CONTEXTUALIZAÇÃO (igual ao slide 2 do modelo2) ---------------- */
      {
        quem: quem.M, tempo: "1:00–2:30", layout: "contextualizacao", logoCanto: true,
        titulo: "Problema: Contextualização",
        visualHtml: svgRetratoKonig(),
        topicos: [
          "Problema: Grafo Bipartido (Reconhecimento e Bipartição em 2 Cores);",
          "Primeiro Teorema Estrutural: Dénes König (1916 / livro clássico de 1936);",
          "Algoritmo de Decisão: Busca em Largura (BFS) com 2 cores alternadas;",
          "Complexidade: V + A em tempo e V em espaço com listas de adjacência."
        ],
        fala: "Começando pela contextualização histórica: o estudo formal dos grafos bipartidos foi consolidado pelo matemático húngaro Dénes König em 1916 e publicado em 1936 no primeiro livro-texto da história da Teoria dos Grafos. König provou que um grafo é bipartido se, e somente se, não possui ciclo de comprimento ímpar. Usando busca em largura com duas cores sobre listas de adjacência, decidimos isso em tempo linear V mais A."
      },

      /* ---------------- SLIDE 3: PROBLEMA: CONTEXTUALIZAÇÃO - DEFINIÇÃO + WIDGET (igual ao slide 3 do modelo2) ---------------- */
      {
        quem: quem.M, tempo: "2:30–4:15", largo: true, logoCanto: true,
        titulo: "Problema: Contextualização",
        visualHtml: htmlWidgetBrinquedo(),
        topicos: [
          "Definição: Um grafo G = (V, A) é bipartido quando V pode ser particionado em dois conjuntos disjuntos V₁ e V₂ tais que toda aresta une um vértice de V₁ a um vértice de V₂."
        ],
        fala: "Pela definição formal, um grafo é bipartido quando conseguimos dividir seus vértices em dois conjuntos disjuntos V1 e V2 de modo que toda aresta atravesse de um lado para o outro, sem arestas internas. Aqui no slide podemos testar ao vivo: com funções de um lado e testes do outro, duas cores bastam. Mas se clicarmos em 'Adicionar aresta C1–C2', fechamos o triângulo C1–T3–C2 de 3 arestas, e duas cores se tornam matematicamente impossíveis."
      },

      /* ---------------- SLIDE 4: SOLUÇÃO / BFS 2-CORES / DEMONSTRAÇÃO ---------------- */
      {
        quem: quem.M, tempo: "4:15–6:45", layout: "topo-compacto",
        titulo: "Solução: BFS 2-Cores — Demonstração",
        visualHtml: htmlWidgetBfs(),
        topicos: [
          "A raiz de cada componente recebe cor 0; cada vizinho novo recebe 1 − cor[u] e entra na fila FIFO."
        ],
        fala: "Neste slide demonstramos o algoritmo em funcionamento passo a passo. A busca começa em C1 com cor 0. Ao inspecionar a lista de adjacência de C1, descobrimos T1 e T3 com a cor oposta, cor 1, e colocamos ambos na fila FIFO. De T3, descobrimos C2 com cor 0. Quando o primeiro componente termina, o laço externo garante a visita a C3 e T4 e também ao vértice isolado C4. E trocando aqui em cima para o segundo cenário, vemos a BFS detectar o conflito ímpar no exato momento em que examina T3 para C2."
      },

      /* ---------------- SLIDE 5: SOLUÇÃO / BFS 2-CORES / IMPLEMENTAÇÃO ---------------- */
      {
        quem: quem.M, tempo: "6:45–8:30", layout: "topo-compacto",
        titulo: "Solução: BFS 2-Cores — Implementação",
        visualHtml: htmlWidgetCodigo(),
        topicos: [
          "Implementação em JavaScript (src/nucleo.js) fiel à estrutura clássica com listas de adjacência."
        ],
        fala: "Aqui temos a implementação da nossa função executarBfs, seguindo exatamente o estilo de destaque do modelo da disciplina. No bloco destacado em branco, para cada vértice u retirado da fila, percorremos sua lista de adjacência: se o vizinho v ainda tem cor menos 1, ele recebe a cor complementar 1 menos cor de u, guarda u como pai e entra na fila. Se clicarmos no Bloco 4, vemos o tratamento de conflito: quando v já tem a mesma cor de u, reconstruímos o ciclo ímpar subindo pelos pais até o menor ancestral comum."
      },

      /* ---------------- SLIDE 6: SOLUÇÃO / IMPLEMENTAÇÃO / INTERFACE GRÁFICA ---------------- */
      {
        quem: quem.M, tempo: "8:30–10:00", layout: "topo-compacto",
        subtituloVerde: "cenario-valido.txt",
        titulo: "Solução: Implementação — Interface Gráfica",
        visualHtml: visualInterfaceTxt,
        topicos: [
          "Leitura dos 2 arquivos TXT e separação rigorosa das 4 operações na interface."
        ],
        fala: "Seguindo o modelo da apresentação, aqui mostramos o formato dos nossos dois arquivos TXT à esquerda e a interface gráfica à direita. O arquivo declara vértices com V, arestas com E e funções alteradas com A. Nossa arquitetura separa quatro operações independentes: validação sintática do TXT com linha e motivo, verificação estrutural pela BFS, validação semântica entre CODIGO e TESTE, e consulta de impacto. Passo agora a palavra ao André."
      },

      /* ---------------- SLIDE 7: TESTE DE MESA :: INÍCIO (igual ao slide 7 do modelo2) ---------------- */
      {
        quem: quem.A, tempo: "10:00–11:15", layout: "teste-mesa",
        titulo: "Teste de Mesa :: Início",
        subtituloVerde: "cenario-valido.txt",
        visualHtml: painelTesteDeMesaProf(g, b.rastro[0], false),
        topicos: [],
        fala: "Obrigado, Marcos. No Teste de Mesa :: Início, damos a visão geral do estado das estruturas antes da execução do laço principal da BFS sobre o cenario-valido.txt. À esquerda temos o grafo G e sua lista de adjacência adj com as células pontilhadas ainda não visitadas. À direita, a fila FIFO está vazia e todos os 8 vértices começam na tabela com cor igual a menos 1, pai nulo e componente 0."
      },

      /* ---------------- SLIDE 8: TESTE DE MESA :: TÉRMINO (igual ao slide 8 do modelo2) ---------------- */
      {
        quem: quem.A, tempo: "11:15–12:30", layout: "teste-mesa",
        titulo: "Teste de Mesa :: Término",
        subtituloVerde: "cenario-valido.txt",
        visualHtml: painelTesteDeMesaProf(g, b.rastro[b.rastro.length - 1], true),
        topicos: [],
        fala: "E aqui temos o Teste de Mesa :: Término, após percorrer todas as listas de adjacência. Note que na representação adj à esquerda todas as 10 entradas ficaram marcadas em salmão, confirmando que cada uma das 5 arestas foi inspecionada nos dois sentidos: 2 vezes A exames. Na tabela à direita, todas as funções receberam cor 0, todos os testes receberam cor 1, e os três componentes conexos foram identificados, conforme a floresta BFS desenhada abaixo da fila."
      },

      /* ---------------- SLIDE 9: POR QUE FUNCIONA + CENÁRIO DE CONFLITO ---------------- */
      {
        quem: quem.A, tempo: "12:30–14:00", layout: "teste-mesa",
        titulo: "Teste de Mesa :: Conflito e Prova Formal",
        subtituloVerde: "cenario-conflito.txt",
        visualHtml: `<div class="visual-duplo">${figura(svgProva(), "cor(x) = d(x) mod 2. Aresta entre mesma cor ⇒ (d(u)−d(a)) + (d(v)−d(a)) + 1 = ímpar.")}<div>${grafoConflito}${tabelaConflito}</div></div>`,
        topicos: [],
        fala: "Por que duas cores sempre bastam quando não há ciclo ímpar? Porque na árvore da BFS a cor de cada vértice é a paridade da sua distância até a raiz. Se uma aresta liga dois vértices u e v da mesma cor, a soma dos dois caminhos até o ancestral comum é par, e somando a própria aresta u–v obtemos um ciclo ímpar. É exatamente o que ocorre no segundo arquivo, cenario-conflito.txt: no passo 10, T3 encontra C2 ambos com cor 1, reconstruindo o triângulo T3–C1–C2–T3."
      },

      /* ---------------- SLIDE 10: CUIDADOS DO MODELO (COR ≠ TIPO E ESTRUTURA ≠ SEMÂNTICA) ---------------- */
      {
        quem: quem.A, tempo: "14:00–15:30", largo: true,
        titulo: "Solução: Cuidados Conceituais (Cor ≠ Tipo e Estrutura ≠ Semântica)",
        visualHtml: `<div class="visual-duplo">` +
          `<div><p class="rotulo-bloco">1. Se TESTE vier primeiro no TXT, ele recebe cor 0:</p>${grafoTestesPrimeiro}</div>` +
          `<div><p class="rotulo-bloco">2. Grafo bipartido mas semanticamente inválido (C1–C2–T1):</p>${grafoSemantica}${tabelaEtapas}</div>` +
          `</div>`,
        topicos: [
          "Cor 0/1 depende apenas da ordem de visita da BFS; já a etapa semântica exige que toda aresta ligue CODIGO a TESTE."
        ],
        fala: "Dois cuidados conceituais importantes: primeiro, cor da BFS não é tipo de vértice. Se declararmos T1 antes de C1 no arquivo TXT, T1 recebe cor 0 e C1 recebe cor 1, enquanto C4 isolado continua com cor 0 por ser raiz do seu próprio componente. Segundo, ser bipartido na BFS não basta para o domínio: o caminho C1–C2–T1 à direita é bipartido, mas nossa etapa semântica bloqueia a consulta porque C1–C2 liga duas funções."
      },

      /* ---------------- SLIDE 11: PROBLEMA: APLICAÇÃO PRÁTICA (igual ao slide 9 do modelo2) ---------------- */
      {
        quem: quem.A, tempo: "15:30–17:45", largo: true,
        titulo: "Problema: Aplicação prática",
        visualHtml: htmlWidgetImpacto(),
        topicos: [
          "Identificar quais casos de teste devem ser reexecutados quando funções são alteradas, sem propagar pelo componente e alertando funções sem cobertura.",
          "Arestas: cobertura declarada (teste exercita função) | Vértices: funções (CODIGO) e testes (TESTE)"
        ],
        fala: "Chegamos à aplicação prática, que é o coração do nosso problema. Os vértices representam funções e casos de teste, e as arestas representam quais testes exercitam quais funções. Podemos simular aqui no próprio slide: com C1 e C2 alteradas, o sistema recomenda T1, T2 e T3 sem duplicar T3. Se marcarmos apenas C1, ele recomenda apenas T1 e T3 — sem propagar para C2 nem puxar T2 indevidamente. E se clicarmos em C4, recebemos o alerta de que registrarAuditoria não possui testes mapeados."
      },

      /* ---------------- SLIDE 12: COMPLEXIDADE E OUTRAS APLICAÇÕES ---------------- */
      {
        quem: quem.A, tempo: "17:45–19:00", largo: true, logoCanto: true,
        titulo: "Problema: Complexidade e Outras Aplicações Práticas",
        visualHtml: `<div class="s12-stack">` +
          `<div class="s12-tabela-wrap">${tabela(["Etapa / Modo", "Tempo", "Memória", "Uso na ferramenta"], [
            [td("1. Parser TXT (2 passadas)"), td("O(linhas)"), td("O(V + A)"), td("validação sintática completa")],
            [td("2a. BFS sem rastreamento"), td("O(V + A)", "bom"), td("O(V)", "bom"), td("consultas e grafos > 600 elem. (testado 50.000 V)")],
            [td("2b. BFS com rastreamento"), td("O(V·(V + A))"), td("O(V·(V + A))"), td("animação passo a passo e Teste de Mesa")],
            [td("3. Validação semântica"), td("O(A)"), td("O(1)"), td("verifica extremos CODIGO × TESTE")],
            [td("4. Consulta de impacto"), td("O(Σ grau(f))", "bom"), td("O(testes)"), td("união deduplicada com justificativa")]
          ])}` +
          `<p class="s12-nota"><b>Honestidade do modelo:</b> o mapeamento vem do arquivo TXT; a ferramenta não analisa Git nem executa os testes.</p></div>` +
          `<div class="mini-grade">` +
          figura(svgMini("CANDIDATOS", "VAGAS", ["Ana", "Bia", "Caio"], ["Backend", "Dados"], [[0, 0], [1, 0], [2, 1]]), "Alocação pessoas × vagas") +
          figura(svgMini("ALUNOS", "TURMAS", ["Ana", "Bruno"], ["TPA", "Redes"], [[0, 0], [1, 0], [1, 1]]), "Matrícula alunos × disciplinas") +
          figura(svgMini("FUNÇÕES", "TESTES", ["C1", "C2", "C3"], ["T1", "T2", "T3"], [[0, 0], [0, 2], [1, 1], [1, 2], [2, 2]]), "Nosso projeto: código × testes") +
          `</div></div>`,
        topicos: [
          "Núcleo da BFS roda em O(V + A); a mesma estrutura bipartida modela problemas clássicos de pareamento e alocação."
        ],
        fala: "Na tabela de complexidade separamos o custo do núcleo da BFS, que é O de V mais A com fila indexada sem shift, do modo com rastreamento O de V vezes V mais A, usado para gravar cada passo da animação e da planilha Excel. Ao lado, destacamos que essa mesma estrutura bipartida resolve problemas clássicos de alocação de candidatos a vagas e matrícula de alunos em turmas."
      },

      /* ---------------- SLIDE 13: ENCERRAMENTO INSTITUCIONAL (igual ao slide 10 do modelo2) ---------------- */
      {
        quem: quem.A, tempo: "19:00–20:00", encerramento: true,
        titulo: "Conclusão e Encerramento",
        subtitulo: "Referências: König (1936); Sedgewick & Wayne (2011); Cormen et al. (2012).",
        topicos: [
          "Entregáveis completos: código modular + aplicação em arquivo único, 2 TXTs, planilha Excel real com teste de mesa e apresentação interativa.",
          "Obrigado pela atenção! Estamos à disposição para perguntas."
        ],
        fala: "Para concluir, todos os entregáveis solicitados no edital estão prontos e validados por 66 testes automatizados: o código com a aplicação visual, os dois arquivos TXT, a planilha Excel com o teste de mesa completo e as fórmulas de impacto, que podemos abrir agora para demonstrar, além desta apresentação. Muito obrigado pela atenção, professor Rafael e colegas! Estamos à disposição para perguntas."
      }
    ].map((s, i) => ({ ...s, numero: i + 1 }));
  }

  /* ------------------------------------------------------------------ */
  /* Geração da marcação HTML dos slides (Fiel ao modelo2 do Ifes)       */
  /* ------------------------------------------------------------------ */

  function marcacaoSlides(cenarios, verificacoes) {
    const slides = slidesDe(cenarios, verificacoes);
    return slides.map((s, i) => {
      const lista = classe => s.topicos && s.topicos.length
        ? `<ul class="${classe}reveal">${s.topicos.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : "";

      let corpo;
      let classeSlide = "slide-interno";

      if (s.capa) {
        classeSlide = "slide-capa";
        corpo = `<div class="capa-modelo2">` +
          `<div class="capa-bloco-titulo">` +
          `<h2 class="capa-h1">Trabalho sobre Grafos<br>Grafo Bipartido</h2>` +
          `<p class="capa-disciplina">${esc(s.subtitulo)}</p>` +
          `</div>` +
          `<p class="capa-autores">${esc(s.autores)}<br><span class="capa-prof">Prof. Rafael Vargas Mesquita</span></p>` +
          svgLogoIfes("ifes-logo-canto") +
          `</div>`;
      } else if (s.encerramento) {
        classeSlide = "slide-encerramento";
        corpo = `<div class="encerramento-modelo2">` +
          svgLogoIfes("ifes-logo-central") +
          `<p class="ifes-lema">Educação pública, gratuita e de qualidade</p>` +
          `<div class="encerramento-resumo">` +
          `<p><b>Trabalho 02 — Grafo Bipartido (Grupo 06):</b> Marcos Ribeiro e André Valane</p>` +
          `<p class="small">${esc(s.subtitulo)}</p>` +
          `</div></div>`;
      } else if (s.layout === "contextualizacao") {
        corpo = `<header class="slide-head-modelo2"><h2 class="slide-t">${esc(s.titulo)}</h2></header>` +
          `<div class="ctx-grid">` +
          `<div class="ctx-lista">${lista("topicos-ctx ")}</div>` +
          `<div class="ctx-retrato">${s.visualHtml}</div>` +
          `</div>` +
          (s.logoCanto ? svgLogoIfes("ifes-logo-canto") : "");
      } else if (s.layout === "topo-compacto") {
        corpo = `<header class="slide-head-modelo2 slide-head-inline">` +
          `<h2 class="slide-t">${esc(s.titulo)}</h2>` +
          (s.subtituloVerde ? `<p class="sub-verde">${esc(s.subtituloVerde)}</p>` : "") +
          `</header>` +
          `<div class="visual-largo">${s.visualHtml}</div>`;
      } else if (s.layout === "teste-mesa") {
        corpo = `<header class="slide-head-tm">` +
          `<h2 class="slide-t">${esc(s.titulo)}</h2>` +
          (s.subtituloVerde ? `<p class="sub-verde">${esc(s.subtituloVerde)}</p>` : "") +
          `</header>` +
          `<div class="visual-largo">${s.visualHtml}</div>`;
      } else {
        corpo = `<header class="slide-head-modelo2">` +
          `<h2 class="slide-t">${esc(s.titulo)}</h2>` +
          (s.subtitulo ? `<p class="sub-verde">${esc(s.subtitulo)}</p>` : "") +
          `</header>` +
          lista("topicos-modelo2 ") +
          `<div class="visual-largo">${s.visualHtml || ""}</div>` +
          (s.logoCanto ? svgLogoIfes("ifes-logo-canto") : "");
      }

      const barraTopo = s.capa ? `<div class="ifes-bar-top"></div>` : "";
      const barraBase = `<div class="ifes-bar-bot ${s.capa || s.encerramento ? "solida" : "suave"}"></div>`;

      return `<article ` + `class="slide ${classeSlide} ${i === 0 ? "active" : ""}" data-slide="${i + 1}" aria-label="Slide ${i + 1}">` +
        barraTopo +
        `<div class="content">${corpo}</div>` +
        barraBase +
        `</article>`;
    }).join("");
  }

  /**
   * Ajusta cada slide à altura e largura disponíveis, reduzindo a escala quando necessário.
   */
  function ajustarDeck(raiz) {
    if (!raiz) return;
    for (const slide of raiz.querySelectorAll(".slide")) {
      const conteudo = slide.querySelector(".content");
      if (!conteudo) continue;
      const topo = slide.querySelector(".ifes-bar-top");
      const base = slide.querySelector(".ifes-bar-bot");
      const barrasH = (topo ? topo.offsetHeight : 0) + (base ? base.offsetHeight : 0);
      conteudo.style.transform = "none";
      conteudo.style.flex = "0 0 auto";
      const dispH = slide.clientHeight - barrasH;
      const dispW = slide.clientWidth - 16;
      const alt = Math.max(conteudo.offsetHeight, conteudo.scrollHeight);
      const larg = Math.max(conteudo.offsetWidth, conteudo.scrollWidth);
      conteudo.style.flex = "";
      if (dispH < 50 || alt <= 0) { conteudo.style.transform = "none"; continue; }
      const movel = slide.clientWidth <= 800;
      const escala = movel
        ? Math.min(1, dispW / (larg || dispW))
        : Math.min(1, dispH / alt, dispW / (larg || dispW));
      conteudo.style.transformOrigin = movel ? "top center" : "center center";
      conteudo.style.transform = escala < 0.999 ? `scale(${escala.toFixed(4)})` : "none";
    }
  }

  /* ------------------------------------------------------------------ */
  /* Motor de interatividade dos widgets nos slides (Browser)            */
  /* ------------------------------------------------------------------ */

  function ativarInteratividade(raiz, cenarios) {
    if (!raiz || typeof document === "undefined" || raiz.dataset.interativo === "1") return null;
    raiz.dataset.interativo = "1";

    const dados = {
      valido: (() => { const g = analisarTxt(cenarios.valido).grafo; return { g, b: executarBfs(g), s: validarSemantica(g) }; })(),
      conflito: (() => { const g = analisarTxt(cenarios.conflito).grafo; return { g, b: executarBfs(g), s: validarSemantica(g) }; })(),
      semantica: (() => { const g = analisarTxt(TXT_SEMANTICA).grafo; return { g, b: executarBfs(g), s: validarSemantica(g) }; })()
    };

    const controles = {};

    /* ---- 1. Widget Brinquedo (Slide 3) ---- */
    const boxToy = raiz.querySelector('[data-widget="toy"]');
    if (boxToy) {
      const svg = boxToy.querySelector("[data-toy-svg]");
      const msg = boxToy.querySelector("[data-toy-msg]");
      const btnTri = boxToy.querySelector("[data-toy-tri]");
      const nos = [
        { id: "C1", tipo: "CODIGO", x: 125, y: 65, rot: "calcularDesconto" },
        { id: "C2", tipo: "CODIGO", x: 125, y: 140, rot: "validarCupom" },
        { id: "C3", tipo: "CODIGO", x: 125, y: 215, rot: "calcularFrete" },
        { id: "T1", tipo: "TESTE", x: 395, y: 65, rot: "testeDesconto" },
        { id: "T2", tipo: "TESTE", x: 395, y: 140, rot: "testeCupom" },
        { id: "T3", tipo: "TESTE", x: 395, y: 215, rot: "testeCompraCupom" }
      ];
      const pos = new Map(nos.map(n => [n.id, n]));
      let comTriangulo = false;
      let cor = { C1: 0, C2: 0, C3: 0, T1: 1, T2: 1, T3: 1 };

      const arestasAtuais = () => {
        const base = [["C1", "T1"], ["C1", "T3"], ["C2", "T2"], ["C2", "T3"], ["C3", "T3"]];
        if (comTriangulo) base.push(["C1", "C2"]);
        return base;
      };

      const renderToy = () => {
        const ar = arestasAtuais();
        const conflitos = [];
        for (const [u, v] of ar) {
          if (cor[u] >= 0 && cor[v] >= 0 && cor[u] === cor[v]) conflitos.push([u, v]);
        }
        const noEmConflito = new Set(conflitos.flat());
        const COR_PRE = { "-1": "#737b82", "0": "#116b74", "1": "#a45209" };

        let htmlArestas = "";
        for (const [u, v] of ar) {
          const a = pos.get(u), b = pos.get(v);
          const ruim = cor[u] >= 0 && cor[v] >= 0 && cor[u] === cor[v];
          const corLinha = ruim ? "#d01118" : "#777777";
          const larg = ruim ? 4.5 : 2.2;
          const d = a.x === b.x
            ? `M ${a.x - 44} ${a.y} Q ${a.x - 105} ${(a.y + b.y) / 2} ${b.x - 44} ${b.y}`
            : `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
          htmlArestas += `<path d="${d}" fill="none" stroke="${corLinha}" stroke-width="${larg}"/>`;
        }

        let htmlNos = "";
        for (const n of nos) {
          const c = cor[n.id];
          const rCor = c === -1 ? "sem cor" : `cor ${c}`;
          const borda = noEmConflito.has(n.id) ? "#d01118" : "#ffffff";
          const sw = noEmConflito.has(n.id) ? 3.5 : 2;
          const forma = n.tipo === "CODIGO"
            ? `<rect x="${n.x - 54}" y="${n.y - 23}" width="108" height="46" rx="7"/>`
            : `<circle cx="${n.x}" cy="${n.y}" r="25"/>`;
          htmlNos += `<g data-toy-no="${n.id}" style="cursor:pointer">` +
            `<g fill="${COR_PRE[c]}" stroke="${borda}" stroke-width="${sw}">${forma}</g>` +
            `<text x="${n.x}" y="${n.y - 1}" text-anchor="middle" fill="#fff" font-size="15.5" font-weight="700">${n.id}</text>` +
            `<text x="${n.x}" y="${n.y + 15}" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">${rCor}</text>` +
            `<text x="${n.x}" y="${n.y + 39}" text-anchor="middle" fill="#222" font-size="13.5" font-weight="600">${n.rot}</text></g>`;
        }

        svg.innerHTML = `<rect x="2" y="2" width="516" height="261" fill="#f9f9f9" stroke="#bbb"/>` +
          `<text x="125" y="24" text-anchor="middle" fill="#222" font-size="13" font-weight="700">FUNÇÕES (V₁) — clique para pintar</text>` +
          `<text x="395" y="24" text-anchor="middle" fill="#222" font-size="13" font-weight="700">TESTES (V₂) — clique para pintar</text>` +
          htmlArestas + htmlNos;

        svg.querySelectorAll("[data-toy-no]").forEach(gNo => {
          gNo.onclick = () => {
            const id = gNo.dataset.toyNo;
            cor[id] = cor[id] === -1 ? 0 : (cor[id] === 0 ? 1 : -1);
            renderToy();
          };
        });

        const todosColoridos = nos.every(n => cor[n.id] >= 0);
        if (conflitos.length) {
          msg.className = "w-msg bad";
          msg.textContent = `⚠ Conflito em ${conflitos.map(([u, v]) => `${u}–${v}`).join(", ")}: extremos com a mesma cor!` +
            (comTriangulo ? " Com o triângulo C1–T3–C2 (3 arestas), 2 cores nunca funcionam." : "");
        } else if (!todosColoridos) {
          msg.className = "w-msg";
          msg.textContent = "Clique nos vértices para pintar com Cor 0 ou Cor 1 (ou clique em Auto 2-colorir).";
        } else {
          msg.className = "w-msg ok";
          msg.textContent = "✓ 2-coloração válida! Toda aresta une Cor 0 (azul-petróleo) a Cor 1 (laranja).";
        }
        btnTri.textContent = comTriangulo ? "− Remover aresta C1–C2" : "+ Aresta C1–C2 (criar ciclo ímpar)";
        btnTri.classList.toggle("bad-btn", comTriangulo);
      };

      boxToy.querySelector("[data-toy-cor0]").onclick = () => { nos.forEach(n => { cor[n.id] = 0; }); renderToy(); };
      boxToy.querySelector("[data-toy-cor1]").onclick = () => { nos.forEach(n => { cor[n.id] = 1; }); renderToy(); };
      boxToy.querySelector("[data-toy-limpar]").onclick = () => { nos.forEach(n => { cor[n.id] = -1; }); renderToy(); };
      boxToy.querySelector("[data-toy-sol]").onclick = () => {
        cor = { C1: 0, C2: comTriangulo ? 1 : 0, C3: 0, T1: 1, T2: 1, T3: 1 };
        renderToy();
      };
      btnTri.onclick = () => {
        comTriangulo = !comTriangulo;
        cor = { C1: 0, C2: comTriangulo ? 1 : 0, C3: 0, T1: 1, T2: 1, T3: 1 };
        renderToy();
      };
      renderToy();
    }

    /* ---- 2. Widget Demonstração da BFS (Slide 4) ---- */
    const boxBfs = raiz.querySelector('[data-widget="bfs"]');
    if (boxBfs) {
      let chave = "valido";
      let idx = 0;
      let timer = null;
      let vel = 1;
      const vels = [1, 2, 4];

      const elSvg = boxBfs.querySelector("[data-bfs-svg]");
      const elAcao = boxBfs.querySelector("[data-bfs-acao]");
      const elPasso = boxBfs.querySelector("[data-bfs-passo]");
      const elNota = boxBfs.querySelector("[data-bfs-nota]");
      const elBarra = boxBfs.querySelector("[data-bfs-barra]");
      const elFila = boxBfs.querySelector("[data-bfs-fila]");
      const elComp = boxBfs.querySelector("[data-bfs-comp]");
      const elExames = boxBfs.querySelector("[data-bfs-exames]");
      const elVeredito = boxBfs.querySelector("[data-bfs-veredito]");
      const btnPlay = boxBfs.querySelector("[data-bfs-play]");
      const btnVel = boxBfs.querySelector("[data-bfs-vel]");

      const pararTimer = () => { if (timer) { clearInterval(timer); timer = null; } btnPlay.textContent = "▶ Tocar"; };

      const renderBfs = () => {
        const { g, b, s } = dados[chave];
        const rastro = b.rastro;
        idx = Math.max(0, Math.min(rastro.length - 1, idx));
        const ev = rastro[idx];
        const noFim = idx === rastro.length - 1;
        const cicloVisivel = !b.bipartido && noFim ? b.ciclo : [];

        elSvg.innerHTML = desenharGrafo(g, ev, new Set(), cicloVisivel);
        elAcao.textContent = ev.acao;
        elAcao.className = "chip " + (ev.acao === ACAO.CONFLITO ? "chip-bad" : ev.acao === ACAO.BIPARTIDO ? "chip-ok" : "");
        const par = [ev.u, ev.v].filter(Boolean).join(" → ");
        elPasso.textContent = `passo ${ev.passo} de ${rastro.length - 1}${par ? ` (${par})` : ""}`;
        elNota.textContent = ev.nota;
        elBarra.style.width = `${(100 * idx / Math.max(1, rastro.length - 1)).toFixed(1)}%`;
        elFila.textContent = ev.fila.length ? `[${ev.fila.join(", ")}]` : "∅";
        elComp.textContent = String(ev.componentes);
        elExames.textContent = String(ev.exames);

        if (!b.bipartido && noFim) {
          elVeredito.className = "w-veredito bad";
          elVeredito.textContent = `✘ Conflito! Ciclo ímpar: ${b.ciclo.join(" → ")} (${b.ciclo.length - 1} arestas).`;
        } else if (!s.valida && noFim) {
          elVeredito.className = "w-veredito bad";
          elVeredito.textContent = `⚠ Bipartido na BFS, mas Semântica inválida: ${s.violacoes.map(v => `${v.u}–${v.v}`).join(", ")} liga mesmo tipo.`;
        } else if (noFim) {
          elVeredito.className = "w-veredito ok";
          elVeredito.textContent = `✔ Bipartido confirmado (${b.componentes} componentes, ${b.exames} exames) e Semântica válida.`;
        } else {
          elVeredito.className = "w-veredito";
          elVeredito.textContent = "Em execução: inspecionando listas de adjacência...";
        }
        btnPlay.textContent = timer ? "❚❚ Pausar" : "▶ Tocar";
      };

      const iniciarTimer = () => {
        pararTimer();
        const rastro = dados[chave].b.rastro;
        if (idx >= rastro.length - 1) idx = 0;
        renderBfs();
        timer = setInterval(() => {
          const total = dados[chave].b.rastro.length;
          if (idx < total - 1) { idx++; renderBfs(); }
          else { pararTimer(); renderBfs(); }
        }, Math.round(950 / vel));
        btnPlay.textContent = "❚❚ Pausar";
      };

      boxBfs.querySelectorAll("[data-bfs-cenario]").forEach(b => {
        b.onclick = () => {
          pararTimer();
          chave = b.dataset.bfsCenario;
          idx = 0;
          boxBfs.querySelectorAll("[data-bfs-cenario]").forEach(x => x.classList.toggle("on", x === b));
          renderBfs();
        };
      });
      boxBfs.querySelector("[data-bfs-ant]").onclick = () => { pararTimer(); idx--; renderBfs(); };
      boxBfs.querySelector("[data-bfs-prox]").onclick = () => { pararTimer(); idx++; renderBfs(); };
      boxBfs.querySelector("[data-bfs-ini]").onclick = () => { pararTimer(); idx = 0; renderBfs(); };
      boxBfs.querySelector("[data-bfs-fim]").onclick = () => { pararTimer(); idx = dados[chave].b.rastro.length - 1; renderBfs(); };
      btnPlay.onclick = () => { if (timer) pararTimer(); else iniciarTimer(); };
      btnVel.onclick = () => {
        vel = vels[(vels.indexOf(vel) + 1) % vels.length];
        btnVel.textContent = `${vel}×`;
        if (timer) iniciarTimer();
      };

      renderBfs();
      controles.bfs = {
        space() { btnPlay.click(); },
        down() { pararTimer(); idx++; renderBfs(); },
        up() { pararTimer(); idx--; renderBfs(); },
        leave() { pararTimer(); }
      };
    }

    /* ---- 3. Widget Código com Faixa Branca e Setas do Professor (Slide 5) ---- */
    const boxCod = raiz.querySelector('[data-widget="codigo"]');
    if (boxCod) {
      let bloco = 3; // Começa destacando o bloco central da BFS (como no slide 5 do professor)
      const renderCod = () => {
        boxCod.querySelectorAll("[data-cod-passo]").forEach(b => b.classList.toggle("on", Number(b.dataset.codPasso) === bloco));
        boxCod.querySelectorAll("[data-cod-grupo]").forEach(ln => {
          const g = Number(ln.dataset.codGrupo);
          ln.classList.toggle("hl", bloco > 0 && g === bloco);
          ln.classList.toggle("dim", bloco > 0 && g !== bloco);
        });
      };
      boxCod.querySelectorAll("[data-cod-passo]").forEach(b => {
        b.onclick = () => { bloco = Number(b.dataset.codPasso); renderCod(); };
      });
      renderCod();
      controles.codigo = {
        down() { bloco = (bloco + 1) % 6; renderCod(); },
        up() { bloco = (bloco + 5) % 6; renderCod(); }
      };
    }

    /* ---- 4. Widget Simulador de Impacto (Slide 11) ---- */
    const boxImp = raiz.querySelector('[data-widget="impacto"]');
    if (boxImp) {
      const { g, b, s } = dados.valido;
      let sel = new Set(["C1", "C2"]);
      const elSvg = boxImp.querySelector("[data-imp-svg]");
      const elResumo = boxImp.querySelector("[data-imp-resumo]");
      const elTabela = boxImp.querySelector("[data-imp-tabela]");

      const renderImp = () => {
        boxImp.querySelectorAll("[data-imp-fn]").forEach(bt => {
          bt.classList.toggle("on", sel.has(bt.dataset.impFn));
        });
        elSvg.innerHTML = desenharGrafo(g, { cor: b.cor }, sel);
        const res = consultarImpacto(g, [...sel], { estrutura: b, semantica: s });

        if (res.selecaoVazia) {
          elResumo.innerHTML = `<div class="w-msg">Nenhuma função marcada como alterada → <b>0 testes indicados</b>.</div>`;
        } else {
          const avisoC4 = res.semTestes.length
            ? `<div class="w-msg bad">⚠ <b>Sem testes mapeados para: ${esc(res.semTestes.join(", "))}</b> — ausência de aresta no TXT não significa que a função dispensa testes!</div>`
            : "";
          elResumo.innerHTML = `<div class="w-msg ok">✔ Funções alteradas: <b>${esc([...sel].join(", "))}</b> → <b>${res.testes.length} de ${res.totalTestes} testes indicados</b> (${esc(res.testes.join(", ") || "nenhum")}).</div>` + avisoC4;
        }

        const todosTestes = g.vertices.filter(v => v.tipo === "TESTE");
        const linhas = todosTestes.map(t => {
          const item = res.itens.find(i => i.id === t.id);
          return [
            td(t.id, "negrito"),
            td(t.rotulo),
            td(item ? "SIM (executar)" : "NÃO (pular)", item ? "bom" : ""),
            td(item ? item.funcoes.join(" + ") : "nenhuma função alterada")
          ];
        });
        elTabela.innerHTML = tabela(["Teste", "Rótulo", "Indicado?", "Justificado pelas funções"], linhas);
      };

      boxImp.querySelectorAll("[data-imp-fn]").forEach(bt => {
        bt.onclick = () => {
          const fn = bt.dataset.impFn;
          if (sel.has(fn)) sel.delete(fn); else sel.add(fn);
          renderImp();
        };
      });
      boxImp.querySelectorAll("[data-imp-preset]").forEach(bt => {
        bt.onclick = () => {
          const lista = bt.dataset.impPreset ? bt.dataset.impPreset.split(",") : [];
          sel = new Set(lista);
          renderImp();
        };
      });
      renderImp();
    }

    return controles;
  }

  /* ------------------------------------------------------------------ */
  /* Apresentação autônoma em arquivo único (`saida/apresentacao.html`)  */
  /* ------------------------------------------------------------------ */

  function htmlApresentacao(css, cenarios, verificacoes) {
    const cenariosJson = JSON.stringify({ valido: cenarios.valido, conflito: cenarios.conflito });
    const navegacao = `
      const CENARIOS_DECK = ${cenariosJson};
      let n = 0;
      const deck = document.querySelector(".deck");
      const slides = [...deck.querySelectorAll(".slide")];
      const controles = Slides.ativarInteratividade(deck, CENARIOS_DECK) || {};
      function ajustar() { Slides.ajustarDeck(deck); }
      function mostrar(i) {
        if (controles.bfs && controles.bfs.leave) controles.bfs.leave();
        n = (i + slides.length) % slides.length;
        slides.forEach((s, k) => s.classList.toggle("active", k === n));
        document.getElementById("contador").textContent = (n + 1) + " / " + slides.length;
        ajustar();
      }
      document.getElementById("anterior").onclick = () => mostrar(n - 1);
      document.getElementById("proximo").onclick = () => mostrar(n + 1);
      document.getElementById("telaCheiaSlide").onclick = () => {
        try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {}
      };
      document.addEventListener("keydown", e => {
        const ativo = slides[n];
        const temBfs = ativo && ativo.querySelector('[data-widget="bfs"]');
        const temCod = ativo && ativo.querySelector('[data-widget="codigo"]');
        if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); mostrar(n + 1); }
        else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mostrar(n - 1); }
        else if (e.key === " ") {
          e.preventDefault();
          if (temBfs && controles.bfs) controles.bfs.space(); else mostrar(n + 1);
        }
        else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (temBfs && controles.bfs) controles.bfs.down();
          else if (temCod && controles.codigo) controles.codigo.down();
          else mostrar(n + 1);
        }
        else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (temBfs && controles.bfs) controles.bfs.up();
          else if (temCod && controles.codigo) controles.codigo.up();
          else mostrar(n - 1);
        }
        else if (e.key === "Home") { e.preventDefault(); mostrar(0); }
        else if (e.key === "End") { e.preventDefault(); mostrar(slides.length - 1); }
        else if (e.key === "f" || e.key === "F") {
          try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (x) {}
        }
        else if (e.key === "b" || e.key === "B" || e.key === ".") {
          const bk = document.getElementById("blackout");
          bk.hidden = !bk.hidden;
        }
      });
      let inicio = 0;
      document.addEventListener("touchstart", e => inicio = e.changedTouches[0].clientX, { passive: true });
      document.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - inicio;
        if (Math.abs(dx) > 60) mostrar(n + (dx < 0 ? 1 : -1));
      }, { passive: true });
      window.addEventListener("resize", ajustar);
      mostrar(0);`;

    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"><title>TP02 – Grafo Bipartido (TPA – Ifes)</title>` +
      `<style>${css}\nbody{margin:0;background:#1d2125}.deck{height:calc(100dvh - 54px);min-height:0;border-radius:0;border:none}` +
      `.controls{justify-content:center;height:54px;margin:0;background:#1d2125;color:#eef3f6}.controls button{min-height:36px;padding:.28rem .8rem}` +
      `#blackout{position:fixed;inset:0;background:#000;z-index:999}@media print{body{background:#fff}.deck{height:auto}.controls,#blackout{display:none!important}}</style></head><body>` +
      `<div id="blackout" hidden></div>` +
      `<div class="deck">${marcacaoSlides(cenarios, verificacoes)}</div>` +
      `<nav class="controls" aria-label="Navegação dos slides">` +
      `<button id="anterior">← Anterior</button><span id="contador"></span><button id="proximo">Próximo →</button>` +
      `<button id="telaCheiaSlide" title="Atalho: tecla F">Tela cheia (F)</button>` +
      `<span class="small" style="color:#b7c4cc">Espaço: tocar/pausar · ↑↓: passo · B: tela preta</span></nav>` +
      `<script>${obterFonteModulosSlide()}\n${navegacao}</script></body></html>`;
  }

  /** Reconstrói o código de Nucleo, GrafoSvg e Slides para embutir em `saida/apresentacao.html`. */
  function obterFonteModulosSlide() {
    const seguro = txt => txt.replace(/<\/(script)/gi, "<\\/$1");
    if (typeof require === "function") {
      const fs = require("node:fs");
      const path = require("node:path");
      return seguro(["nucleo.js", "grafo-svg.js", "slides.js"]
        .map(arq => fs.readFileSync(path.join(__dirname, arq), "utf8"))
        .join("\n"));
    }
    if (typeof document === "object" && document.querySelectorAll) {
      const blocos = Array.from(document.querySelectorAll("script"))
        .map(s => s.textContent || "")
        .filter(t => /src\/(nucleo|grafo-svg|slides)\.js/.test(t));
      return seguro(blocos.join("\n"));
    }
    return "";
  }

  /* ------------------------------------------------------------------ */
  /* Roteiro de fala (20 minutos cronometrados conforme o edital do AVA) */
  /* ------------------------------------------------------------------ */

  function textoRoteiro(cenarios, verificacoes) {
    const slides = slidesDe(cenarios, verificacoes);
    return `# Roteiro de fala — Trabalho 02: Grafo Bipartido (20 minutos)

**Dupla:** Marcos Ribeiro e André Valane  
**Disciplina:** Técnicas de Programação Avançada — Prof. Rafael Vargas Mesquita (Ifes Campus Cachoeiro)  
**Modelo Visual:** Baseado fielmente no \`modelo2-apresentacao-institucional.ppt\` do Prof. Rafael Vargas Mesquita  
**Tempo oficial do edital (AVA):** **20 minutos** (pontuação máxima de 4,67 pts na apresentação).

## Divisão de tempo sugerida (20 minutos)
- **Parte 1 — Marcos (0:00 a 10:00 · Slides 1 a 6):** Capa institucional, contextualização histórica (Dénes König, 1916/1936), definição + problema interativo de 2 cores, demonstração animada da BFS, implementação com destaque de código e interface gráfica + os 2 arquivos TXT.
- **Parte 2 — André (10:00 a 19:00 · Slides 7 a 13):** Teste de Mesa (Início e Término no padrão do professor), prova pela paridade de nível + cenário de conflito, cuidados conceituais (Cor ≠ Tipo e Estrutura ≠ Semântica), simulador prático ("Mudou o código: o que testar?"), complexidade e encerramento institucional.
- **Fechamento e Demonstração Complementar / Excel (19:00 a 20:00):** Abrir \`saida/teste-de-mesa.xlsx\` na aba \`Impacto\` e mostrar as fórmulas reagindo.

## Atalhos da Apresentação (\`saida/apresentacao.html\`)
- \`←\` / \`→\` ou \`PageUp\` / \`PageDown\`: slide anterior / próximo.
- \`Espaço\`: toca ou pausa a animação da BFS (no Slide 4) ou avança nos demais slides.
- \`↓\` / \`↑\`: avança ou volta passo a passo na BFS (Slide 4) e alterna a faixa branca de destaque entre os blocos do código (Slide 5).
- \`F\`: entra/sai da tela cheia.
- \`B\` ou \`.\`: deixa a tela preta (para focar a atenção na fala).

---

${slides.map(s => `## Slide ${s.numero} (${s.tempo}) — ${s.titulo}\n**Quem fala:** ${s.quem}\n\n**Na tela:**\n${(s.topicos.length ? s.topicos : ["Visual completo de Teste de Mesa / Encerramento no padrão do professor."]).map(t => `- ${t}`).join("\n")}\n\n**Fala:**\n> ${s.fala}\n`).join("\n")}
---

## Perguntas prováveis da banca
**1. Por que não usar só uma tabela em vez de um grafo?**  
Uma tabela também armazena os pares, mas o grafo bipartido explicita as adjacências em duas classes disjuntas ($V_1 \times V_2$) e permite validar estruturalmente a bipartição em $O(V + A)$ usando a BFS.

**2. O grafo válido já não nasce bipartido por construção se só ligarmos CODIGO a TESTE?**  
Sim, quando a semântica é respeitada. O papel da BFS é demonstrar o algoritmo clássico de reconhecimento de bipartição (inclusive detectando o ciclo ímpar no segundo arquivo TXT), enquanto a validação semântica garante que um caminho bipartido como $C_1\text{–}C_2\text{–}T_1$ não passe despercebido.

**3. A BFS é quem seleciona os testes na consulta?**  
Não. A BFS verifica se o grafo é bipartido (etapa 2). A consulta de impacto (etapa 4) percorre apenas os vizinhos diretos das funções alteradas, em tempo proporcional à soma dos graus das funções escolhidas.

**4. Por que não propagar a consulta pelo componente conexo inteiro?**  
Porque se $C_1$ mudou e $T_3$ testa $C_1$ e $C_2$, a função $C_2$ **não** foi alterada. Propagar para os outros testes de $C_2$ (como $T_2$) selecionaria testes de funções intactas.

**5. Por que usar fila com índice \`inicio++\` em vez de \`Array.shift()\`?**  
Porque \`Array.shift()\` desloca todos os elementos restantes na memória e custa $O(V)$ por retirada; com ponteiro de início, cada retirada é $O(1)$ e a BFS inteira mantém custo linear $O(V + A)$.
`;
  }

  exportar({ slidesDe, marcacaoSlides, htmlApresentacao, textoRoteiro, ajustarDeck, ativarInteratividade });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Slides = o; });
