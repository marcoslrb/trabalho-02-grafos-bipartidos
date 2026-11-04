"use strict";
/*
 * NÚCLEO DO TRABALHO — sem interface, sem DOM.
 * Este arquivo roda no navegador (embutido no HTML) e no Node (testes e geração do Excel).
 *
 * São QUATRO operações distintas, que não devem ser confundidas:
 *   1. analisarTxt        -> validação SINTÁTICA do arquivo (campos, IDs, duplicatas, referências).
 *   2. executarBfs        -> verificação ESTRUTURAL da bipartição (BFS com duas cores).
 *   3. validarSemantica   -> regra do DOMÍNIO: toda aresta liga CODIGO a TESTE.
 *   4. consultarImpacto   -> testes diretamente ligados às funções alteradas.
 */
(function (exportar) {
  const TIPOS = ["CODIGO", "TESTE"];

  // Nomes dos eventos da BFS (usados na animação, no teste de mesa e no Excel).
  const ACAO = {
    INICIO: "Inicialização", RAIZ: "Raiz", RETIRADA: "Retirada", COLORACAO: "Coloração",
    ARESTA_OK: "Aresta OK", CONFLITO: "Conflito", FIM_COMPONENTE: "Fim componente",
    BIPARTIDO: "Bipartido"
  };

  // Proteção TÉCNICA da animação (não é regra do TXT nem exigência do professor):
  // acima de V+E eventos o rastreamento guarda cópias demais, então a interface usa o modo sem rastreamento.
  const LIMITE_RASTREAMENTO = 600;

  /* ------------------------------------------------------------------ */
  /* 1. VALIDAÇÃO SINTÁTICA                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Lê o TXT e devolve { ok, erros: [{linha, motivo}], avisos, grafo }.
   * Todos os erros são coletados (não para no primeiro) e ordenados por linha.
   * Se houver erro, `grafo` é null: nada é construído a partir de um TXT inválido.
   * NÃO verifica se a aresta liga tipos diferentes — isso é a etapa 3.
   */
  function analisarTxt(texto) {
    const erros = [];
    const erro = (linha, motivo) => erros.push({ linha, motivo });

    const vertices = [];            // preserva a ordem de declaração
    const porId = new Map();        // id -> vértice válido
    const idsRejeitados = new Set(); // ids de declarações com erro (evita erros em cascata)
    const pendentes = [];           // E e A só são resolvidos depois: aceitam referência a vértice declarado adiante

    const linhas = String(texto).replace(/^\uFEFF/, "").split(/\r?\n/);
    linhas.forEach((bruta, i) => {
      const numero = i + 1;
      const linha = bruta.trim();
      if (!linha || linha.startsWith("#")) return;        // linha vazia e comentário
      const campos = linha.split(";").map(c => c.trim());
      const registro = campos[0];

      if (registro === "V") {
        if (campos.length !== 4) {
          erro(numero, `V exige 4 campos (V;ID;TIPO;Rótulo), mas a linha tem ${campos.length}.`);
          if (campos[1]) idsRejeitados.add(campos[1]);
          return;
        }
        const [, id, tipo, rotulo] = campos;
        let valido = true;
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(id)) { erro(numero, `ID inválido "${id}": use letra seguida de letras, números ou _.`); valido = false; }
        if (!TIPOS.includes(tipo)) { erro(numero, `Tipo inválido "${tipo}": use CODIGO ou TESTE.`); valido = false; }
        if (!rotulo) { erro(numero, "Rótulo vazio."); valido = false; }
        if (valido && porId.has(id)) {
          erro(numero, `Vértice duplicado: ${id} já foi declarado na linha ${porId.get(id).linha}.`);
          valido = false;
        }
        if (valido) {
          const v = { id, tipo, rotulo, linha: numero };
          porId.set(id, v);
          vertices.push(v);
        } else if (id && !porId.has(id)) {
          idsRejeitados.add(id);
        }
      } else if (registro === "E" || registro === "A") {
        const esperado = registro === "E" ? 3 : 2;
        const modelo = registro === "E" ? "E;ID_ORIGEM;ID_DESTINO" : "A;ID_CODIGO_ALTERADO";
        if (campos.length !== esperado || campos.slice(1).some(c => !c)) {
          erro(numero, `${registro} exige ${esperado} campos preenchidos (${modelo}).`);
          return;
        }
        pendentes.push({ campos, numero });
      } else {
        erro(numero, `Registro desconhecido "${registro}": use V, E ou A.`);
      }
    });

    // Segunda passada: todos os vértices já são conhecidos, então a ordem das linhas não importa.
    const arestas = [];
    const alteradas = [];
    const linhaDaAresta = new Map();
    const linhaDaAlterada = new Map();
    for (const { campos, numero } of pendentes) {
      if (campos[0] === "E") {
        const [, u, v] = campos;
        const falhas = [u, v].filter(id => !porId.has(id) && !idsRejeitados.has(id));
        if (falhas.length) { erro(numero, `Aresta referencia vértice inexistente: ${[...new Set(falhas)].join(", ")}.`); continue; }
        if (idsRejeitados.has(u) || idsRejeitados.has(v)) continue; // causa raiz já reportada na declaração
        if (u === v) { erro(numero, `Laço não permitido: ${u} ligado a ele mesmo.`); continue; }
        // A aresta não é direcionada: C1-T1 e T1-C1 são a mesma aresta.
        const chave = [u, v].sort().join("|");
        if (linhaDaAresta.has(chave)) {
          erro(numero, `Aresta duplicada: ${u}–${v} já existe na linha ${linhaDaAresta.get(chave)} (arestas não têm direção).`);
          continue;
        }
        linhaDaAresta.set(chave, numero);
        arestas.push({ u, v, linha: numero });
      } else {
        const id = campos[1];
        if (idsRejeitados.has(id)) continue;
        if (!porId.has(id)) { erro(numero, `Função alterada inexistente: ${id}.`); continue; }
        if (porId.get(id).tipo !== "CODIGO") { erro(numero, `${id} é do tipo TESTE: só funções (CODIGO) podem ser marcadas como alteradas.`); continue; }
        if (linhaDaAlterada.has(id)) { erro(numero, `Função alterada duplicada: ${id} já foi marcada na linha ${linhaDaAlterada.get(id)}.`); continue; }
        linhaDaAlterada.set(id, numero);
        alteradas.push(id);
      }
    }

    erros.sort((a, b) => a.linha - b.linha);
    const avisos = [];
    if (!erros.length && vertices.length === 0) avisos.push("O TXT não declara nenhum vértice (grafo vazio).");
    if (erros.length) return { ok: false, erros, avisos, grafo: null };

    // Listas de adjacência: vizinhos na ordem em que as arestas foram declaradas.
    const adj = new Map(vertices.map(v => [v.id, []]));
    for (const { u, v } of arestas) { adj.get(u).push(v); adj.get(v).push(u); }
    return { ok: true, erros: [], avisos, grafo: { vertices, arestas, alteradas, porId, adj } };
  }

  /** Vale a pena guardar um rastro completo? Ver LIMITE_RASTREAMENTO. */
  function deveRastrear(grafo) {
    return grafo.vertices.length + grafo.arestas.length <= LIMITE_RASTREAMENTO;
  }

  /* ------------------------------------------------------------------ */
  /* 2. VERIFICAÇÃO ESTRUTURAL: BFS COM DUAS CORES                       */
  /* ------------------------------------------------------------------ */

  /**
   * Reconstrói um ciclo ímpar com a árvore de pais.
   * u e v foram encontrados com a MESMA cor e são vizinhos. Sobe-se de u até a raiz e de v até
   * encontrar um ancestral comum (menor ancestral comum). O caminho u..ancestral..v mais a aresta v–u
   * forma um ciclo de comprimento ímpar (distâncias de mesma paridade + 1 aresta).
   */
  function cicloImpar(u, v, pai) {
    const subindoU = [];
    for (let x = u; x !== null; x = pai[x]) subindoU.push(x);
    const posicao = new Map(subindoU.map((x, i) => [x, i]));
    const descendoV = [];
    let x = v;
    while (!posicao.has(x)) { descendoV.push(x); x = pai[x]; }
    // x agora é o menor ancestral comum
    return subindoU.slice(0, posicao.get(x) + 1).concat(descendoV.reverse(), u);
  }

  /**
   * BFS com duas cores em TODOS os componentes (inclusive vértices isolados).
   * Estado mantido: cor (-1 = não visitado, 0 ou 1), pai, componente de cada vértice,
   * fila (vetor + índice de início, sem Array.shift) e quantidade de exames de adjacência.
   *
   * { rastrear: true }  guarda uma cópia completa dos estados a cada evento (animação e teste de mesa).
   * { rastrear: false } roda só o núcleo. O núcleo percorre o grafo em O(V+E); gravar uma cópia de
   *   cor/pai/componente em cada evento custa O(V) por evento, e há O(V+E) eventos: O(V·(V+E)) em
   *   tempo e memória. Por isso o modo sem rastreamento existe.
   */
  function executarBfs(grafo, { rastrear = true } = {}) {
    const cor = Object.create(null);
    const pai = Object.create(null);
    const componente = Object.create(null);   // número do componente de cada vértice (1, 2, ...)
    const rastro = [];
    for (const v of grafo.vertices) { cor[v.id] = -1; pai[v.id] = null; componente[v.id] = 0; }

    let componentes = 0;
    let exames = 0;                           // quantas vezes um vizinho foi examinado
    let fila = [];
    let inicio = 0;                           // índice de início: "retirar" é só avançar este número

    // Registra o estado APÓS o evento. Sem rastreamento, não copia nada.
    function registrar(acao, u = "", v = "", nota = "") {
      if (!rastrear) return;
      rastro.push({
        passo: rastro.length, acao, u, v, nota,
        fila: fila.slice(inicio),
        cor: { ...cor }, pai: { ...pai }, componente: { ...componente },
        componentes, exames
      });
    }

    registrar(ACAO.INICIO, "", "", "Todos os vértices começam com cor -1 (não visitado).");

    // Laço externo: cada vértice ainda não visitado inicia um novo componente.
    // É isso que garante a visita de componentes desconectados e de vértices isolados.
    for (const raiz of grafo.vertices.map(v => v.id)) {
      if (cor[raiz] !== -1) continue;
      componentes++;
      fila = [];
      inicio = 0;
      cor[raiz] = 0;
      componente[raiz] = componentes;
      fila.push(raiz);
      registrar(ACAO.RAIZ, raiz, "", `Início do componente ${componentes}; a raiz recebe cor 0.`);

      while (inicio < fila.length) {
        const u = fila[inicio++];
        registrar(ACAO.RETIRADA, u, "", "Retira da fila para examinar seus vizinhos.");

        for (const v of grafo.adj.get(u)) {
          exames++;
          if (cor[v] === -1) {
            // vizinho novo: cor oposta, pai registrado, entra na fila
            cor[v] = 1 - cor[u];
            pai[v] = u;
            componente[v] = componentes;
            fila.push(v);
            registrar(ACAO.COLORACAO, u, v, "Vizinho novo recebe a cor oposta e entra na fila.");
          } else if (cor[v] === cor[u]) {
            // DECISÃO: vizinhos com a mesma cor => não é bipartido. Reconstrói o ciclo e encerra.
            const ciclo = cicloImpar(u, v, pai);
            registrar(ACAO.CONFLITO, u, v, "Extremos da aresta têm a mesma cor: existe ciclo ímpar.");
            return { bipartido: false, cor, pai, componente, ciclo, rastro, componentes, exames, rastreado: rastrear };
          } else {
            registrar(ACAO.ARESTA_OK, u, v, "Os extremos têm cores diferentes.");
          }
        }
      }
      registrar(ACAO.FIM_COMPONENTE, raiz, "", `Fila esgotada: componente ${componentes} verificado.`);
    }

    registrar(ACAO.BIPARTIDO, "", "", "Todos os componentes foram verificados sem conflito.");
    return { bipartido: true, cor, pai, componente, ciclo: [], rastro, componentes, exames, rastreado: rastrear };
  }

  /* ------------------------------------------------------------------ */
  /* 3. VALIDAÇÃO SEMÂNTICA                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Regra do domínio: cada aresta deve ligar CODIGO a TESTE.
   * É independente da BFS: um grafo pode ser bipartido e mesmo assim violar a regra
   * (ex.: C1–C2 e C2–T1 é um caminho, bipartido, mas C1–C2 liga duas funções).
   */
  function validarSemantica(grafo) {
    const violacoes = grafo.arestas
      .filter(e => grafo.porId.get(e.u).tipo === grafo.porId.get(e.v).tipo)
      .map(e => ({ u: e.u, v: e.v, tipo: grafo.porId.get(e.u).tipo, linha: e.linha }));
    return { valida: violacoes.length === 0, violacoes };
  }

  /* ------------------------------------------------------------------ */
  /* 4. CONSULTA DE IMPACTO                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Para as funções alteradas, devolve a UNIÃO dos vizinhos diretos do tipo TESTE.
   * Não percorre o componente: se C1 mudou, T3 entra, mas C2 (que também usa T3) não "contamina" T2.
   * `itens` diz, para cada teste, quais funções selecionadas o justificam.
   * Função sem vizinhos entra em `semTestes` — isso NÃO significa "não precisa testar".
   *
   * Bloqueia (bloqueada: true) se a estrutura não for bipartida ou a semântica for inválida.
   */
  function consultarImpacto(grafo, selecionadas, { estrutura, semantica } = {}) {
    estrutura = estrutura || executarBfs(grafo, { rastrear: false });
    semantica = semantica || validarSemantica(grafo);

    const motivos = [];
    if (!estrutura.bipartido) motivos.push("a estrutura não é bipartida (etapa 2)");
    if (!semantica.valida) motivos.push("há relações entre vértices do mesmo tipo (etapa 3)");

    const escolhidas = [...new Set(selecionadas)];
    const invalidas = escolhidas.filter(id => !grafo.porId.has(id) || grafo.porId.get(id).tipo !== "CODIGO");
    if (invalidas.length) motivos.push(`a seleção contém vértices que não são funções existentes: ${invalidas.join(", ")}`);
    if (motivos.length) return { bloqueada: true, motivos };

    const indice = new Map(grafo.vertices.map((v, i) => [v.id, i]));
    const ordem = (a, b) => indice.get(a) - indice.get(b);
    const justificativa = new Map();           // teste -> funções selecionadas que o justificam
    const semTestes = [];
    for (const f of escolhidas.sort(ordem)) {
      const vizinhos = grafo.adj.get(f);       // apenas vizinhos diretos, sem busca no componente
      if (!vizinhos.length) semTestes.push(f);
      for (const t of vizinhos) {
        if (!justificativa.has(t)) justificativa.set(t, []);
        justificativa.get(t).push(f);          // o Map garante que cada teste aparece uma só vez
      }
    }
    const testes = [...justificativa.keys()].sort(ordem);
    return {
      bloqueada: false,
      selecaoVazia: escolhidas.length === 0,
      testes,
      itens: testes.map(id => ({ id, rotulo: grafo.porId.get(id).rotulo, funcoes: justificativa.get(id) })),
      semTestes,
      totalTestes: grafo.vertices.filter(v => v.tipo === "TESTE").length
    };
  }

  exportar({
    ACAO, TIPOS, LIMITE_RASTREAMENTO,
    analisarTxt, deveRastrear, cicloImpar, executarBfs, validarSemantica, consultarImpacto
  });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Nucleo = o; });

