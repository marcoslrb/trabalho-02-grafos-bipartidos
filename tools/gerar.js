"use strict";
/*
 * Gera os entregáveis a partir do MESMO código de src/:
 *   codigo-e-testes.html        aplicação em arquivo único (abre com duplo clique, sem servidor)
 *   saida/teste-de-mesa.xlsx    Excel real (rastros da BFS gerados por src/nucleo.js)
 *   saida/apresentacao.html     slides
 *   saida/roteiro-de-fala.md    roteiro de fala
 * Uso: node tools/gerar.js
 * O arquivo codigo-e-testes.html é GERADO: para mudar a aplicação, edite src/ e rode este script.
 */
const fs = require("node:fs");
const path = require("node:path");
const { lerCenarios, RAIZ } = require("./cenarios.js");
const { executarVerificacoes } = require("../src/verificacoes.js");
const { montarPlanilha } = require("../src/planilha.js");
const { htmlApresentacao, textoRoteiro } = require("../src/slides.js");

const SRC = path.join(RAIZ, "src");
const SAIDA = path.join(RAIZ, "saida");
const ler = (...p) => fs.readFileSync(path.join(...p), "utf8");

/** Ordem importa: cada arquivo usa os anteriores (nucleo -> grafo-svg -> ... -> interface). */
const SCRIPTS = ["nucleo.js", "grafo-svg.js", "verificacoes.js", "xlsx.js", "planilha.js", "slides.js", "interface.js"];

/** Texto seguro para dentro de <script>: impede que "</script>" encerre o bloco. */
const paraScript = texto => texto.replace(/<\/(script)/gi, "<\\/$1");

function montarHtml(cenarios) {
  const embutido = "globalThis.CENARIOS_EMBUTIDOS = " + JSON.stringify(cenarios).replace(/</g, "\\u003c") + ";";
  const scripts = [embutido, ...SCRIPTS.map(nome => `/* ===== src/${nome} ===== */\n` + ler(SRC, nome))]
    .map(codigo => `<script>\n${paraScript(codigo)}\n</script>`).join("\n");
  return ler(SRC, "template.html")
    .replace("<!DOCTYPE html>", "<!DOCTYPE html>\n<!-- ARQUIVO GERADO por tools/gerar.js a partir de src/. Não edite aqui: edite src/ e gere de novo. -->")
    .replace("/*ESTILO*/", () => ler(SRC, "estilo.css"))
    .replace("<!--SCRIPTS-->", () => scripts);
}

function gerarTudo() {
  fs.mkdirSync(SAIDA, { recursive: true });
  const cenarios = lerCenarios();

  const verificacoes = executarVerificacoes(cenarios);
  const falhas = verificacoes.filter(r => r[4] !== "APROVADO");
  if (falhas.length) {
    console.error("Verificações falharam; arquivos não gerados:\n" + falhas.map(f => " - " + f[1] + " => " + f[3]).join("\n"));
    process.exit(1);
  }

  fs.writeFileSync(path.join(RAIZ, "codigo-e-testes.html"), montarHtml(cenarios));
  fs.writeFileSync(path.join(SAIDA, "teste-de-mesa.xlsx"), montarPlanilha(cenarios, verificacoes));
  fs.writeFileSync(path.join(SAIDA, "apresentacao.html"), htmlApresentacao(ler(SRC, "estilo.css"), cenarios, verificacoes));
  fs.writeFileSync(path.join(SAIDA, "roteiro-de-fala.md"), textoRoteiro(cenarios, verificacoes));
  console.log(`Gerados: codigo-e-testes.html, saida/teste-de-mesa.xlsx, saida/apresentacao.html, saida/roteiro-de-fala.md (${verificacoes.length} verificações aprovadas).`);
}

if (require.main === module) gerarTudo();
module.exports = { montarHtml, gerarTudo };
