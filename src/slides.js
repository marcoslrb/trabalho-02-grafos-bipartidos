"use strict";
/*
 * Conteúdo da apresentação: cada slide tem o que aparece na tela (titulo, topicos, grafo)
 * e o texto que será dito (fala). O roteiro de fala é gerado a partir deste mesmo vetor,
 * para a tela e a fala nunca ficarem desencontradas.
 * Os grafos dos slides são desenhados pelo mesmo desenharGrafo da aplicação.
 */
(function (exportar) {
  const N = typeof require === "function" ? require("./nucleo.js") : globalThis.Nucleo;
  const S = typeof require === "function" ? require("./grafo-svg.js") : globalThis.GrafoSvg;
  const { analisarTxt, executarBfs } = N;
  const { esc, desenharGrafo } = S;

  // Números que aparecem em slide vêm do cálculo, não de texto digitado à mão.
  function slidesDe({ valido, conflito }, verificacoes) {
    const g = analisarTxt(valido).grafo, b = executarBfs(g);
    const gc = analisarTxt(conflito).grafo, bc = executarBfs(gc);
    const aprovadas = verificacoes ? verificacoes.filter(r => r[4] === "APROVADO").length : null;
    const total = verificacoes ? verificacoes.length : null;
    const ciclo = bc.ciclo.join(" → ");
    const quem = { M: "Marcos", A: "André" };

    return [
      {
        quem: quem.M, kicker: "Técnicas de Programação Avançada • Prof. Rafael Vargas",
        titulo: "Mudou o código: o que testar?",
        topicos: ["Grafos bipartidos aplicados a funções e casos de teste.", "Marcos Ribeiro e André Valane"],
        fala: "Olá. Somos o Marcos e o André e vamos apresentar o trabalho de Grafos Bipartidos. A pergunta do título é: quando uma função muda, quais testes eu devo olhar? A ferramenta que construímos responde isso a partir de um mapeamento informado por arquivo de texto. Ela não executa testes, não lê o Git e não descobre cobertura sozinha."
      },
      {
        quem: quem.M, titulo: "O problema",
        topicos: ["Uma alteração pode afetar vários testes.", "Um teste pode exercitar várias funções.", "O mapeamento função–teste é informado manualmente, em TXT."],
        fala: "Em um projeto real, uma função costuma ser usada por mais de um teste, e um teste costuma passar por mais de uma função. Quando alguém altera uma função, precisamos saber quais testes estão ligados a ela. Aqui o mapeamento é dado por nós, em um TXT. Por isso o resultado vale tanto quanto o mapeamento: se ele estiver incompleto, a indicação também estará."
      },
      {
        quem: quem.M, titulo: "Dois conjuntos, uma relação",
        topicos: ["CODIGO: funções da aplicação.", "TESTE: casos de teste.", "Aresta não direcionada: o teste exercita a função, sem peso.", "Não existe relação legítima dentro do mesmo tipo."],
        fala: "O modelo tem dois tipos de vértice: CODIGO, que são as funções, e TESTE, que são os casos de teste. Uma aresta liga uma função a um teste que a exercita. Ela não tem direção nem peso. Uma função pode ter vários testes e um teste pode ter várias funções. Esse é exatamente o formato de um grafo bipartido: todas as arestas cruzam entre os dois conjuntos."
      },
      {
        quem: quem.M, titulo: "O cenário válido", grafo: "valido",
        topicos: [`${g.vertices.length} vértices e ${g.arestas.length} arestas.`, "T3 é compartilhado por C1 e C2.", "C4 é uma função isolada, sem testes mapeados.", `${b.componentes} componentes conectados.`],
        fala: `Este é o nosso primeiro arquivo de entrada. Temos quatro funções e quatro testes, com cinco relações. O teste T3, testeCompraComCupom, usa tanto calcularDesconto quanto validarCupom. A função C4, registrarAuditoria, não tem nenhum teste ligado: é um vértice isolado. O grafo tem ${b.componentes} componentes: o principal, o par C3 e T4, e o C4 sozinho. Os retângulos são funções e os círculos são testes, então o tipo não depende de cor.`
      },
      {
        quem: quem.M, titulo: "Quatro operações diferentes",
        topicos: ["1. Sintaxe do TXT: campos, IDs, duplicatas, referências.", "2. Estrutura: BFS com duas cores decide se é bipartido.", "3. Semântica: cada aresta liga CODIGO a TESTE.", "4. Consulta: testes ligados diretamente às funções alteradas."],
        fala: "Separamos quatro operações que são fáceis de confundir. Primeiro, a sintaxe: o arquivo está bem formado? Segundo, a estrutura: a BFS com duas cores diz se o grafo é bipartido. Terceiro, a semântica: cada aresta liga mesmo uma função a um teste? E só então, quarto, a consulta de impacto. Se qualquer uma das etapas anteriores falhar, a recomendação fica bloqueada."
      },
      {
        quem: quem.M, titulo: "BFS com duas cores",
        topicos: ["Cada vértice ainda sem cor inicia um componente e recebe a cor 0.", "Fila com índice de início: retirar é avançar um número, sem Array.shift.", "Vizinho novo recebe a cor oposta, guarda o pai e entra na fila.", "Vizinho já visitado com a mesma cor: conflito e ciclo ímpar pela árvore de pais.", "Mantemos cor, pai, componente, fila e exames de adjacência."],
        fala: "A BFS percorre todos os componentes. O laço externo olha cada vértice, então o isolado C4 e o componente C3–T4 também são visitados. A raiz recebe cor 0, os vizinhos novos recebem a cor oposta e entram na fila. Se encontramos um vizinho já colorido com a mesma cor, existe ciclo ímpar: subimos pela árvore de pais até o ancestral comum e reconstruímos o ciclo. A fila usa um índice de início, então retirar elemento não desloca o vetor."
      },
      {
        quem: quem.M, titulo: "Como ler o teste de mesa", grafo: "colorido",
        topicos: ["Cada linha mostra o estado depois de um evento.", "Observar fila, cores, pais e componente.", "Vértices e arestas seguem a ordem do arquivo.", "O Excel registra a execução do mesmo algoritmo da aplicação."],
        fala: "No teste de mesa, cada linha é um evento da BFS: inicialização, raiz, retirada da fila, coloração, aresta verificada e fim de componente. Em cada linha vemos a fila, a cor de cada vértice, os pais, o componente e quantos vizinhos já foram examinados. A planilha foi gerada pelo mesmo código da aplicação. Ela é um registro da execução; se alguém editar o TXT dentro da planilha, a BFS não é recalculada."
      },
      {
        quem: quem.A, titulo: "Cor da BFS não é tipo do vértice", grafo: "colorido",
        topicos: ["Cor 0 e cor 1 identificam os dois lados encontrados pela BFS.", "CODIGO e TESTE identificam o papel no domínio.", "Aqui os dois coincidem porque cada componente começa por uma função.", "Se um TESTE for declarado primeiro, ele recebe cor 0."],
        fala: "Um ponto importante: azul e laranja são as cores da BFS, não os tipos. Neste exemplo elas coincidem com função e teste só porque a raiz de cada componente é uma função. Se um teste fosse declarado primeiro, ele receberia a cor zero. Por isso o tipo aparece por forma e por texto, e a cor aparece com o número escrito dentro do vértice."
      },
      {
        quem: quem.A, titulo: "O cenário de conflito", grafo: "conflito",
        topicos: ["O segundo TXT acrescenta a aresta C1–C2.", `Ciclo ímpar encontrado: ${ciclo} (${bc.ciclo.length - 1} arestas).`, "A BFS encerra no primeiro conflito.", "É um teste negativo, não uma relação legítima."],
        fala: `O segundo arquivo acrescenta uma aresta entre C1 e C2, duas funções. Isso cria o triângulo C1, T3, C2. A BFS encontra dois vizinhos com a mesma cor e reconstrói o ciclo: ${ciclo}. Ele tem ${bc.ciclo.length - 1} arestas, ou seja, comprimento ímpar, então o grafo não é bipartido. Deixamos claro na interface que essa aresta não é uma relação legítima de código e teste: é uma entrada negativa para provar que o verificador funciona.`
      },
      {
        quem: quem.A, titulo: "Estrutura não é semântica",
        topicos: ["Caminho C1–C2–T1 é bipartido.", "Mesmo assim, C1–C2 liga duas funções.", "A BFS não vê tipos; a validação semântica não vê cores.", "Estrutura ou semântica inválida bloqueiam a consulta."],
        fala: "Atenção: ser bipartido não basta. Um caminho C1, C2, T1 é bipartido, mas a aresta C1–C2 liga duas funções, o que o domínio não permite. Por isso temos duas verificações independentes: a BFS cuida da estrutura e outra etapa confere os tipos das pontas de cada aresta. Basta uma delas falhar para a consulta de impacto ser bloqueada."
      },
      {
        quem: quem.A, titulo: "Consulta de impacto: C1 e C2", grafo: "impacto",
        topicos: ["Vizinhos TESTE de C1: T1 e T3.", "Vizinhos TESTE de C2: T2 e T3.", "União sem repetição: T1, T2 e T3.", "T3 é justificado por C1 e C2."],
        fala: "Agora a consulta. Para as funções alteradas, C1 e C2, pegamos os vizinhos do tipo teste de cada uma e fazemos a união. C1 traz T1 e T3, C2 traz T2 e T3. O resultado é T1, T2 e T3, e o T3 aparece uma única vez, com a justificativa de que ele se liga às duas funções alteradas. O T4 fica de fora porque não se liga a nenhuma função alterada."
      },
      {
        quem: quem.A, titulo: "Sem propagação e sem testes mapeados",
        topicos: ["Só C1 alterada: T1 e T3. T2 não entra.", "A consulta olha só vizinhos diretos, não o componente inteiro.", "Função sem vizinhos: aviso “sem testes mapeados”.", "Isso não significa que a função não precisa de testes."],
        fala: "Se só C1 mudou, indicamos T1 e T3. O T2 não entra, mesmo que o T3 também se ligue a C2, porque não percorremos o componente de forma transitiva. Se escolhermos a função C4, não há teste ligado a ela, e a ferramenta mostra o aviso de que não há testes mapeados. Esse aviso é diferente de dizer que a função não precisa ser testada: apenas não existe relação cadastrada."
      },
      {
        quem: quem.A, titulo: "Custo e limites",
        topicos: ["Núcleo da BFS: O(V+E) com listas de adjacência e fila indexada.", "Gravar uma cópia dos estados em cada evento custa O(V·(V+E)).", "Por isso existe o modo sem rastreamento.", "O resultado depende do mapeamento informado; não mede cobertura nem tempo."],
        fala: "Sobre custo: o núcleo da BFS percorre cada vértice e cada aresta uma vez, então é O(V+E). Mas, para animar e montar o teste de mesa, gravamos uma cópia completa dos estados a cada evento. Isso tem custo maior, na ordem de V vezes V+E. Por isso a BFS tem um modo sem rastreamento, usado nas consultas e nos testes com grafos grandes. E lembramos os limites: não medimos economia de tempo e a qualidade da indicação depende do mapeamento."
      },
      {
        quem: quem.A, titulo: "Verificações e demonstração",
        topicos: [aprovadas === null ? "Verificações automatizadas executadas com Node." : `${aprovadas} de ${total} verificações automatizadas aprovadas.`, "Cobrem os 15 casos obrigatórios e o núcleo da BFS.", "Demonstração: cenário válido, seleção de funções, cenário de conflito.", "Excel com 7 abas e fórmulas na aba Impacto."],
        fala: `Para garantir o comportamento, escrevemos verificações automatizadas${aprovadas === null ? "" : `: ${aprovadas} de ${total} aprovadas na última execução`}. Elas cobrem os casos obrigatórios, como ciclo ímpar, vértice isolado, teste compartilhado, seleção vazia e todos os erros de entrada. Agora vamos mostrar a aplicação: carregar o cenário válido, avançar a BFS, selecionar C1 e C2, depois só C4, e por fim carregar o cenário de conflito.`
      },
      {
        quem: quem.A, titulo: "Conclusão",
        topicos: ["Funções e testes representados como grafo bipartido.", "BFS explicável, com teste de mesa e animação.", "Indicação de testes por vizinhança direta, com justificativa.", "Limite: o resultado é tão bom quanto o mapeamento."],
        fala: "Concluindo: representamos funções e testes como um grafo bipartido, verificamos a bipartição com BFS e usamos a vizinhança direta das funções alteradas para indicar testes, sempre mostrando a justificativa. Voltando à pergunta do título: mudou o código, o que testar? Os testes ligados diretamente às funções alteradas, conforme o mapeamento informado. Obrigado."
      }
    ].map((s, i) => ({ ...s, numero: i + 1 }));
  }

  function marcacaoSlides(cenarios, verificacoes) {
    const g = analisarTxt(cenarios.valido).grafo, b = executarBfs(g, { rastrear: false });
    const gc = analisarTxt(cenarios.conflito).grafo, bc = executarBfs(gc, { rastrear: false });
    const slides = slidesDe(cenarios, verificacoes);
    return slides.map((s, i) => {
      let visual = "";
      if (s.grafo === "valido") visual = desenharGrafo(g, null, new Set());
      else if (s.grafo === "colorido") visual = desenharGrafo(g, { cor: b.cor }, new Set());
      else if (s.grafo === "conflito") visual = desenharGrafo(gc, { cor: bc.cor }, new Set(), bc.ciclo);
      else if (s.grafo === "impacto") visual = desenharGrafo(g, { cor: b.cor }, new Set(["C1", "C2"]));
      const corpo = `<ul class="reveal">${s.topicos.map(t => `<li>${esc(t)}</li>`).join("")}</ul>`;
      return `<article class="slide ${i === 0 ? "active" : ""}" data-slide="${i + 1}" aria-label="Slide ${i + 1}">` +
        `<div class="gradient-mesh"><div class="blob"></div><div class="blob"></div></div>` +
        `<div class="content"><p class="kicker reveal">${esc(s.kicker || "Código e testes • Grafos bipartidos")}</p>` +
        `<h2 class="reveal">${esc(s.titulo)}</h2>` +
        (visual ? `<div class="split"><div>${corpo}</div><div class="reveal">${visual}</div></div>` : corpo) +
        `<p class="citation reveal">Cenários didáticos autorais • Não representa medição de desempenho • ${i + 1}/${slides.length}</p></div></article>`;
    }).join("");
  }

  /** Apresentação em um único arquivo HTML, com setas, espaço e deslizar no celular. */
  function htmlApresentacao(css, cenarios, verificacoes) {
    const navegacao = `
      let n = 0;
      const slides = [...document.querySelectorAll(".slide")];
      function mostrar(i) {
        n = (i + slides.length) % slides.length;
        slides.forEach((s, k) => s.classList.toggle("active", k === n));
        document.getElementById("contador").textContent = (n + 1) + " / " + slides.length;
      }
      document.getElementById("anterior").onclick = () => mostrar(n - 1);
      document.getElementById("proximo").onclick = () => mostrar(n + 1);
      document.addEventListener("keydown", e => {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); mostrar(n + 1); }
        if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); mostrar(n - 1); }
      });
      let inicio = 0;
      document.addEventListener("touchstart", e => inicio = e.changedTouches[0].clientX, { passive: true });
      document.addEventListener("touchend", e => {
        const dx = e.changedTouches[0].clientX - inicio;
        if (Math.abs(dx) > 60) mostrar(n + (dx < 0 ? 1 : -1));
      }, { passive: true });
      mostrar(0);`;
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">` +
      `<meta name="viewport" content="width=device-width,initial-scale=1"><title>Mudou o código: o que testar? — apresentação</title>` +
      `<style>${css}\nbody{margin:0;background:#f0f7fb}.deck{height:calc(100dvh - 80px);min-height:0;border-radius:0}` +
      `.controls{justify-content:center;height:64px;margin:0}@media print{.deck{height:auto}.controls{display:none!important}}</style></head><body>` +
      `<div class="deck">${marcacaoSlides(cenarios, verificacoes)}</div>` +
      `<nav class="controls" aria-label="Navegação dos slides"><button id="anterior">← Anterior</button><span id="contador"></span>` +
      `<button id="proximo">Próximo →</button></nav><script>${navegacao}<\/script></body></html>`;
  }

  /** Roteiro de fala em Markdown, um bloco por slide. */
  function textoRoteiro(cenarios, verificacoes) {
    const slides = slidesDe(cenarios, verificacoes);
    return `# Roteiro de fala — Mudou o código: o que testar?

Dupla: Marcos Ribeiro e André Valane — Técnicas de Programação Avançada (Prof. Rafael Vargas).

> **Pendente:** o enunciado original não estava no projeto. Duração, formato e linguagem exigidos **não foram confirmados**.
> Por isso este roteiro **não** declara tempo total. A divisão de falas abaixo é só uma sugestão — ajustem como preferirem,
> mas ambos devem saber explicar a BFS **e** a consulta de impacto.

## Antes de começar
- Abrir \`codigo-e-testes.html\` (aplicação) e \`saida/apresentacao.html\` (slides) em abas separadas.
- Abrir \`saida/teste-de-mesa.xlsx\` no Excel já na aba BFS_valido.
- Testar o som/projetor e a tela cheia (tecla F11 no navegador).

${slides.map(s => `## Slide ${s.numero} — ${s.titulo}\n**Quem fala (sugestão):** ${s.quem}\n\n**Na tela:**\n${s.topicos.map(t => `- ${t}`).join("\n")}\n\n**Fala:**\n> ${s.fala}\n`).join("\n")}
## Demonstração ao vivo (depois do slide 14)
1. Aplicação, cenário válido: mostrar retângulos (funções) e círculos (testes) e a legenda de cores da BFS.
2. Avançar a BFS passo a passo: fila, cores, pais; mostrar que C4 e o par C3–T4 também são visitados.
3. Marcar C1 e C2: testes T1, T2 e T3, com T3 justificado por C1 e C2.
4. Desmarcar C2: T1 e T3 (T2 sai: não há propagação pelo componente).
5. Selecionar só C4: aviso “sem testes mapeados”, e explicar que não é “não precisa testar”.
6. Carregar o cenário de conflito: avançar até o conflito, mostrar o ciclo destacado e o bloqueio da consulta.
7. Abrir o Excel: BFS_valido (comparar as primeiras linhas), Impacto (editar C2:C5 e ver as fórmulas reagirem).

## Perguntas prováveis
**Por que não usar só uma tabela?** Uma tabela também guarda as relações. O grafo deixa as adjacências explícitas e permite demonstrar o algoritmo estudado.

**O grafo válido já não é bipartido por construção?** Sim, se toda aresta liga CODIGO a TESTE. A BFS é o algoritmo demonstrado e o cenário de conflito mostra o diagnóstico estrutural; a validação semântica é uma etapa separada.

**A BFS seleciona os testes?** Não. A BFS verifica a bipartição. A seleção consulta os vizinhos diretos das funções alteradas.

**Uma função sem testes não precisa ser testada?** Não é isso. Significa apenas que não há relação cadastrada.

**O resultado garante cobertura?** Não. Depende da qualidade e atualização do mapeamento.

**Por que T3 não aparece duas vezes?** A saída é uma união de conjuntos; a justificativa guarda as duas funções.

**Por que não usar Array.shift na fila?** Porque deslocar o vetor a cada retirada pode custar O(n) por operação; com um índice de início, retirar é O(1).

**A animação também é O(V+E)?** Não. O núcleo é O(V+E); a gravação de cópias dos estados a cada evento custa mais, O(V·(V+E)).
`;
  }

  exportar({ slidesDe, marcacaoSlides, htmlApresentacao, textoRoteiro });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Slides = o; });
