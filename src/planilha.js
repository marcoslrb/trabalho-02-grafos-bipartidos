"use strict";
/*
 * Conteúdo da planilha do teste de mesa (saida/teste-de-mesa.xlsx):
 *
 * 1. Abas visuais de Teste de Mesa no formato idêntico ao usado pelo Prof. Rafael Vargas Mesquita
 *    nas aulas de TPA (como em IFES-TPA-Cap07-ArvoreGeradoraMinima-Lista04-Ex01-Gabarito.xlsx):
 *    - Bipartido-Ex01 (estado inicial em branco: Grafo G, adj[] pontilhada branca, código, vetores e fila vazia)
 *    - Bipartido-GAB (gabarito final: adj[] toda em salmão, vetores finais em vermelho e fila toda riscada)
 *    - Bipartido-GAB-C1, GAB-T1, GAB-T3, GAB-C2, GAB-T2, GAB-C3, GAB-T4, GAB-C4 (passo a passo por vértice retirado da fila)
 *    - Conflito-GAB (teste de mesa do cenário de conflito no exato momento em que C2 encontra T3 com a mesma cor)
 *
 * 2. Abas analíticas e de fórmulas vivas:
 *    - Resumo, Guia, Entradas, BFS_valido, BFS_conflito, Impacto, Validacoes.
 */
(function (exportar) {
  const N = typeof require === "function" ? require("./nucleo.js") : globalThis.Nucleo;
  const X = typeof require === "function" ? require("./xlsx.js") : globalThis.Xlsx;
  const { analisarTxt, executarBfs, consultarImpacto } = N;
  const { colName, formula, estilizada, ESTILO, gerarXlsx, gerarPngGrafo } = X;

  const LINHAS_CODIGO_BFS = [
    "function executarBfs(G) {",
    "  const cor = {}, pai = {}, comp = {}, fila = [];",
    "  for (const v of G.vertices) {",
    "    cor[v] = -1; pai[v] = null; comp[v] = 0;",
    "  }",
    "  let numComp = 0;",
    "  for (const s of G.vertices) {",
    "    if (cor[s] !== -1) continue;",
    "    cor[s] = 0; comp[s] = ++numComp;",
    "    fila.push(s);",
    "    for (let ini = 0; ini < fila.length; ini++) {",
    "      const u = fila[ini];",
    "      for (const v of G.adj.get(u)) {",
    "        if (cor[v] === -1) {",
    "          cor[v] = 1 - cor[u]; pai[v] = u;",
    "          comp[v] = numComp; fila.push(v);",
    "        } else if (cor[v] === cor[u]) {",
    "          return { bipartido: false, ciclo: cicloImpar(u, v, pai) };",
    "        }",
    "      }",
    "    }",
    "  }",
    "}"
  ];

  /**
   * Monta uma aba visual de Teste de Mesa no formato exato das aulas do Prof. Rafael:
   * - Colunas A..G: Grafo G (PNG embutido em A2:G8) + Representação do Grafo G / adj[] (A9:F17)
   * - Colunas I..O: Código-fonte da BFS com destaque nas linhas ativas da rodada
   * - Colunas Q..U: Tabela de vetores (v, marcado[], cor[], pai[], comp[]) com valores em vermelho
   * - Colunas W..X: Fila FIFO q (v, cor) com itens retirados riscados e recém-inseridos em salmão
   */
  function montarAbaTesteMesaProf(nomeAba, grafo, cfg) {
    const ids = grafo.vertices.map(v => v.id);
    const totalLinhas = 25, totalCols = 24; // A..X
    const rows = Array.from({ length: totalLinhas }, () =>
      Array.from({ length: totalCols }, () => estilizada("", ESTILO.TM_FUNDO_BRANCO))
    );
    const mesclar = [
      "A1:G1",
      "A10:A17",
      "W1:X1",
      "A23:X23",
      "A25:X25"
    ];

    // 1. Cabeçalhos superiores (Linha 1)
    rows[0][0] = estilizada("Grafo G", ESTILO.TM_TITULO);
    rows[0][16] = estilizada("v", ESTILO.TM_CAB_CINZA);
    rows[0][17] = estilizada("marcado[]", ESTILO.TM_CAB_CINZA);
    rows[0][18] = estilizada("cor[]", ESTILO.TM_CAB_CINZA);
    rows[0][19] = estilizada("pai[]", ESTILO.TM_CAB_CINZA);
    rows[0][20] = estilizada("comp[]", ESTILO.TM_CAB_CINZA);
    rows[0][22] = estilizada("Fila FIFO q", ESTILO.TM_CAB_CINZA);
    rows[0][23] = estilizada("", ESTILO.TM_CAB_CINZA);

    // 2. Código-fonte nas colunas I..O (índices 8..14), linhas 1..23
    const linhasAtivas = new Set(cfg.linhasAtivas || []);
    LINHAS_CODIGO_BFS.forEach((linhaCod, idx) => {
      const r = idx; // 0..22 -> Excel 1..23
      if (r < 22) {
        mesclar.push(`I${r + 1}:O${r + 1}`);
        const est = linhasAtivas.has(r + 1) ? ESTILO.TM_CODIGO_ATIVO : ESTILO.TM_CODIGO;
        const prefixo = linhasAtivas.has(r + 1) ? "► " : "  ";
        rows[r][8] = estilizada(prefixo + linhaCod, est);
      }
    });

    // 3. Tabela de vetores Q2:U9 (v, marcado[], cor[], pai[], comp[])
    const recem = new Set(cfg.recemDescobertos || []);
    const conflitoSet = new Set(cfg.conflitoVertices || []);
    ids.forEach((id, i) => {
      const r = 1 + i; // linhas 2..9 (índices 1..8)
      const cVal = cfg.cor[id];
      const marcado = cVal !== -1 ? "T" : "F";
      const paiVal = cfg.pai[id] || "-";
      const compVal = cfg.comp[id] ?? 0;
      const estValor = conflitoSet.has(id)
        ? ESTILO.TM_VAL_SALMAO
        : (recem.has(id) ? ESTILO.TM_VAL_VERDE : ESTILO.TM_VAL_VERMELHO);
      rows[r][16] = estilizada(id, ESTILO.TM_V_ID);
      rows[r][17] = estilizada(marcado, estValor);
      rows[r][18] = estilizada(cVal, estValor);
      rows[r][19] = estilizada(paiVal, estValor);
      rows[r][20] = estilizada(compVal, estValor);
    });

    // 4. Fila FIFO q em W2:X18
    rows[1][22] = estilizada("v", ESTILO.TM_CAB_CINZA);
    rows[1][23] = estilizada("cor", ESTILO.TM_CAB_CINZA);
    const filaItens = cfg.filaItens || [];
    for (let slot = 0; slot < 16; slot++) {
      const r = 2 + slot; // linhas 3..18 (índices 2..17)
      const item = filaItens[slot];
      if (item) {
        const estFila = item.estado === "riscado"
          ? ESTILO.TM_VAL_RISCADO
          : (item.estado === "novo" ? ESTILO.TM_VAL_SALMAO : ESTILO.TM_VAL_VERMELHO);
        rows[r][22] = estilizada(item.id, estFila);
        rows[r][23] = estilizada(item.cor, estFila);
      } else {
        rows[r][22] = estilizada("", ESTILO.TM_VAL_VERMELHO);
        rows[r][23] = estilizada("", ESTILO.TM_VAL_VERMELHO);
      }
    }

    // 5. Representação do Grafo G / adj[] em A9:F17
    rows[8][1] = estilizada("adj[]", ESTILO.TM_TITULO);
    for (let i = 0; i < 8; i++) {
      rows[9 + i][0] = estilizada(i === 0 ? "Representação do Grafo G" : "", ESTILO.TM_VERTICAL);
    }
    const adjVisitados = new Set(cfg.adjVisitados || []);
    ids.forEach((id, i) => {
      const r = 9 + i; // linhas 10..17 (índices 9..16)
      const visitado = adjVisitados.has(id);
      rows[r][1] = estilizada(id, visitado ? ESTILO.TM_ADJ_V_SALMAO : ESTILO.TM_ADJ_V_BRANCO);
      const vizinhos = grafo.adj.get(id) || [];
      if (vizinhos.length === 0) {
        rows[r][2] = estilizada("-", visitado ? ESTILO.TM_ADJ_VIZ_SALMAO : ESTILO.TM_ADJ_VIZ_BRANCO);
      } else {
        vizinhos.forEach((viz, k) => {
          rows[r][2 + k] = estilizada(viz, visitado ? ESTILO.TM_ADJ_VIZ_SALMAO : ESTILO.TM_ADJ_VIZ_BRANCO);
        });
      }
    });

    // 6. Notas de rodapé (Linhas 23 e 25)
    rows[22][0] = estilizada(cfg.nota || "", ESTILO.NEGRITO);
    rows[24][0] = estilizada("assert: caso retorne falso (cor[v] === cor[u]), detecta conflito e reconstrói o ciclo ímpar!", ESTILO.NORMAL);

    // 7. Imagem PNG do Grafo G (A2:G8)
    const arestasGrafo = grafo.arestas.map(a => [a.u, a.v]);
    const visitadosGrafo = ids.filter(id => cfg.cor[id] !== -1);
    const imagemGrafo = gerarPngGrafo({
      arestas: arestasGrafo,
      visitados: visitadosGrafo,
      atual: cfg.atual || null,
      arestasVermelhas: cfg.arestasVermelhas || []
    });

    return {
      name: nomeAba,
      rows,
      widths: [
        3.5, 5.8, 5.8, 5.8, 5.8, 5.8, 5.8, // A..G (Grafo G e adj[])
        1.8,                                // H (espaçador)
        8.5, 8.5, 8.5, 8.5, 8.5, 10, 14,   // I..O (Código)
        1.8,                                // P (espaçador)
        5.5, 11, 8.5, 9.5, 8.5,            // Q..U (v, marcado[], cor[], pai[], comp[])
        1.8,                                // V (espaçador)
        6.8, 6.8                            // W..X (Fila FIFO q)
      ],
      height: 18,
      mesclar,
      semTabelas: true,
      semCongelar: true,
      estiloPadrao: ESTILO.TM_FUNDO_BRANCO,
      zoom: 110,
      imagemGrafo
    };
  }

  /**
   * Constrói todas as abas passo a passo no padrão do Gabarito do Prof. Rafael
   * para o cenário válido (Início, GAB e GAB-<vértice>) e para o cenário de conflito.
   */
  function construirAbasProfessor(g, b, gc, bc) {
    const ids = g.vertices.map(v => v.id);
    const initMap = val => Object.fromEntries(ids.map(id => [id, val]));

    // 1. Aba Inicial em branco (Bipartido-Ex01)
    const abaInicio = montarAbaTesteMesaProf("Bipartido-Ex01", g, {
      cor: initMap(-1),
      pai: initMap(null),
      comp: initMap(0),
      filaItens: [],
      adjVisitados: [],
      arestasVermelhas: [],
      linhasAtivas: [2, 3, 4],
      nota: "Estado Inicial (antes do laço principal da BFS): adj[] não percorrida, todos os vértices com marcado[]=F, cor[]=-1, pai[]=- e Fila FIFO vazia."
    });

    // 2. Simula passo a passo por vértice retirado da fila (u) para gerar as 8 abas GAB-<vértice>
    const cor = initMap(-1), pai = initMap(null), comp = initMap(0);
    const historicoFila = []; // [{ id, cor, removido }]
    const adjVisitados = [];
    const arestasVermelhas = [];
    const abasPassos = [];
    let numComp = 0;

    for (const s of g.vertices) {
      if (cor[s.id] !== -1) continue;
      numComp++;
      cor[s.id] = 0;
      comp[s.id] = numComp;
      const filaComp = [s.id];
      historicoFila.push({ id: s.id, cor: 0, removido: false, passoInsercao: s.id });

      for (let ini = 0; ini < filaComp.length; ini++) {
        const u = filaComp[ini];
        const itemU = historicoFila.find(x => x.id === u);
        if (itemU) itemU.removido = true;
        adjVisitados.push(u);

        const recemDescobertos = (u === s.id) ? [u] : [];
        for (const v of g.adj.get(u)) {
          arestasVermelhas.push(`${u}-${v}`);
          if (cor[v] === -1) {
            cor[v] = 1 - cor[u];
            pai[v] = u;
            comp[v] = numComp;
            filaComp.push(v);
            recemDescobertos.push(v);
            historicoFila.push({ id: v, cor: cor[v], removido: false, passoInsercao: u });
          }
        }

        const filaItens = historicoFila.map(item => ({
          id: item.id,
          cor: item.cor,
          estado: item.removido
            ? "riscado"
            : (item.passoInsercao === u ? "novo" : "aguardando")
        }));

        const novosViz = recemDescobertos.filter(x => x !== u);
        const resumoDescoberta = novosViz.length
          ? `descobre ${novosViz.join(", ")} (cor ${ 1 - cor[u] }, pai ${u})`
          : (g.adj.get(u).length ? "vizinhos já visitados com cor compatível" : "vértice isolado (adj vazia)");

        abasPassos.push(montarAbaTesteMesaProf(`Bipartido-GAB-${u}`, g, {
          cor: { ...cor },
          pai: { ...pai },
          comp: { ...comp },
          atual: u,
          recemDescobertos,
          filaItens,
          adjVisitados: [...adjVisitados],
          arestasVermelhas: [...arestasVermelhas],
          linhasAtivas: novosViz.length ? [12, 13, 14, 15, 16] : [12, 13],
          nota: `Visita u = ${u} (cor ${cor[u]}, comp ${comp[u]}): percorre adj[${u}] = [${g.adj.get(u).join(", ")}] → ${resumoDescoberta}.`
        }));
      }
    }

    // 3. Aba Gabarito Final (Bipartido-GAB)
    const ultimoRastro = b.rastro[b.rastro.length - 1];
    const abaGabaritoFinal = montarAbaTesteMesaProf("Bipartido-GAB", g, {
      cor: ultimoRastro.cor,
      pai: ultimoRastro.pai,
      comp: ultimoRastro.componente,
      filaItens: historicoFila.map(item => ({ id: item.id, cor: item.cor, estado: "riscado" })),
      adjVisitados: ids,
      arestasVermelhas: g.arestas.map(a => `${a.u}-${a.v}`),
      linhasAtivas: [22],
      nota: "Término (Gabarito Final): todas as listas adj[] inspecionadas (2A = 10 exames), 3 componentes conexos e grafo confirmado BIPARTIDO."
    });

    // 4. Aba Gabarito do Cenário de Conflito (Conflito-GAB)
    const rConflito = bc.rastro[bc.rastro.length - 1];
    const abaConflitoGab = montarAbaTesteMesaProf("Conflito-GAB", gc, {
      cor: rConflito.cor,
      pai: rConflito.pai,
      comp: rConflito.componente,
      atual: rConflito.u,
      conflitoVertices: [rConflito.u, rConflito.v],
      filaItens: [
        { id: "C1", cor: 0, estado: "riscado" },
        { id: "T1", cor: 1, estado: "riscado" },
        { id: "T3", cor: 1, estado: "riscado" },
        { id: "C2", cor: 1, estado: "novo" }
      ],
      adjVisitados: ["C1", "T1", "T3"],
      arestasVermelhas: ["C1-T1", "C1-T3", "C1-C2", "C2-T3"],
      linhasAtivas: [17, 18],
      nota: `Conflito detectado ao visitar u = ${rConflito.u}: vizinho v = ${rConflito.v} já possui a mesma cor (${rConflito.cor[rConflito.u]}). Ciclo ímpar: ${bc.ciclo.join(" → ")}.`
    });

    return [abaInicio, abaGabaritoFinal, ...abasPassos, abaConflitoGab];
  }

  function aba_rastro(nome, grafo, bfs) {
    const ids = grafo.vertices.map(v => v.id);
    const linhas = [[
      "Passo", "Evento", "u", "v", "Fila (após o evento)", "Componentes iniciados", "Exames de adjacência",
      ...ids.map(id => "cor_" + id), "Pais (filho←pai)", "Componente de cada vértice", "Observação"
    ]];
    for (const s of bfs.rastro) {
      linhas.push([
        s.passo, s.acao, s.u, s.v, s.fila.join(", "), s.componentes, s.exames,
        ...ids.map(id => s.cor[id]),
        ids.filter(id => s.pai[id] !== null).map(id => `${id}←${s.pai[id]}`).join("; "),
        ids.filter(id => s.componente[id] > 0).map(id => `${id}:${s.componente[id]}`).join("; "),
        s.nota
      ]);
    }
    return {
      name: nome, rows: linhas,
      widths: [9, 18, 8, 8, 26, 14, 14, ...ids.map(() => 9), 40, 40, 62],
      height: 34,
      colorRange: `H2:${colName(6 + ids.length)}${linhas.length}`
    };
  }

  function montarPlanilha({ valido, conflito }, verificacoes) {
    const g = analisarTxt(valido).grafo, b = executarBfs(g);
    const gc = analisarTxt(conflito).grafo, bc = executarBfs(gc);
    const abasProfessor = construirAbasProfessor(g, b, gc, bc);
    const abaValido = aba_rastro("BFS_valido", g, b);
    const abaConflito = aba_rastro("BFS_conflito", gc, bc);

    /* ---- Entradas: as linhas dos dois TXT, com o número da linha original ---- */
    const entradas = [["Cenário", "Linha no TXT", "Registro", "Campo 1", "Campo 2 (tipo)", "Rótulo"]];
    for (const [nome, texto] of [["Válido", valido], ["Conflito", conflito]]) {
      texto.split(/\r?\n/).forEach((l, i) => {
        if (!l.trim() || l.trim().startsWith("#")) return;
        const p = l.split(";").map(x => x.trim());
        entradas.push([nome, i + 1, p[0], p[1] || "", p[2] || "", p[3] || ""]);
      });
    }

    /* ---- Impacto: matriz função × teste do cenário válido + fórmulas ---- */
    const codigos = g.vertices.filter(v => v.tipo === "CODIGO");
    const testes = g.vertices.filter(v => v.tipo === "TESTE");
    const nC = codigos.length, nT = testes.length;
    const ultimaC = 1 + nC;
    const primeiraCol = 4;
    const colTeste = i => colName(primeiraCol + i);
    const colAviso = colName(primeiraCol + nT);
    const cab2 = nC + 4;
    const impacto = [[
      "Código", "Rótulo", "Alterado (1 = sim, 0 = não)", "Testes mapeados",
      ...testes.map(t => t.id), "Aviso"
    ]];
    const selecao0 = new Set(g.alteradas);
    const resultado0 = consultarImpacto(g, g.alteradas, { estrutura: b });
    codigos.forEach((c, i) => {
      const r = i + 2, vizinhos = new Set(g.adj.get(c.id));
      const alterada = selecao0.has(c.id) ? 1 : 0;
      impacto.push([
        c.id, c.rotulo, alterada,
        formula(`SUM(${colTeste(0)}${r}:${colTeste(nT - 1)}${r})`, vizinhos.size),
        ...testes.map(t => (vizinhos.has(t.id) ? 1 : 0)),
        formula(`IF(AND(C${r}=1,D${r}=0),"Sem testes mapeados: isso NÃO dispensa testes","")`,
          alterada && vizinhos.size === 0 ? "Sem testes mapeados: isso NÃO dispensa testes" : "")
      ]);
    });
    impacto.push([]);
    impacto.push([estilizada(`Edite as células amarelas C2:C${ultimaC} (1 = função alterada, 0 = não). Os testes indicados abaixo são recalculados por fórmulas.`, ESTILO.NEGRITO)]);
    impacto.push(["Teste", "Rótulo", "Funções alteradas ligadas", "Indicado?", "Justificativa (funções)"]);
    testes.forEach((t, i) => {
      const r = cab2 + 1 + i, c = colTeste(i);
      const ligadas = (resultado0.itens.find(x => x.id === t.id) || { funcoes: [] }).funcoes;
      const partes = codigos.map((_, k) => `IF(AND($C$${k + 2}=1,${c}$${k + 2}=1),$A$${k + 2}&" ","")`).join("&");
      impacto.push([
        t.id, t.rotulo,
        formula(`SUMPRODUCT($C$2:$C$${ultimaC},${c}$2:${c}$${ultimaC})`, ligadas.length),
        formula(`IF(C${r}>0,"SIM","NAO")`, ligadas.length ? "SIM" : "NAO"),
        formula(`TRIM(${partes})`, ligadas.join(" "))
      ]);
    });
    impacto.push([]);
    impacto.push(["A matriz mostra relações informadas no TXT; não é cobertura medida. A consulta usa só vizinhos diretos (sem propagar pelo componente)."]);
    impacto.push(["Função sem testes mapeados (ex.: C4) gera aviso; isso não significa que ela dispense testes."]);
    impacto.push(["A matriz é a do cenário válido, gravada pela aplicação. Esta aba não lê a aba Entradas."]);
    const primT = cab2 + 1, ultT = cab2 + nT;
    const ultimaColImpacto = colAviso;
    const mesclarImpacto = [`A${nC + 3}:${ultimaColImpacto}${nC + 3}`], alturasImpacto = { [nC + 3]: 24 };
    for (let r = ultT + 2; r <= impacto.length; r++) { mesclarImpacto.push(`A${r}:${ultimaColImpacto}${r}`); alturasImpacto[r] = 24; }

    /* ---- Validacoes ---- */
    const validacoes = [["Grupo", "Verificação", "Esperado", "Obtido", "Status"], ...verificacoes];
    const nV = validacoes.length;
    const aprovadas = verificacoes.filter(r => r[4] === "APROVADO").length;

    /* ---- Resumo ---- */
    const indicados = resultado0.testes.length;
    const resumo = [
      ["Indicador", "Valor", "Interpretação"],
      ["Vértices do cenário válido", formula("COUNTA(Impacto!A2:A" + ultimaC + ")+COUNTA(Impacto!" + colTeste(0) + "1:" + colTeste(nT - 1) + "1)", g.vertices.length), "Quatro funções e quatro testes."],
      ["Arestas do cenário válido", formula(`SUM(Impacto!${colTeste(0)}2:${colTeste(nT - 1)}${ultimaC})`, g.arestas.length), "Relações informadas no exemplo didático."],
      ["Componentes do cenário válido", formula(`COUNTIF(BFS_valido!B2:B${abaValido.rows.length},"Raiz")`, b.componentes), "Inclui C4, que é isolado."],
      ["Exames de adjacência (válido)", formula(`MAX(BFS_valido!G2:G${abaValido.rows.length})`, b.exames), "Cada aresta é examinada duas vezes (uma por extremo)."],
      ["Testes indicados (seleção atual da aba Impacto)", formula(`COUNTIF(Impacto!D${primT}:D${ultT},"SIM")`, indicados), "União dos vizinhos diretos das funções marcadas."],
      ["Proporção indicada", formula(`COUNTIF(Impacto!D${primT}:D${ultT},"SIM")/COUNTA(Impacto!A${primT}:A${ultT})`, indicados / nT, ESTILO.PERCENTUAL), "Não é medição de economia de tempo."],
      ["Conflitos na execução com conflito", formula(`COUNTIF(BFS_conflito!B2:B${abaConflito.rows.length},"Conflito")`, 1), "A BFS encerra no primeiro conflito."],
      ["Ciclo ímpar encontrado (conflito)", bc.ciclo.join(" → "), "Reconstruído pela árvore de pais; tem " + (bc.ciclo.length - 1) + " arestas."],
      ["Verificações aprovadas", formula(`COUNTIF(Validacoes!E2:E${nV},"APROVADO")`, aprovadas), "Execução automatizada com Node (ver aba Validacoes)."],
      ["Verificações executadas", formula(`COUNTA(Validacoes!E2:E${nV})`, verificacoes.length), "Total de linhas da aba Validacoes."]
    ];
    const nResumo = resumo.length;
    resumo.push([]);
    resumo.push([estilizada("IMPORTANTE: As abas Bipartido-* e BFS_* são REGISTROS da execução do algoritmo da aplicação (mesmo código, src/nucleo.js). Não são uma BFS recalculada por fórmulas: editar a aba Entradas NÃO refaz o teste de mesa.", ESTILO.NEGRITO)]);
    resumo.push(["Somente a aba Impacto recalcula: altere a seleção das funções (células amarelas) e os testes indicados mudam por fórmulas."]);
    resumo.push(["Cenários didáticos autorais; não representam dados coletados de uma aplicação real nem cobertura ou desempenho medidos."]);
    const mesclarResumo = [], alturasResumo = {};
    for (let r = nResumo + 2; r <= resumo.length; r++) { mesclarResumo.push(`A${r}:C${r}`); alturasResumo[r] = 36; }

    /* ---- Guia ---- */
    const guia = [
      ["Assunto", "Orientação", "Origem ou referência"],
      ["Padrão do Prof. Rafael", "As 11 primeiras abas (Bipartido-Ex01, Bipartido-GAB, Bipartido-GAB-C1..C4 e Conflito-GAB) seguem o formato visual exato usado nas aulas de TPA.", "IFES-TPA-Lista04-Ex01-Gabarito.xlsx"],
      ["Natureza dos dados", "Cenários didáticos autorais; não são dados reais de uma aplicação.", "cenarios/*.txt"],
      ["Tipo de aba", "Bipartido-* e BFS_*: registro da execução. Impacto: fórmulas. Entradas e Validacoes: dados gravados.", "tools/gerar.js"],
      ["Ordem de execução", "Vértices na ordem de declaração; vizinhos na ordem das arestas; fila FIFO.", "src/nucleo.js"],
      ["Cores da BFS", "-1: não visitado; 0 e 1: grupos produzidos pela BFS. Não são os tipos CODIGO/TESTE.", "src/nucleo.js"],
      ["Fila FIFO nas abas GAB", "Itens riscados em vermelho já saíram da fila; itens com fundo salmão entraram na rodada atual.", "src/planilha.js"],
      ["Impacto", "Células amarelas C2:C5 aceitam 1 ou 0. As fórmulas calculam testes indicados, justificativa e aviso de função sem testes.", "Aba Impacto"],
      ["Cenário de conflito", "A aresta C1-C2 viola o domínio e forma um ciclo ímpar. É um teste negativo do verificador.", "cenarios/cenario-conflito.txt"],
      ["Complexidade", "Núcleo da BFS: O(V+E). Gravar uma cópia dos estados em cada evento custa O(V·(V+E)) em tempo e memória.", "Análise da implementação"],
      ["Referência conceitual", "BFS com duas cores e ciclo ímpar (BipartiteX).", "https://algs4.cs.princeton.edu/41graph/BipartiteX.java.html"]
    ];

    return gerarXlsx([
      ...abasProfessor,
      { name: "Resumo", rows: resumo, widths: [46, 30, 70], height: 32, mesclar: mesclarResumo, alturas: alturasResumo, tables: [{ startRow: 1, endRow: nResumo, startCol: 1, endCol: 3 }] },
      { name: "Guia", rows: guia, widths: [26, 100, 54], height: 40 },
      { name: "Entradas", rows: entradas, widths: [14, 14, 12, 14, 18, 36], height: 20 },
      abaValido, abaConflito,
      {
        name: "Impacto", rows: impacto,
        widths: [16, 28, 20, 18, 22, 12, 12, 12, 40],
        height: 32, cabecalhos: [1, cab2], mesclar: mesclarImpacto, alturas: alturasImpacto,
        entradas: codigos.map((_, i) => `C${i + 2}`),
        validacoes: [{
          sqref: `C2:C${ultimaC}`, lista: "0,1", titulo: "Função alterada", dica: "Digite 1 (alterada) ou 0 (não alterada).",
          erro: "Use somente 1 (alterada) ou 0 (não alterada)."
        }],
        tables: [
          { startRow: 1, endRow: ultimaC, startCol: 1, endCol: primeiraCol + nT + 1 },
          { startRow: cab2, endRow: ultT, startCol: 1, endCol: 5 }
        ]
      },
      { name: "Validacoes", rows: validacoes, widths: [14, 78, 34, 34, 14], height: 24 }
    ]);
  }

  exportar({ montarPlanilha });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Planilha = o; });
