"use strict";
// Confere os arquivos entregues: TXT, HTML gerado em dia, estrutura do XLSX e da apresentação.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { lerCenarios, RAIZ } = require("../tools/cenarios.js");
const { montarHtml } = require("../tools/gerar.js");
const { analisarTxt, executarBfs, validarSemantica, consultarImpacto } = require("../src/nucleo.js");
const { crc32 } = require("../src/xlsx.js");

const cen = lerCenarios();
const lerSaida = n => fs.readFileSync(path.join(RAIZ, "saida", n));

test("TXT válido: 8 vértices, 5 arestas, 3 componentes, impacto T1,T2,T3", () => {
  const r = analisarTxt(cen.valido);
  assert.ok(r.ok);
  const b = executarBfs(r.grafo, { rastrear: false });
  assert.equal(r.grafo.vertices.length, 8);
  assert.equal(r.grafo.arestas.length, 5);
  assert.equal(b.componentes, 3);
  assert.equal(consultarImpacto(r.grafo, r.grafo.alteradas).testes.join(), "T1,T2,T3");
});

test("TXT de conflito: sintaxe válida, triângulo C1-T3-C2, semântica inválida", () => {
  const r = analisarTxt(cen.conflito);
  assert.ok(r.ok, "o conflito é sintaticamente válido: o erro é estrutural e semântico");
  assert.equal(r.grafo.arestas.length, 6);
  const b = executarBfs(r.grafo);
  assert.equal(b.bipartido, false);
  assert.deepEqual([...b.ciclo.slice(0, -1)].sort(), ["C1", "C2", "T3"]);
  assert.deepEqual(validarSemantica(r.grafo).violacoes.map(v => `${v.u}-${v.v}`), ["C1-C2"]);
  assert.equal(consultarImpacto(r.grafo, ["C1"]).bloqueada, true);
});

test("codigo-e-testes.html está em dia com src/ e com os TXT (rode node tools/gerar.js se falhar)", () => {
  const emDisco = fs.readFileSync(path.join(RAIZ, "codigo-e-testes.html"), "utf8");
  assert.equal(emDisco, montarHtml(cen));
});

test("HTML gerado não depende de rede nem de arquivos externos", () => {
  const html = fs.readFileSync(path.join(RAIZ, "codigo-e-testes.html"), "utf8");
  assert.equal(/<script[^>]+src=/i.test(html), false);
  assert.equal(/<link[^>]+href=/i.test(html), false);
  assert.equal(/\bfetch\s*\(|XMLHttpRequest/.test(html), false);
});

/** Leitor mínimo de ZIP (diretório central) para inspecionar o XLSX sem bibliotecas. */
function lerZip(buf) {
  const fim = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(fim >= 0, "fim do diretório central não encontrado");
  const total = buf.readUInt16LE(fim + 10);
  let p = buf.readUInt32LE(fim + 16);
  const arquivos = new Map();
  for (let i = 0; i < total; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50);
    const metodo = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), comp = buf.readUInt32LE(p + 20);
    const nome = buf.toString("utf8", p + 46, p + 46 + buf.readUInt16LE(p + 28));
    const desloc = buf.readUInt32LE(p + 42);
    const dadosIni = desloc + 30 + buf.readUInt16LE(desloc + 26) + buf.readUInt16LE(desloc + 28);
    let dados = buf.subarray(dadosIni, dadosIni + comp);
    if (metodo === 8) dados = zlib.inflateRawSync(dados);
    assert.equal(crc32(dados), crc, "CRC inválido em " + nome);
    arquivos.set(nome, dados.toString("utf8"));
    p += 46 + buf.readUInt16LE(p + 28) + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  return arquivos;
}

test("XLSX é um ZIP Open XML real (não CSV renomeado), com 7 abas, tabelas e fórmulas", () => {
  const buf = lerSaida("teste-de-mesa.xlsx");
  assert.equal(buf.subarray(0, 2).toString("latin1"), "PK");
  const z = lerZip(buf);
  for (const parte of ["[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/styles.xml"])
    assert.ok(z.has(parte), "falta " + parte);
  const abas = [...z.get("xl/workbook.xml").matchAll(/<sheet name="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(abas, ["Resumo", "Guia", "Entradas", "BFS_valido", "BFS_conflito", "Impacto", "Validacoes"]);
  const impacto = z.get("xl/worksheets/sheet6.xml");
  assert.ok((impacto.match(/<f>/g) || []).length >= 12, "a aba Impacto deve ter fórmulas");
  assert.match(impacto, /<dataValidation /);
  assert.ok([...z.keys()].filter(k => k.startsWith("xl/tables/")).length >= 7, "uma tabela (filtro) por aba, 2 no Impacto");
  assert.match(z.get("xl/workbook.xml"), /fullCalcOnLoad="1"/);
  // Os rastros são registros: as abas BFS não contêm fórmulas.
  assert.equal(/<f>/.test(z.get("xl/worksheets/sheet4.xml") + z.get("xl/worksheets/sheet5.xml")), false);
});

test("XLSX: rastro BFS_valido tem o mesmo número de eventos que o algoritmo", () => {
  const z = lerZip(lerSaida("teste-de-mesa.xlsx"));
  const b = executarBfs(analisarTxt(cen.valido).grafo);
  const linhas = (z.get("xl/worksheets/sheet4.xml").match(/<row /g) || []).length;
  assert.equal(linhas, b.rastro.length + 1);
  assert.match(z.get("xl/worksheets/sheet1.xml"), /REGISTROS da execução/);
});

test("apresentação e roteiro: 15 slides, fala para cada um, sem promessa de duração", () => {
  const html = lerSaida("apresentacao.html").toString("utf8");
  assert.equal((html.match(/<article class="slide/g) || []).length, 15);
  const roteiro = lerSaida("roteiro-de-fala.md").toString("utf8");
  assert.equal((roteiro.match(/^## Slide \d+/gm) || []).length, 15);
  assert.equal((roteiro.match(/\*\*Fala:\*\*/g) || []).length, 15);
  assert.match(roteiro, /não foram confirmados|não\*\* foram confirmados/);
});
