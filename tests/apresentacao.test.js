"use strict";
// Abre saida/apresentacao.html no navegador e confere a navegação por teclado e o conteúdo.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { abrir, acharNavegador } = require("../tools/navegador.js");
const { RAIZ } = require("../tools/cenarios.js");

const URL = "file:///" + path.join(RAIZ, "saida", "apresentacao.html").replace(/\\/g, "/");

test("apresentação autônoma: navegação e conteúdo", { skip: acharNavegador() ? false : "sem navegador" }, async () => {
  const nav = await abrir(URL, { largura: 1280, altura: 720 });
  try {
    const js = e => nav.avaliar(e);
    assert.equal(await js(`document.getElementById("contador").textContent`), "1 / 15");
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))`);
    assert.equal(await js(`document.getElementById("contador").textContent`), "2 / 15");
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))`);
    await js(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))`);
    assert.equal(await js(`document.getElementById("contador").textContent`), "15 / 15", "volta ao último");
    assert.equal(await js(`document.querySelectorAll(".slide.active").length`), 1);
    assert.ok(await js(`document.querySelectorAll("svg").length`) >= 4, "grafos desenhados");
    assert.equal(await js(`document.documentElement.scrollWidth <= window.innerWidth`), true);
    assert.deepEqual(nav.erros, []);
  } finally { await nav.fechar(); }
});

