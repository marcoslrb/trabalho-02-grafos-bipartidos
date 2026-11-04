"use strict";
// Roda a lista única de verificações (src/verificacoes.js) dentro do node:test.
const test = require("node:test");
const assert = require("node:assert/strict");
const { criarVerificacoes } = require("../src/verificacoes.js");
const { lerCenarios } = require("../tools/cenarios.js");

for (const c of criarVerificacoes(lerCenarios())) {
  test(`[${c.grupo}] ${c.nome}`, () => {
    assert.equal(String(c.obter()), c.esperado);
  });
}

