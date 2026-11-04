"use strict";
/*
 * Conteúdo da planilha do teste de mesa (as 7 abas exigidas):
 * Resumo, Guia, Entradas, BFS_valido, BFS_conflito, Impacto, Validacoes.
 *
 * Os rastros das abas BFS_* vêm de executarBfs (o MESMO algoritmo da aplicação).
 * São registros da execução, não uma BFS recalculada por fórmulas.
 * Só a aba Impacto tem fórmulas vivas (a seleção de funções é editável).
 */
(function (exportar) {
  const N = typeof require === "function" ? require("./nucleo.js") : globalThis.Nucleo;
  const X = typeof require === "function" ? require("./xlsx.js") : globalThis.Xlsx;
  const { analisarTxt, executarBfs, consultarImpacto } = N;
  const { colName, formula, estilizada, ESTILO, gerarXlsx } = X;

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
      colorRange: `H2:${colName(6 + ids.length)}${linhas.length}`   // colunas cor_* (0 e 1 coloridos)
    };
  }

  function montarPlanilha({ valido, conflito }, verificacoes) {
    const g = analisarTxt(valido).grafo, b = executarBfs(g);
    const gc = analisarTxt(conflito).grafo, bc = executarBfs(gc);
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
    const ultimaC = 1 + nC;                         // última linha de função
    const primeiraCol = 4;                          // E: início da matriz de testes (índice 0 = A)
    const colTeste = i => colName(primeiraCol + i);
    const colAviso = colName(primeiraCol + nT);
    const cab2 = nC + 4;                            // linha do cabeçalho da 2ª tabela
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
      // Justificativa: concatena os códigos alterados cuja célula da matriz vale 1 para este teste.
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
    // Notas do Impacto: mescladas de A até a última coluna, fora das tabelas.
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
    resumo.push([estilizada("IMPORTANTE: BFS_valido e BFS_conflito são REGISTROS da execução do algoritmo da aplicação (mesmo código, src/nucleo.js). Não são uma BFS recalculada por fórmulas: editar a aba Entradas NÃO refaz o teste de mesa.", ESTILO.NEGRITO)]);
    resumo.push(["Somente a aba Impacto recalcula: altere a seleção das funções (células amarelas) e os testes indicados mudam por fórmulas."]);
    resumo.push(["Cenários didáticos autorais; não representam dados coletados de uma aplicação real nem cobertura ou desempenho medidos."]);
    resumo.push(["Pendente: linguagem, prazo, duração, número de vértices e formato de entrega não foram confirmados (enunciado original não estava no projeto)."]);
    const mesclarResumo = [], alturasResumo = {};
    for (let r = nResumo + 2; r <= resumo.length; r++) { mesclarResumo.push(`A${r}:C${r}`); alturasResumo[r] = 36; }

    /* ---- Guia ---- */
    const guia = [
      ["Assunto", "Orientação", "Origem ou referência"],
      ["Natureza dos dados", "Cenários didáticos autorais; não são dados reais de uma aplicação.", "cenarios/*.txt"],
      ["Tipo de aba", "BFS_valido e BFS_conflito: registro da execução. Impacto: fórmulas. Entradas e Validacoes: dados gravados.", "tools/gerar.js"],
      ["Ordem de execução", "Vértices na ordem de declaração; vizinhos na ordem das arestas; fila FIFO.", "src/nucleo.js"],
      ["Eventos", "Cada linha mostra o estado APÓS o evento: Inicialização, Raiz, Retirada, Coloração, Aresta OK, Conflito, Fim componente, Bipartido.", "src/nucleo.js"],
      ["Cores da BFS", "-1: não visitado; 0 e 1: grupos produzidos pela BFS. Não são os tipos CODIGO/TESTE.", "src/nucleo.js"],
      ["Pais", "O pai é gravado quando o vértice é descoberto (aresta da árvore da BFS).", "src/nucleo.js"],
      ["Componentes", "Número do componente de cada vértice; a coluna 'Componentes iniciados' é o contador acumulado.", "src/nucleo.js"],
      ["Exames", "Contagem acumulada de vizinhos examinados. Aresta não direcionada aparece nas duas listas.", "src/nucleo.js"],
      ["Atualização", "Editar a aba Entradas não recalcula a BFS. Para outro grafo, use a aplicação e gere nova planilha.", "Limitação da planilha"],
      ["Impacto", "Células amarelas C2:C5 aceitam 1 ou 0. As fórmulas calculam testes indicados, justificativa e aviso de função sem testes.", "Aba Impacto"],
      ["Cenário de conflito", "A aresta C1-C2 viola o domínio e forma um ciclo ímpar. É um teste negativo do verificador, não uma relação legítima.", "cenarios/cenario-conflito.txt"],
      ["Complexidade", "Núcleo da BFS: O(V+E). Gravar uma cópia dos estados em cada evento custa O(V·(V+E)) em tempo e memória.", "Análise da implementação"],
      ["Garantia", "A indicação depende do mapeamento informado; não garante cobertura completa.", "Limitação do modelo"],
      ["Referência conceitual", "BFS com duas cores e ciclo ímpar (BipartiteX).", "https://algs4.cs.princeton.edu/41graph/BipartiteX.java.html"],
      ["Conferência", "Abrir no Excel ou LibreOffice e conferir fórmulas, filtros, formatação e ausência de aviso de reparo.", "docs/resultado-verificacoes.md"]
    ];

    return gerarXlsx([
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
