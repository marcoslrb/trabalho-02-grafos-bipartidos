"use strict";
/*
 * Controle mínimo de um navegador (Edge/Chrome) pelo protocolo DevTools.
 * Serve apenas para verificar a interface de verdade (clicar, ler a tela,
 * capturar imagem). Não usa bibliotecas externas; exige Node 22+ (WebSocket nativo).
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CANDIDATOS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"
];

function acharNavegador() {
  return CANDIDATOS.find(p => fs.existsSync(p)) || null;
}

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function abrir(url, { largura = 1280, altura = 900 } = {}) {
  const exe = acharNavegador();
  if (!exe) throw new Error("Nenhum navegador Chromium encontrado.");
  const porta = 9300 + Math.floor(Math.random() * 500);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "grafos-nav-"));
  const proc = spawn(exe, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, "about:blank"
  ], { stdio: "ignore" });

  let alvo = null;
  for (let i = 0; i < 60 && !alvo; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
      alvo = lista.find(t => t.type === "page");
    } catch { /* o navegador ainda está iniciando */ }
    if (!alvo) await dormir(250);
  }
  if (!alvo) { proc.kill(); throw new Error("Não foi possível conectar ao navegador."); }

  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pendentes = new Map();
  const erros = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendentes.has(msg.id)) {
      const { res, rej } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else if (msg.method === "Runtime.exceptionThrown") {
      erros.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    } else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      erros.push(msg.params.args.map(a => a.value ?? a.description).join(" "));
    }
  };
  const enviar = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id;
    pendentes.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params }));
  });

  await enviar("Page.enable");
  await enviar("Runtime.enable");
  await enviar("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: 1, mobile: false });
  await enviar("Page.navigate", { url });
  await dormir(1200);

  return {
    erros,
    /** Avalia uma expressão JS na página e devolve o valor (promessas são aguardadas). */
    async avaliar(expressao) {
      const r = await enviar("Runtime.evaluate", { expression: expressao, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async tamanho(w, h) {
      await enviar("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
      await dormir(300);
    },
    async capturar(arquivo) {
      const r = await enviar("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(arquivo, Buffer.from(r.data, "base64"));
    },
    dormir,
    async fechar() {
      try { ws.close(); } catch { /* já fechado */ }
      proc.kill();
      await dormir(300);
      try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* perfil em uso; o SO limpa depois */ }
    }
  };
}

module.exports = { abrir, acharNavegador, dormir };

