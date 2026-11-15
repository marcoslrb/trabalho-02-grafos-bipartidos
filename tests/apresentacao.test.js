"use strict";
// Abre saida/apresentacao.html no navegador e confere a navegação por teclado e o conteúdo.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { abrir, acharNavegador } = require("../tools/navegador.js");
const { RAIZ } = require("../tools/cenarios.js");

const URL = "file:///" + path.join(RAIZ, "saida", "apresentacao.html").replace(/\\/g, "/");

test("apresentação autônoma: navegação, identidade Ifes e widgets interativos", { skip: acharNavegador() ? false : "sem navegador" }, async () => {
  const nav = await abrir(URL, { largura: 1280, altura: 720 });
  try {
    const js = e => nav.avaliar(e);
    const total = await js(`document.querySelectorAll(".slide").length`);
    assert.equal(total, 13, "apresentação de 20 min estruturada em 13 slides interativos");
    assert.equal(await js(`document.getElementById("contador").textContent`), `1 / ${total}`);
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))`);
    assert.equal(await js(`document.getElementById("contador").textContent`), `2 / ${total}`);
    // Testa widget interativo do Slide 2 (toy de 2 cores + adicionar aresta C1-C2)
    await js(`document.querySelector("[data-toy-tri]").click()`);
    await js(`document.querySelector("[data-toy-cor0]").click()`);
    assert.match(await js(`document.querySelector("[data-toy-msg]").textContent`), /Conflito/);
    // Testa widget interativo do Slide 5 (animação BFS ao vivo nos slides)
    await js(`document.querySelector("[data-bfs-prox]").click()`);
    assert.match(await js(`document.querySelector("[data-bfs-passo]").textContent`), /passo 1 de/);
    await js(`document.querySelector('[data-bfs-cenario="conflito"]').click()`);
    await js(`document.querySelector("[data-bfs-fim]").click()`);
    assert.match(await js(`document.querySelector("[data-bfs-veredito]").textContent`), /Conflito/);
    // Testa widget interativo do Slide 6 (código com destaque de blocos 1..5)
    await js(`document.querySelector('[data-cod-passo="2"]').click()`);
    assert.ok(await js(`document.querySelectorAll(".ln-cod.hl").length`) >= 4);
    // Testa widget interativo do Slide 11 (simulador de impacto ao vivo)
    await js(`document.querySelector('[data-imp-preset="C4"]').click()`);
    assert.match(await js(`document.querySelector("[data-imp-resumo]").textContent`), /Sem testes mapeados/);
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))`);
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))`);
    assert.equal(await js(`document.getElementById("contador").textContent`), `${total} / ${total}`, "volta ao último");
    assert.equal(await js(`document.querySelectorAll(".slide.active").length`), 1);
    assert.ok(await js(`document.querySelectorAll("svg").length`) >= 6, "grafos desenhados");
    assert.equal(await js(`document.documentElement.scrollWidth <= window.innerWidth`), true);
    assert.deepEqual(nav.erros, []);
  } finally { await nav.fechar(); }
});

