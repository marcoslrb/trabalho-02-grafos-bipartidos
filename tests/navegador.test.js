"use strict";
/*
 * Verifica a interface DE VERDADE: abre codigo-e-testes.html no Edge/Chrome (headless),
 * clica, lê a tela e confere. Se não houver navegador instalado, os testes são pulados
 * (e isso aparece como "skipped", não como aprovado).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { abrir, acharNavegador } = require("../tools/navegador.js");
const { RAIZ } = require("../tools/cenarios.js");

const URL_APP = "file:///" + path.join(RAIZ, "codigo-e-testes.html").replace(/\\/g, "/");
const temNavegador = !!acharNavegador();
const opcoes = { skip: temNavegador ? false : "nenhum navegador Chromium encontrado" };

test("interface no navegador", opcoes, async t => {
  const nav = await abrir(URL_APP);
  t.after(() => nav.fechar());
  const js = e => nav.avaliar(e);
  const texto = id => js(`document.getElementById(${JSON.stringify(id)}).textContent`);
  const clicar = id => js(`document.getElementById(${JSON.stringify(id)}).click()`);
  const carregar = txt => js(`window.__app.carregar(${JSON.stringify(txt)})`);

  await t.test("abre sem erros de JavaScript e mostra o cenário válido", async () => {
    assert.deepEqual(nav.erros, []);
    assert.equal(await texto("nVertices"), "8");
    assert.equal(await texto("nArestas"), "5");
    assert.equal(await js(`document.querySelectorAll("#etapas > li").length`), 4);
    assert.equal(await js(`[...document.querySelectorAll("#etapas > li")].map(l => l.dataset.estado).join()`), "ok,ok,ok,ok");
  });

  await t.test("consulta C1+C2 indica T1, T2, T3 com justificativa e T3 uma única vez", async () => {
    const itens = await js(`[...document.querySelectorAll("#impacto p b")].map(b => b.textContent).join()`);
    assert.equal(itens, "T1,T2,T3");
    assert.match(await texto("impacto"), /3 de 4 testes indicados/);
    assert.match(await texto("impacto"), /Justificado por: C1, C2/);
  });

  await t.test("desmarcar C2 não propaga: T1 e T3, sem T2", async () => {
    await js(`document.querySelector('#escolhas input[data-id="C2"]').click()`);
    const itens = await js(`[...document.querySelectorAll("#impacto p b")].map(b => b.textContent).join()`);
    assert.equal(itens, "T1,T3");
  });

  await t.test("seleção vazia mostra estado vazio; C4 mostra aviso de sem testes mapeados", async () => {
    await js(`document.querySelector('#escolhas input[data-id="C1"]').click()`);
    assert.match(await texto("impacto"), /Nenhuma função selecionada/);
    await js(`document.querySelector('#escolhas input[data-id="C4"]').click()`);
    assert.match(await texto("impacto"), /Sem testes mapeados: C4/);
    assert.match(await texto("impacto"), /não comprova/);
  });

  await t.test("animação: próximo, slider, reiniciar, executar/pausar", async () => {
    await clicar("cenarioValido");
    assert.match(await texto("evento"), /^Passo 0 de 25 — Inicialização/);
    await clicar("proximo");
    assert.match(await texto("evento"), /^Passo 1 de 25 — Raiz/);
    await js(`(() => { const s = document.getElementById("posicao"); s.value = 25; s.dispatchEvent(new Event("input")); })()`);
    assert.match(await texto("evento"), /Passo 25 de 25 — Bipartido/);
    assert.equal(await js(`document.getElementById("proximo").disabled`), true);
    await clicar("reiniciar");
    assert.match(await texto("evento"), /^Passo 0 de 25/);
    await clicar("executar");
    assert.equal(await texto("executar"), "Pausar");
    await nav.dormir(2000);
    const passo = Number((await texto("evento")).match(/Passo (\d+)/)[1]);
    assert.ok(passo >= 1, "a execução automática deve avançar");
    await clicar("executar");
    assert.equal(await texto("executar"), "Executar");
    const parado = await texto("evento");
    await nav.dormir(1200);
    assert.equal(await texto("evento"), parado, "pausar deve interromper o avanço");
  });

  await t.test("BFS visita C4 (isolado) e mostra 3 componentes ao final", async () => {
    await js(`(() => { const s = document.getElementById("posicao"); s.value = 25; s.dispatchEvent(new Event("input")); })()`);
    assert.equal(await texto("nComponentes"), "3");
    assert.match(await texto("fila"), /\(vazia\)/);
  });

  await t.test("cenário com conflito: ciclo destacado e consulta bloqueada", async () => {
    await clicar("cenarioConflito");
    const estados = await js(`[...document.querySelectorAll("#etapas > li")].map(l => l.dataset.estado).join()`);
    assert.equal(estados, "ok,erro,erro,bloqueada");
    assert.match(await texto("impacto"), /Recomendação bloqueada/);
    await js(`(() => { const s = document.getElementById("posicao"); s.value = s.max; s.dispatchEvent(new Event("input")); })()`);
    assert.match(await texto("evento"), /Conflito/);
    assert.match(await texto("ciclo"), /ciclo ímpar .*3 arestas/);
    const arestasVermelhas = await js(`document.querySelectorAll('#grafo path[stroke="#aa2442"]').length`);
    assert.ok(arestasVermelhas >= 3, "as 3 arestas do ciclo devem ficar em vermelho");
    assert.match(await texto("etapas"), /C1–C2 \(ambos CODIGO, linha 28\)/);
  });

  await t.test("TXT inválido: todos os erros com linha e motivo; grafo e recomendação antigos somem", async () => {
    await carregar("V;C1;CODIGO;f\nV;C1;CODIGO;g\nE;C1;C1\nE;C1;ZZ\nA;T9");
    const etapas = await texto("etapas");
    assert.match(etapas, /Linha 2: Vértice duplicado/);
    assert.match(etapas, /Linha 3: Laço não permitido/);
    assert.match(etapas, /Linha 4: Aresta referencia vértice inexistente: ZZ/);
    assert.match(etapas, /Linha 5: Função alterada inexistente: T9/);
    assert.equal(await js(`document.querySelectorAll("#grafo svg").length`), 0);
    assert.match(await texto("impacto"), /Nenhum grafo válido/);
    assert.equal(await js(`document.getElementById("executar").disabled`), true);
  });

  await t.test("rótulo malicioso é mostrado como texto, nunca interpretado", async () => {
    await carregar("V;C1;CODIGO;<img src=x onerror=\"window.__xss=1\">\nV;T1;TESTE;<b>negrito</b>\nE;C1;T1\nA;C1");
    await nav.dormir(300);
    assert.equal(await js(`window.__xss`), undefined);
    assert.equal(await js(`document.querySelectorAll("#escolhas img, #grafo img, #impacto img, #impacto b b, #grafo foreignObject").length`), 0);
    assert.match(await texto("escolhas"), /<img src=x/);
    assert.match(await texto("impacto"), /<b>negrito<\/b>/);
  });

  await t.test("grafo vazio: estados vazios, sem erro", async () => {
    await carregar("# nada\n");
    assert.match(await texto("etapas"), /grafo vazio/);
    assert.match(await texto("escolhas"), /não declara nenhuma função/);
    assert.match(await texto("impacto"), /Nenhuma função selecionada/);
    assert.equal(await js(`document.querySelectorAll("#etapas > li")[1].dataset.estado`), "ok");
  });

  await t.test("grafo grande usa o modo sem rastreamento e desativa a animação", async () => {
    const linhas = [];
    for (let i = 0; i < 400; i++) linhas.push(i % 2 ? `V;T${i};TESTE;t` : `V;C${i};CODIGO;c`);
    for (let i = 0; i < 399; i++) linhas.push(`E;${i % 2 ? "T" : "C"}${i};${(i + 1) % 2 ? "T" : "C"}${i + 1}`);
    await carregar(linhas.join("\n"));
    assert.equal(await js(`document.getElementById("proximo").disabled`), true);
    assert.match(await texto("evento"), /sem rastreamento/);
    assert.equal(await js(`document.querySelectorAll("#etapas > li")[1].dataset.estado`), "ok");
    assert.equal(await texto("nComponentes"), "1");
  });

  await t.test("alternância claro/escuro", async () => {
    await carregar(fs.readFileSync(path.join(RAIZ, "cenarios", "cenario-valido.txt"), "utf8"));
    const antes = await js(`document.documentElement.dataset.theme`);
    await clicar("tema");
    const depois = await js(`document.documentElement.dataset.theme`);
    assert.notEqual(antes, depois);
    const fundo = await js(`getComputedStyle(document.body).backgroundColor`);
    await clicar("tema");
    assert.notEqual(await js(`getComputedStyle(document.body).backgroundColor`), fundo);
  });

  await t.test("celular (390 px): sem rolagem horizontal", async () => {
    await nav.tamanho(390, 800);
    const sobra = await js(`document.documentElement.scrollWidth - window.innerWidth`);
    assert.ok(sobra <= 1, `rolagem horizontal de ${sobra}px`);
    await nav.tamanho(1280, 900);
  });

  await t.test("apresentação: 15 slides, navegação e grafos desenhados", async () => {
    await js(`document.querySelector('[data-aba="apresentacao"]').click()`);
    assert.equal(await js(`document.querySelectorAll("#deck .slide").length`), 15);
    assert.equal(await texto("slideContador"), "1 / 15");
    await clicar("slideProximo");
    assert.equal(await texto("slideContador"), "2 / 15");
    assert.ok(await js(`document.querySelectorAll("#deck svg").length`) >= 4);
    await clicar("slideAnterior"); await clicar("slideAnterior");
    assert.equal(await texto("slideContador"), "15 / 15");
  });

  await t.test("guia: verificações automatizadas do navegador todas aprovadas", async () => {
    await js(`document.querySelector('[data-aba="guia"]').click()`);
    const resumo = await texto("resumoVerificacoes");
    const [, a, b] = resumo.match(/(\d+)\/(\d+)/);
    assert.equal(a, b);
    assert.ok(Number(b) >= 15);
    assert.equal(await js(`document.querySelectorAll("#verificacoes tr.error").length`), 0);
  });

  await t.test("Excel e roteiro gerados no navegador são idênticos aos arquivos entregues", async () => {
    const b64 = await js(`(() => {
      const linhas = Verificacoes.executarVerificacoes(CENARIOS_EMBUTIDOS);
      const bytes = Planilha.montarPlanilha(CENARIOS_EMBUTIDOS, linhas);
      let s = ""; for (const x of bytes) s += String.fromCharCode(x);
      return btoa(s);
    })()`);
    const doNavegador = Buffer.from(b64, "base64");
    const doDisco = fs.readFileSync(path.join(RAIZ, "saida", "teste-de-mesa.xlsx"));
    assert.ok(doNavegador.equals(doDisco), "xlsx do navegador difere do arquivo em saida/");
    const roteiro = await js(`Slides.textoRoteiro(CENARIOS_EMBUTIDOS, Verificacoes.executarVerificacoes(CENARIOS_EMBUTIDOS))`);
    assert.equal(roteiro, fs.readFileSync(path.join(RAIZ, "saida", "roteiro-de-fala.md"), "utf8"));
  });

  assert.deepEqual(nav.erros, [], "nenhum erro de JavaScript durante toda a sessão");
});
