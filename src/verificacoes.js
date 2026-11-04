"use strict";
/*
 * Lista ÚNICA de verificações automatizadas.
 * É usada em três lugares: pelo `node --test` (tests/verificacoes.test.js), pela aba
 * "Guia e verificações" do HTML e pela aba Validacoes do Excel — assim não há três
 * listas que possam divergir.
 */
(function (exportar) {
  const N = typeof require === "function" ? require("./nucleo.js") : globalThis.Nucleo;
  const { analisarTxt, executarBfs, validarSemantica, consultarImpacto } = N;

  /** Monta o grafo de um texto que DEVE ser sintaticamente válido (falha alto se não for). */
  function grafoDe(texto) {
    const r = analisarTxt(texto);
    if (!r.ok) throw new Error("TXT de teste inválido: " + r.erros.map(e => `L${e.linha} ${e.motivo}`).join(" | "));
    return r.grafo;
  }
  const erros = texto => analisarTxt(texto).erros;
  const unicoErro = (texto, trecho) => {
    const e = erros(texto);
    return e.length === 1 && e[0].motivo.includes(trecho) ? `1 erro: ${trecho}` : JSON.stringify(e);
  };

  /** Cada verificação: { grupo, nome, esperado, obter } — `obter` devolve o valor a comparar. */
  function criarVerificacoes({ valido, conflito }) {
    const g = grafoDe(valido);
    const b = executarBfs(g, { rastrear: false });
    const gc = grafoDe(conflito);
    const bc = executarBfs(gc, { rastrear: false });
    const impacto = sel => consultarImpacto(g, sel, { estrutura: b });
    const ids = r => r.testes.join(",");
    const v = (grupo, nome, esperado, obter) => ({ grupo, nome, esperado, obter });

    // Cabeçalho comum para os casos de erro: dois vértices e uma aresta válida.
    const base = "V;C1;CODIGO;f1\nV;T1;TESTE;t1\nE;C1;T1\n";
    // Caminho C1-C2-T1: é bipartido, mas C1-C2 liga duas funções.
    const semanticaRuim = grafoDe("V;C1;CODIGO;f1\nV;C2;CODIGO;f2\nV;T1;TESTE;t1\nE;C1;C2\nE;C2;T1");

    return [
      // ---- Os 15 testes obrigatórios ----
      v("Obrigatório", "Grafo válido: TXT aceito, 8 vértices, 5 arestas", "true,8,5",
        () => `${analisarTxt(valido).ok},${g.vertices.length},${g.arestas.length}`),
      v("Obrigatório", "Grafo válido: bipartido e semântica válida", "true,true",
        () => `${b.bipartido},${validarSemantica(g).valida}`),
      v("Obrigatório", "Ciclo ímpar: conflito não é bipartido", "false", () => bc.bipartido),
      v("Obrigatório", "Ciclo ímpar: triângulo com C1, C2 e T3 (3 arestas, fechado)", "3,true",
        () => `${bc.ciclo.length - 1},${bc.ciclo[0] === bc.ciclo.at(-1) &&
          ["C1", "C2", "T3"].every(x => bc.ciclo.includes(x)) &&
          bc.ciclo.slice(1).every((x, i) => gc.adj.get(bc.ciclo[i]).includes(x))}`),
      v("Obrigatório", "Componentes desconectados: três no cenário válido", "3", () => b.componentes),
      v("Obrigatório", "Componentes desconectados: {C1,C2,T1,T2,T3}, {C3,T4}, {C4} em ordem", "1,1,1,1,1|2,2|3",
        () => {
          const grupos = [[], [], []];
          g.vertices.forEach(x => grupos[b.componente[x.id] - 1].push(b.componente[x.id]));
          return grupos.map(x => x.join(",")).join("|");
        }),
      v("Obrigatório", "Vértice isolado: C4 visitado, cor 0, sem pai, em componente próprio", "0,null,3",
        () => `${b.cor.C4},${b.pai.C4},${b.componente.C4}`),
      v("Obrigatório", "Vértice isolado: C4 gera aviso 'sem testes mapeados'", "C4",
        () => impacto(["C4"]).semTestes.join(",")),
      v("Obrigatório", "Teste compartilhado: T3 aparece uma vez, justificado por C1 e C2", "1,C1+C2",
        () => {
          const r = impacto(["C1", "C2"]);
          return `${r.testes.filter(t => t === "T3").length},${r.itens.find(i => i.id === "T3").funcoes.join("+")}`;
        }),
      v("Obrigatório", "Sem propagação transitiva: só C1 indica T1,T3 (T2 fica de fora)", "T1,T3", () => ids(impacto(["C1"]))),
      v("Obrigatório", "Consulta C1 e C2: T1,T2,T3", "T1,T2,T3", () => ids(impacto(["C1", "C2"]))),
      v("Obrigatório", "Seleção vazia: nenhum teste, sem bloqueio, marcada como vazia", "0,false,true",
        () => { const r = impacto([]); return `${r.testes.length},${r.bloqueada},${r.selecaoVazia}`; }),
      v("Obrigatório", "Tipo inválido em grafo bipartido: BFS aceita (estrutura OK)", "true",
        () => executarBfs(semanticaRuim, { rastrear: false }).bipartido),
      v("Obrigatório", "Tipo inválido em grafo bipartido: semântica rejeita C1–C2", "false,C1-C2",
        () => { const s = validarSemantica(semanticaRuim); return `${s.valida},${s.violacoes.map(x => x.u + "-" + x.v)}`; }),
      v("Obrigatório", "Tipo inválido em grafo bipartido: consulta bloqueada", "true",
        () => consultarImpacto(semanticaRuim, ["C1"]).bloqueada),
      v("Obrigatório", "Conflito: consulta bloqueada pela estrutura e pela semântica", "true,2",
        () => { const r = consultarImpacto(gc, ["C1"]); return `${r.bloqueada},${r.motivos.length}`; }),
      v("Obrigatório", "Vértice duplicado rejeitado (informa linha)", "1 erro: Vértice duplicado",
        () => unicoErro(base + "V;C1;CODIGO;outra", "Vértice duplicado")),
      v("Obrigatório", "Aresta duplicada rejeitada", "1 erro: Aresta duplicada",
        () => unicoErro(base + "E;C1;T1", "Aresta duplicada")),
      v("Obrigatório", "Aresta duplicada INVERTIDA rejeitada", "1 erro: Aresta duplicada",
        () => unicoErro(base + "E;T1;C1", "Aresta duplicada")),
      v("Obrigatório", "Referência inexistente rejeitada", "1 erro: inexistente",
        () => unicoErro(base + "E;C1;T99", "inexistente")),
      v("Obrigatório", "Laço rejeitado", "1 erro: Laço", () => unicoErro(base + "E;C1;C1", "Laço")),
      v("Obrigatório", "Função alterada inexistente rejeitada", "1 erro: Função alterada inexistente",
        () => unicoErro(base + "A;C99", "Função alterada inexistente")),
      v("Obrigatório", "Marcar TESTE como alterado rejeitado", "1 erro: TESTE",
        () => unicoErro(base + "A;T1", "TESTE")),
      v("Obrigatório", "Grafo vazio: aceito, bipartido, 0 componentes, com aviso", "true,true,0,1",
        () => {
          const r = analisarTxt("# só comentário\n\n");
          const bf = executarBfs(r.grafo);
          return `${r.ok},${bf.bipartido},${bf.componentes},${r.avisos.length}`;
        }),

      // ---- Outras garantias do núcleo ----
      v("Núcleo", "Exames de adjacência: 2 por aresta no cenário válido", "10", () => b.exames),
      v("Núcleo", "Cores independentes dos tipos: TESTE declarado primeiro recebe cor 0", "0,1",
        () => { const x = grafoDe("V;T1;TESTE;t\nV;C1;CODIGO;f\nE;C1;T1"); const r = executarBfs(x, { rastrear: false }); return `${r.cor.T1},${r.cor.C1}`; }),
      v("Núcleo", "Modo sem rastreamento dá o mesmo resultado e não guarda rastro", "true,0",
        () => {
          const a = executarBfs(g, { rastrear: true }), c = executarBfs(g, { rastrear: false });
          return `${JSON.stringify([a.cor, a.pai, a.componente, a.exames]) === JSON.stringify([c.cor, c.pai, c.componente, c.exames])},${c.rastro.length}`;
        }),
      v("Núcleo", "Núcleo da BFS não usa Array.shift", "false", () => /\.shift\s*\(/.test(executarBfs.toString())),
      v("Núcleo", "Ciclo ímpar de 5 arestas em um pentágono", "5",
        () => { const p = grafoDe("V;A1;CODIGO;a\nV;A2;CODIGO;b\nV;A3;CODIGO;c\nV;A4;CODIGO;d\nV;A5;CODIGO;e\nE;A1;A2\nE;A2;A3\nE;A3;A4\nE;A4;A5\nE;A5;A1"); return executarBfs(p).ciclo.length - 1; }),
      v("Núcleo", "Conflito em componente posterior: o primeiro componente não impede a detecção", "false,2",
        () => { const x = grafoDe("V;C1;CODIGO;f\nV;T1;TESTE;t\nV;A;CODIGO;a\nV;B;CODIGO;b\nV;D;CODIGO;d\nE;C1;T1\nE;A;B\nE;B;D\nE;D;A"); const r = executarBfs(x); return `${r.bipartido},${r.componentes}`; }),
      v("Núcleo", "Ordem dos vértices e das arestas preservada", "C1,C2,C3,C4,T1,T2,T3,T4|C1-T1,C1-T3,C2-T2,C2-T3,C3-T4",
        () => `${g.vertices.map(x => x.id)}|${g.arestas.map(e => e.u + "-" + e.v)}`),
      v("Núcleo", "Funções alteradas lidas do TXT: C1,C2", "C1,C2", () => g.alteradas.join(",")),
      v("Núcleo", "Não insere arestas automáticas entre vértices do mesmo tipo", "5", () => g.arestas.length),
      v("Núcleo", "Referências a vértices declarados depois são aceitas", "true",
        () => analisarTxt("E;C1;T1\nA;C1\nV;C1;CODIGO;f\nV;T1;TESTE;t").ok),
      v("Núcleo", "Comentários, linhas vazias, BOM e CRLF aceitos", "true,2",
        () => { const r = analisarTxt("\uFEFF# c\r\n\r\nV;C1;CODIGO;f\r\nV;T1;TESTE;t\r\n"); return `${r.ok},${r.grafo.vertices.length}`; }),
      v("Núcleo", "Vários erros são coletados, ordenados por linha, com motivo", "3|2,3,5",
        () => { const e = erros("V;C1;CODIGO;f\nV;C1;CODIGO;g\nE;C1;C1\nV;T1;TESTE;t\nE;C1;ZZ"); return `${e.length}|${e.map(x => x.linha)}`; }),
      v("Núcleo", "Erros de campos: V com 3 campos, tipo inválido, ID inválido, registro desconhecido", "4",
        () => erros("V;C1;CODIGO\nV;C2;ALGO;x\nV;9x;CODIGO;x\nX;1").length),
      v("Núcleo", "TXT inválido não gera grafo", "null", () => String(analisarTxt("E;A;B").grafo)),
      v("Núcleo", "Rótulo com HTML é aceito como texto (a interface escapa)", "<b>x</b>",
        () => grafoDe("V;C1;CODIGO;<b>x</b>").vertices[0].rotulo),
      v("Núcleo", "Grafo grande sem rastreamento: caminho com 50000 vértices é bipartido", "true,1,99998",
        () => {
          const n = 50000, linhas = [];
          for (let i = 0; i < n; i++) linhas.push(`V;${i % 2 ? "T" : "C"}${i};${i % 2 ? "TESTE" : "CODIGO"};x`);
          for (let i = 0; i < n - 1; i++) linhas.push(`E;${i % 2 ? "T" : "C"}${i};${(i + 1) % 2 ? "T" : "C"}${i + 1}`);
          const r = executarBfs(grafoDe(linhas.join("\n")), { rastrear: false });
          return `${r.bipartido},${r.componentes},${r.exames}`;
        }),
      v("Núcleo", "Consulta bloqueia seleção de TESTE ou de função inexistente", "true,true",
        () => `${consultarImpacto(g, ["T1"], { estrutura: b }).bloqueada},${consultarImpacto(g, ["X9"], { estrutura: b }).bloqueada}`)
    ];
  }

  /** Executa todas e devolve linhas [grupo, nome, esperado, obtido, status]. */
  function executarVerificacoes(cenarios) {
    return criarVerificacoes(cenarios).map(c => {
      let obtido;
      try { obtido = String(c.obter()); } catch (e) { obtido = "ERRO: " + e.message; }
      return [c.grupo, c.nome, c.esperado, obtido, obtido === c.esperado ? "APROVADO" : "FALHOU"];
    });
  }

  exportar({ criarVerificacoes, executarVerificacoes });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Verificacoes = o; });
