"use strict";
/*
 * Interface da aplicação (somente navegador).
 * Toda a lógica de grafos está em nucleo.js; aqui só se lê o TXT, mostra os resultados
 * das QUATRO operações e controla a animação.
 * Texto vindo do TXT (rótulos, IDs, mensagens) sempre passa por esc() antes de entrar em innerHTML.
 */
(function () {
  const { ACAO, analisarTxt, deveRastrear, executarBfs, validarSemantica, consultarImpacto } = Nucleo;
  const { esc, desenharGrafo } = GrafoSvg;
  const CENARIOS = CENARIOS_EMBUTIDOS;
  const $ = id => document.getElementById(id);

  // Estado da tela
  let analise = null;          // { sintaxe, grafo, bfs, semantica } — grafo é null se o TXT for inválido
  let passo = 0;
  let temporizador = null;
  let selecionadas = new Set();

  /* ---------- Carregamento: operações 1, 2 e 3 ---------- */

  function carregar(texto) {
    parar();
    $("fonte").value = texto;
    const sintaxe = analisarTxt(texto);                       // 1. sintaxe
    if (!sintaxe.ok) {
      // TXT inválido: nada do TXT anterior permanece na tela (evita recomendação enganosa).
      analise = { sintaxe, grafo: null };
      selecionadas = new Set();
      passo = 0;
    } else {
      const grafo = sintaxe.grafo;
      // Grafos grandes: modo sem rastreamento (ver LIMITE_RASTREAMENTO em nucleo.js).
      const bfs = executarBfs(grafo, { rastrear: deveRastrear(grafo) });   // 2. estrutura
      const semantica = validarSemantica(grafo);                           // 3. semântica
      analise = { sintaxe, grafo, bfs, semantica };
      selecionadas = new Set(grafo.alteradas);
      passo = 0;
    }
    desenharEscolhas();
    desenharRastro();
    renderizar();
  }

  /** Estado a mostrar: o passo do rastro, ou o resultado final se não houve rastreamento. */
  function estadoAtual() {
    const { bfs } = analise;
    if (bfs.rastreado) return bfs.rastro[passo];
    return {
      passo: 0, acao: "Resultado final", u: "", v: "", fila: [],
      nota: "Grafo grande: BFS executada sem rastreamento; animação desativada.",
      cor: bfs.cor, componente: bfs.componente, componentes: bfs.componentes, exames: bfs.exames
    };
  }

  /* ---------- Desenho ---------- */

  function desenharEscolhas() {
    const area = $("escolhas");
    if (!analise.grafo) { area.innerHTML = `<p class="vazio">Nenhuma função disponível: corrija o TXT.</p>`; return; }
    const funcoes = analise.grafo.vertices.filter(v => v.tipo === "CODIGO");
    if (!funcoes.length) { area.innerHTML = `<p class="vazio">O TXT não declara nenhuma função (CODIGO).</p>`; return; }
    area.innerHTML = funcoes.map(v => `<label class="check">
      <input type="checkbox" data-id="${esc(v.id)}" ${selecionadas.has(v.id) ? "checked" : ""}>
      <span><b>${esc(v.id)}</b> — ${esc(v.rotulo)}</span></label>`).join("");
    area.querySelectorAll("input").forEach(caixa => {
      caixa.addEventListener("change", () => {
        if (caixa.checked) selecionadas.add(caixa.dataset.id); else selecionadas.delete(caixa.dataset.id);
        renderizar();
      });
    });
  }

  function desenharRastro() {
    const corpo = $("rastro");
    if (!analise.grafo) { corpo.innerHTML = `<tr><td colspan="5">Sem rastreamento: nenhum grafo carregado.</td></tr>`; return; }
    if (!analise.bfs.rastreado) { corpo.innerHTML = `<tr><td colspan="5">Rastreamento desativado para este grafo (modo sem rastreamento).</td></tr>`; return; }
    corpo.innerHTML = analise.bfs.rastro.map(s => `<tr data-passo="${s.passo}">
      <td>${s.passo}</td><td>${esc(s.acao)}</td>
      <td>${esc([s.u, s.v].filter(Boolean).join(" → "))}</td>
      <td>${esc(s.fila.join(", ") || "∅")}</td><td>${s.exames}</td></tr>`).join("");
  }

  /** Um item da lista das quatro operações. */
  const etapa = (estado, titulo, corpo) =>
    `<li data-estado="${estado}"><b>${esc(titulo)}</b><br>${corpo}</li>`;

  function desenharEtapas(impacto) {
    const { sintaxe, grafo, bfs, semantica } = analise;
    const itens = [];

    // 1. Sintaxe
    if (!sintaxe.ok) {
      itens.push(etapa("erro", "1. Sintaxe do TXT: inválido",
        `<span class="error">${sintaxe.erros.length} erro(s). Nada foi carregado.</span><ul>` +
        sintaxe.erros.map(e => `<li>Linha ${e.linha}: ${esc(e.motivo)}</li>`).join("") + `</ul>`));
    } else {
      const avisos = sintaxe.avisos.map(a => `<br><span class="small">Aviso: ${esc(a)}</span>`).join("");
      itens.push(etapa("ok", "1. Sintaxe do TXT: válido",
        `${grafo.vertices.length} vértice(s), ${grafo.arestas.length} aresta(s), ${grafo.alteradas.length} função(ões) alterada(s) no arquivo.${avisos}`));
    }

    // 2. Estrutura (resultado final da BFS; a animação mostra o caminho até ele)
    if (!grafo) itens.push(etapa("inativa", "2. Estrutura (BFS com duas cores): não executada", "Corrija o TXT (etapa 1)."));
    else if (bfs.bipartido) itens.push(etapa("ok", "2. Estrutura (BFS com duas cores): bipartido",
      `${bfs.componentes} componente(s) verificado(s) sem conflito; ${bfs.exames} exames de adjacência.`));
    else itens.push(etapa("erro", "2. Estrutura (BFS com duas cores): NÃO bipartido",
      `<span class="error">Ciclo ímpar: ${esc(bfs.ciclo.join(" → "))} (${bfs.ciclo.length - 1} arestas).</span>`));

    // 3. Semântica
    if (!grafo) itens.push(etapa("inativa", "3. Semântica (CODIGO–TESTE): não executada", "Corrija o TXT (etapa 1)."));
    else if (semantica.valida) itens.push(etapa("ok", "3. Semântica (CODIGO–TESTE): válida", "Todas as arestas ligam CODIGO a TESTE."));
    else itens.push(etapa("erro", "3. Semântica (CODIGO–TESTE): INVÁLIDA",
      `<span class="error">Arestas entre vértices do mesmo tipo (não são relações legítimas código–teste):</span><ul>` +
      semantica.violacoes.map(x => `<li>${esc(x.u)}–${esc(x.v)} (ambos ${esc(x.tipo)}, linha ${x.linha})</li>`).join("") + `</ul>`));

    // 4. Consulta
    if (!grafo) itens.push(etapa("inativa", "4. Consulta de impacto: bloqueada", "Depende das etapas anteriores."));
    else if (impacto.bloqueada) itens.push(etapa("bloqueada", "4. Consulta de impacto: BLOQUEADA",
      `<span class="error">Recomendação bloqueada: ${impacto.motivos.map(esc).join("; ")}.</span>`));
    else itens.push(etapa("ok", "4. Consulta de impacto: liberada", "Vizinhos diretos das funções selecionadas (sem busca no componente)."));

    $("etapas").innerHTML = itens.join("");
  }

  function desenharImpacto(impacto) {
    const area = $("impacto");
    if (!analise.grafo) { area.innerHTML = `<p class="vazio">Nenhum grafo válido carregado. Corrija o TXT para consultar testes.</p>`; return; }
    if (impacto.bloqueada) {
      area.innerHTML = `<p class="error">Recomendação bloqueada: ${impacto.motivos.map(esc).join("; ")}.</p>
        <p class="small">Corrija o mapeamento: nenhuma indicação de testes é feita com estrutura ou relações inválidas.</p>`;
      return;
    }
    let html = "";
    if (impacto.selecaoVazia) {
      html += `<p class="vazio">Nenhuma função selecionada. Marque ao menos uma função alterada em “2. Funções alteradas”.</p>`;
    } else {
      html += `<p><strong>${impacto.testes.length} de ${impacto.totalTestes} testes indicados</strong> pelo mapeamento atual.</p>`;
      html += impacto.itens.map(it => `<p><b>${esc(it.id)}</b> — ${esc(it.rotulo)}<br>
        <span class="small">Justificado por: ${esc(it.funcoes.join(", "))}</span></p>`).join("");
      if (!impacto.itens.length) html += `<p>Nenhum teste encontrado para as funções selecionadas.</p>`;
    }
    if (impacto.semTestes.length) {
      html += `<p class="error">Sem testes mapeados: ${esc(impacto.semTestes.join(", "))}. Isso não comprova que essas funções dispensam testes.</p>`;
    }
    html += `<p class="small">Consulta independente da animação: usa os vizinhos diretos das funções selecionadas, não uma busca no componente.</p>`;
    area.innerHTML = html;
  }

  function renderizar() {
    const semGrafo = !analise.grafo;
    const impacto = semGrafo ? null : consultarImpacto(analise.grafo, selecionadas, { estrutura: analise.bfs, semantica: analise.semantica });
    desenharEtapas(impacto);
    desenharImpacto(impacto);

    const rastreado = !semGrafo && analise.bfs.rastreado;
    const ultimo = rastreado ? analise.bfs.rastro.length - 1 : 0;
    ["reiniciar", "anterior", "proximo", "executar", "posicao"].forEach(id => { $(id).disabled = !rastreado; });

    if (semGrafo) {
      $("nVertices").textContent = $("nArestas").textContent = $("nComponentes").textContent = "—";
      $("grafo").innerHTML = `<p class="vazio">Nenhum grafo para desenhar: o TXT tem erros (veja a etapa 1). A tela não mostra grafo de um TXT inválido.</p>`;
      $("evento").textContent = "Nenhuma execução: corrija o TXT.";
      $("fila").textContent = "";
      $("ciclo").textContent = "";
      $("posicao").max = 0; $("posicao").value = 0;
      return;
    }

    const s = estadoAtual();
    const g = analise.grafo;
    $("nVertices").textContent = g.vertices.length;
    $("nArestas").textContent = g.arestas.length;
    $("nComponentes").textContent = s.componentes;

    // O ciclo só aparece quando a animação chega ao evento de conflito (ou sempre, sem rastreamento).
    const cicloVisivel = (s.acao === ACAO.CONFLITO || !analise.bfs.rastreado) ? analise.bfs.ciclo : [];
    $("grafo").innerHTML = desenharGrafo(g, s, selecionadas, cicloVisivel);

    $("posicao").max = Math.max(0, ultimo);
    $("posicao").value = passo;
    $("evento").textContent = rastreado
      ? `Passo ${s.passo} de ${ultimo} — ${s.acao}. ${s.nota}`
      : `${s.acao}. ${s.nota}`;
    $("fila").textContent = `Fila após o evento: [${s.fila.join(", ")}]${s.fila.length ? "" : " (vazia)"} | Exames de adjacência: ${s.exames}`;
    $("ciclo").textContent = cicloVisivel.length
      ? `Conflito: ciclo ímpar ${cicloVisivel.join(" → ")} com ${cicloVisivel.length - 1} arestas.` : "";

    $("anterior").disabled = passo === 0;
    $("proximo").disabled = passo >= ultimo;
    $("rastro").querySelectorAll("tr[data-passo]").forEach(linha =>
      linha.classList.toggle("current", Number(linha.dataset.passo) === passo));
  }

  /* ---------- Animação ---------- */

  function parar() {
    if (temporizador !== null) clearInterval(temporizador);
    temporizador = null;
    $("executar").textContent = "Executar";
  }

  function avancar() {
    if (!analise.grafo || !analise.bfs.rastreado) return;
    if (passo < analise.bfs.rastro.length - 1) passo++;
    else parar();
    renderizar();
  }

  $("reiniciar").onclick = () => { parar(); passo = 0; renderizar(); };
  $("anterior").onclick = () => { parar(); passo = Math.max(0, passo - 1); renderizar(); };
  $("proximo").onclick = () => { parar(); avancar(); };
  $("posicao").oninput = e => { parar(); passo = Number(e.target.value); renderizar(); };
  $("executar").onclick = () => {
    if (temporizador !== null) { parar(); return; }        // alterna executar/pausar
    if (passo >= analise.bfs.rastro.length - 1) passo = 0;  // recomeça se já estava no fim
    $("executar").textContent = "Pausar";
    temporizador = setInterval(avancar, 850);
    renderizar();
  };

  /* ---------- Entrada ---------- */

  $("cenarioValido").onclick = () => carregar(CENARIOS.valido);
  $("cenarioConflito").onclick = () => carregar(CENARIOS.conflito);
  $("analisar").onclick = () => carregar($("fonte").value);
  $("arquivo").onchange = async evento => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    if (arquivo.size > 2 * 1024 * 1024) {      // proteção do navegador, não regra do TXT
      $("statusDownload").textContent = "O arquivo excede 2 MB e não foi lido.";
      return;
    }
    try { carregar(await arquivo.text()); }
    catch (erro) { $("statusDownload").textContent = "Não foi possível ler o arquivo: " + erro.message; }
  };

  /* ---------- Downloads (mesmo código usado pelos scripts de geração) ---------- */

  function baixar(nome, conteudo, mime) {
    const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  const verificacoesAtuais = () => Verificacoes.executarVerificacoes(CENARIOS);

  $("baixarTxt1").onclick = () => baixar("cenario-valido.txt", CENARIOS.valido, "text/plain;charset=utf-8");
  $("baixarTxt2").onclick = () => baixar("cenario-conflito.txt", CENARIOS.conflito, "text/plain;charset=utf-8");
  $("baixarXlsx").onclick = () => {
    try {
      const bytes = Planilha.montarPlanilha(CENARIOS, verificacoesAtuais());
      baixar("teste-de-mesa.xlsx", new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      $("statusDownload").textContent = "Excel gerado pelo mesmo algoritmo da aplicação. Abra-o no Excel ou LibreOffice para conferir.";
    } catch (erro) { $("statusDownload").textContent = "Falha ao gerar o Excel: " + erro.message; }
  };
  $("baixarSlides").onclick = () => {
    const css = document.querySelector("style").textContent;
    baixar("apresentacao.html", Slides.htmlApresentacao(css, CENARIOS, verificacoesAtuais()), "text/html;charset=utf-8");
  };
  $("baixarRoteiro").onclick = () =>
    baixar("roteiro-de-fala.md", Slides.textoRoteiro(CENARIOS, verificacoesAtuais()), "text/markdown;charset=utf-8");

  /* ---------- Guia e verificações ---------- */

  function mostrarVerificacoes() {
    const linhas = verificacoesAtuais();
    const aprovadas = linhas.filter(l => l[4] === "APROVADO").length;
    $("resumoVerificacoes").textContent = `${aprovadas}/${linhas.length} verificações aprovadas nesta execução.`;
    $("verificacoes").innerHTML = linhas.map(l =>
      `<tr${l[4] === "APROVADO" ? "" : ' class="error"'}>` + l.map(c => `<td>${esc(c)}</td>`).join("") + `</tr>`).join("");
    return linhas;
  }
  $("rodarVerificacoes").onclick = mostrarVerificacoes;

  /* ---------- Tema, abas e apresentação ---------- */

  $("tema").onclick = () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  };
  document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  document.querySelectorAll("[data-aba]").forEach(botao => {
    botao.onclick = () => {
      parar();
      document.querySelectorAll("[data-aba]").forEach(b => b.setAttribute("aria-selected", String(b === botao)));
      ["app", "apresentacao", "guia"].forEach(id => { $(id).hidden = id !== botao.dataset.aba; });
    };
  });

  let slideAtual = 0;
  function mostrarSlide(i) {
    const total = document.querySelectorAll("#deck .slide").length;
    slideAtual = (i + total) % total;
    document.querySelectorAll("#deck .slide").forEach((s, k) => s.classList.toggle("active", k === slideAtual));
    document.querySelectorAll("#slidePontos button").forEach((b, k) => b.classList.toggle("active", k === slideAtual));
    $("slideContador").textContent = `${slideAtual + 1} / ${total}`;
  }

  const linhasVerificacao = mostrarVerificacoes();
  $("deck").innerHTML = Slides.marcacaoSlides(CENARIOS, linhasVerificacao);
  const totalSlides = document.querySelectorAll("#deck .slide").length;
  $("slidePontos").innerHTML = Array.from({ length: totalSlides }, (_, i) =>
    `<button aria-label="Ir ao slide ${i + 1}" data-slide-indice="${i}"></button>`).join("");
  $("slidePontos").querySelectorAll("button").forEach(b => { b.onclick = () => mostrarSlide(Number(b.dataset.slideIndice)); });
  $("slideAnterior").onclick = () => mostrarSlide(slideAtual - 1);
  $("slideProximo").onclick = () => mostrarSlide(slideAtual + 1);
  $("telaCheia").onclick = async () => {
    try {
      if (!document.fullscreenElement) await $("apresentacao").requestFullscreen(); else await document.exitFullscreen();
    } catch { $("statusDownload").textContent = "Tela cheia indisponível. Use a apresentação baixada ou a tela cheia do navegador."; }
  };
  document.addEventListener("keydown", e => {
    if ($("apresentacao").hidden) return;
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); mostrarSlide(slideAtual + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); mostrarSlide(slideAtual - 1); }
  });

  // Exposto só para as verificações automatizadas do navegador (tests/navegador.test.js).
  window.__app = { carregar, estado: () => ({ analise, passo, selecionadas }) };

  mostrarSlide(0);
  carregar(CENARIOS.valido);
})();

