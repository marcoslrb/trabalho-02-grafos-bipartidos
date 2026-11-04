"use strict";
// Lê os dois TXT de cenários do disco (o navegador recebe o mesmo texto embutido pela montagem).
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");

function lerCenarios() {
  const ler = nome => fs.readFileSync(path.join(RAIZ, "cenarios", nome), "utf8");
  return { valido: ler("cenario-valido.txt"), conflito: ler("cenario-conflito.txt") };
}

module.exports = { lerCenarios, RAIZ };

