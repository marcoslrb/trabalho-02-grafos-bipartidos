"use strict";
/*
 * Escritor de XLSX real (Open XML dentro de um ZIP sem compressão), sem bibliotecas.
 * Roda no navegador (botão de download) e no Node (geração do arquivo entregue).
 * Suporta abas analíticas (com Tabelas/AutoFiltro, fórmulas e validação de dados)
 * e abas visuais de Teste de Mesa no padrão das aulas de TPA do Prof. Rafael (Ifes),
 * incluindo geração determinística de imagens PNG do Grafo G embutidas em xl/media/.
 */
(function (exportar) {
  const { esc } = typeof require === "function" ? require("./grafo-svg.js") : globalThis.GrafoSvg;
  const utf8 = new TextEncoder();

  // Estilos (índices de cellXfs em xl/styles.xml)
  const ESTILO = {
    NORMAL: 0,
    CABECALHO: 1,
    FORMULA: 2,
    PERCENTUAL: 3,
    ENTRADA: 4,
    NEGRITO: 5,
    // Estilos do Teste de Mesa no padrão do Prof. Rafael
    TM_TITULO: 6,
    TM_VERTICAL: 7,
    TM_ADJ_V_BRANCO: 8,
    TM_ADJ_V_SALMAO: 9,
    TM_ADJ_VIZ_BRANCO: 10,
    TM_ADJ_VIZ_SALMAO: 11,
    TM_CAB_CINZA: 12,
    TM_V_ID: 13,
    TM_VAL_VERMELHO: 14,
    TM_VAL_SALMAO: 15,
    TM_VAL_VERDE: 16,
    TM_VAL_RISCADO: 17,
    TM_CODIGO: 18,
    TM_CODIGO_ATIVO: 19,
    TM_FUNDO_BRANCO: 20
  };

  /* ---------- ZIP (método 0 = armazenado) ---------- */
  const tabelaCrc = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabelaCrc[n] = c >>> 0;
  }
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = tabelaCrc[(c ^ bytes[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(arquivos) {
    const partes = [], central = [];
    let deslocamento = 0, tamanhoCentral = 0;
    for (const [nome, valor] of arquivos) {
      const nomeBytes = utf8.encode(nome);
      const dados = typeof valor === "string" ? utf8.encode(valor) : valor;
      const crc = crc32(dados);
      const local = new Uint8Array(30 + nomeBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);              // bit 11: nome em UTF-8
      lv.setUint16(12, 33, true);                 // data 01/01/1980
      lv.setUint32(14, crc, true);
      lv.setUint32(18, dados.length, true);
      lv.setUint32(22, dados.length, true);
      lv.setUint16(26, nomeBytes.length, true);
      local.set(nomeBytes, 30);

      const cd = new Uint8Array(46 + nomeBytes.length);
      const cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(14, 33, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, dados.length, true);
      cv.setUint32(24, dados.length, true);
      cv.setUint16(28, nomeBytes.length, true);
      cv.setUint32(42, deslocamento, true);
      cd.set(nomeBytes, 46);

      partes.push(local, dados);
      central.push(cd);
      deslocamento += local.length + dados.length;
      tamanhoCentral += cd.length;
    }
    const fim = new Uint8Array(22), ev = new DataView(fim.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, arquivos.length, true);
    ev.setUint16(10, arquivos.length, true);
    ev.setUint32(12, tamanhoCentral, true);
    ev.setUint32(16, deslocamento, true);
    const todas = [...partes, ...central, fim];
    const total = todas.reduce((s, p) => s + p.length, 0);
    const saida = new Uint8Array(total);
    let o = 0;
    for (const p of todas) { saida.set(p, o); o += p.length; }
    return saida;
  }

  /* ---------- Gerador determinístico de PNG para o Grafo G ---------- */
  const FONTE_5X7 = {
    "C": [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
    "T": [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
    "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
    "3": [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
    "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010]
  };

  function gerarPngGrafo(opcoes = {}) {
    const W = 280, H = 145;
    // Paleta: 0=fundo cinza claro, 1=branco, 2=cinza escuro, 3=aresta cinza,
    // 4=vermelho destaque, 5=rosa visitado, 6=salmão ativo, 7=verde visitado cor 1
    const pal = [
      [242, 242, 242],
      [255, 255, 255],
      [55, 55, 55],
      [166, 166, 166],
      [230, 0, 0],
      [255, 198, 208],
      [255, 124, 128],
      [216, 240, 210]
    ];
    const pix = new Uint8Array(W * H);
    const setPx = (x, y, c) => {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && x < W && y >= 0 && y < H) pix[y * W + x] = c;
    };
    const linha = (x0, y0, x1, y1, c, esp = 1.4) => {
      const dx = x1 - x0, dy = y1 - y0;
      const passos = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
      const r = Math.ceil(esp);
      for (let i = 0; i <= passos; i++) {
        const x = x0 + (dx * i) / passos, y = y0 + (dy * i) / passos;
        for (let oy = -r; oy <= r; oy++)
          for (let ox = -r; ox <= r; ox++)
            if (ox * ox + oy * oy <= esp * esp) setPx(x + ox, y + oy, c);
      }
    };
    const circulo = (cx, cy, R, preen, borda) => {
      for (let y = -R - 1; y <= R + 1; y++) {
        for (let x = -R - 1; x <= R + 1; x++) {
          const d = Math.sqrt(x * x + y * y);
          if (d <= R - 1.6) setPx(cx + x, cy + y, preen);
          else if (d <= R + 0.4) setPx(cx + x, cy + y, borda);
        }
      }
    };
    const texto = (cx, cy, str, cor = 2, escF = 2) => {
      const cw = 5 * escF, ch = 7 * escF, gap = 2;
      const tw = str.length * cw + (str.length - 1) * gap;
      let sx = Math.round(cx - tw / 2);
      const sy = Math.round(cy - ch / 2);
      for (const chStr of str) {
        const bmp = FONTE_5X7[chStr];
        if (bmp) {
          for (let r = 0; r < 7; r++)
            for (let c = 0; c < 5; c++)
              if ((bmp[r] >> (4 - c)) & 1)
                for (let dy = 0; dy < escF; dy++)
                  for (let dx = 0; dx < escF; dx++)
                    setPx(sx + c * escF + dx, sy + r * escF + dy, cor);
        }
        sx += cw + gap;
      }
    };

    const pos = {
      C1: [42, 34],  C2: [112, 34], C3: [184, 34], C4: [246, 34],
      T1: [42, 112], T2: [112, 112], T3: [184, 112], T4: [246, 112]
    };
    const arestas = opcoes.arestas || [
      ["C1", "T1"], ["C1", "T3"], ["C2", "T2"], ["C2", "T3"], ["C3", "T4"]
    ];
    const vermelhas = new Set(opcoes.arestasVermelhas || []);
    const visitados = new Set(opcoes.visitados || []);
    const atual = opcoes.atual || null;

    for (const [u, v] of arestas) {
      if (!vermelhas.has(`${u}-${v}`) && !vermelhas.has(`${v}-${u}`))
        linha(pos[u][0], pos[u][1], pos[v][0], pos[v][1], 3, 1.2);
    }
    for (const [u, v] of arestas) {
      if (vermelhas.has(`${u}-${v}`) || vermelhas.has(`${v}-${u}`))
        linha(pos[u][0], pos[u][1], pos[v][0], pos[v][1], 4, 2.3);
    }
    for (const [id, [x, y]] of Object.entries(pos)) {
      const visitado = visitados.has(id);
      const preen = id === atual ? 6 : (visitado ? 5 : 1);
      const borda = (id === atual || visitado) ? 4 : 2;
      circulo(x, y, 16, preen, borda);
      texto(x, y, id, 2, 2);
    }

    const rawLen = H * (1 + W);
    const raw = new Uint8Array(rawLen);
    let p = 0;
    for (let y = 0; y < H; y++) {
      raw[p++] = 0;
      raw.set(pix.subarray(y * W, (y + 1) * W), p);
      p += W;
    }
    let s1 = 1, s2 = 0;
    for (let i = 0; i < rawLen; i++) {
      s1 = (s1 + raw[i]) % 65521;
      s2 = (s2 + s1) % 65521;
    }
    const adler = ((s2 << 16) | s1) >>> 0;
    const z = new Uint8Array(2 + 5 + rawLen + 4);
    z[0] = 0x78; z[1] = 0x01; z[2] = 0x01;
    z[3] = rawLen & 0xff; z[4] = (rawLen >> 8) & 0xff;
    const nlen = (~rawLen) & 0xffff;
    z[5] = nlen & 0xff; z[6] = (nlen >> 8) & 0xff;
    z.set(raw, 7);
    new DataView(z.buffer, 7 + rawLen, 4).setUint32(0, adler, false);

    function blocoPng(tipo, dados) {
      const out = new Uint8Array(12 + dados.length);
      const dv = new DataView(out.buffer);
      dv.setUint32(0, dados.length, false);
      for (let i = 0; i < 4; i++) out[4 + i] = tipo.charCodeAt(i);
      out.set(dados, 8);
      dv.setUint32(8 + dados.length, crc32(out.subarray(4, 8 + dados.length)), false);
      return out;
    }
    const ihdr = new Uint8Array(13);
    const dvIhdr = new DataView(ihdr.buffer);
    dvIhdr.setUint32(0, W, false);
    dvIhdr.setUint32(4, H, false);
    ihdr[8] = 8; ihdr[9] = 3;
    const plte = new Uint8Array(pal.length * 3);
    pal.forEach((rgb, i) => { plte[i * 3] = rgb[0]; plte[i * 3 + 1] = rgb[1]; plte[i * 3 + 2] = rgb[2]; });

    const partesPng = [
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      blocoPng("IHDR", ihdr),
      blocoPng("PLTE", plte),
      blocoPng("IDAT", z),
      blocoPng("IEND", new Uint8Array(0))
    ];
    const total = partesPng.reduce((s, b) => s + b.length, 0);
    const saida = new Uint8Array(total);
    let off = 0;
    for (const b of partesPng) { saida.set(b, off); off += b.length; }
    return saida;
  }

  /** Índice de coluna (0 = A) -> letras. */
  function colName(indice) {
    let out = "";
    for (let n = indice + 1; n > 0; n = Math.floor((n - 1) / 26))
      out = String.fromCharCode(65 + (n - 1) % 26) + out;
    return out;
  }

  const formula = (f, v, estilo = ESTILO.FORMULA) => ({ f, v, estilo });
  const estilizada = (v, estilo) => ({ v, estilo });

  /* ---------- XLSX ---------- */
  function gerarXlsx(abas) {
    const ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    const relns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const pkgns = "http://schemas.openxmlformats.org/package/2006/relationships";
    const xdrns = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
    const ans = "http://schemas.openxmlformats.org/drawingml/2006/main";
    const decl = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const arquivos = [], overrides = [];
    let numeroTabela = 0, numeroDrawing = 0, temPng = false;

    abas.forEach((aba, si) => {
      const largura = Math.max(...aba.rows.map(r => r.length));
      const cabecalhos = aba.cabecalhos || (aba.semTabelas ? [] : [1]);
      const estiloPadrao = aba.estiloPadrao ?? ESTILO.NORMAL;
      const linhasXml = aba.rows.map((linha, ri) => {
        const corpo = linha.map((valor, ci) => {
          if (valor === undefined || valor === null || valor === "") return "";
          const ref = colName(ci) + (ri + 1);
          let estilo = cabecalhos.includes(ri + 1) ? ESTILO.CABECALHO : estiloPadrao;
          if ((aba.entradas || []).includes(ref)) estilo = ESTILO.ENTRADA;
          if (valor && typeof valor === "object") {
            estilo = valor.estilo ?? estilo;
            if ("f" in valor) {
              const tipo = typeof valor.v === "string" ? ' t="str"' : "";
              return `<c r="${ref}" s="${estilo}"${tipo}><f>${esc(valor.f)}</f><v>${esc(valor.v)}</v></c>`;
            }
            valor = valor.v;
          }
          if (valor === "" || valor === null || valor === undefined) return `<c r="${ref}" s="${estilo}"/>`;
          if (typeof valor === "number") return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
          return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
        }).join("");
        const altura = (aba.alturas || {})[ri + 1] ?? (cabecalhos.includes(ri + 1) ? 30 : (aba.height || 30));
        return `<row r="${ri + 1}" ht="${altura}" customHeight="1">${corpo}</row>`;
      }).join("");

      const colPadrao = aba.estiloPadrao !== undefined ? ` style="${aba.estiloPadrao}"` : "";
      const colunas = Array.from({ length: largura }, (_, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${(aba.widths || [])[i] || 18}"${colPadrao} customWidth="1"/>`).join("");

      const tabelas = aba.semTabelas ? [] : (aba.tables || [{ startRow: 1, endRow: aba.rows.length, startCol: 1, endCol: largura }]);
      const partesTabela = [], relacoes = [];
      for (const t of tabelas) {
        if (t.endRow <= t.startRow) continue;
        const ti = ++numeroTabela;
        const ref = `${colName(t.startCol - 1)}${t.startRow}:${colName(t.endCol - 1)}${t.endRow}`;
        const nomes = aba.rows[t.startRow - 1].slice(t.startCol - 1, t.endCol);
        arquivos.push([`xl/tables/table${ti}.xml`, decl +
          `<table xmlns="${ns}" id="${ti}" name="Tabela${ti}" displayName="Tabela${ti}" ref="${ref}" totalsRowShown="0">` +
          `<autoFilter ref="${ref}"/>` +
          `<tableColumns count="${nomes.length}">${nomes.map((h, i) => `<tableColumn id="${i + 1}" name="${esc(h)}"/>`).join("")}</tableColumns>` +
          `<tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/></table>`]);
        overrides.push(`<Override PartName="/xl/tables/table${ti}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`);
        const rid = relacoes.length + 1;
        relacoes.push(`<Relationship Id="rId${rid}" Type="${relns}/table" Target="../tables/table${ti}.xml"/>`);
        partesTabela.push(`<tablePart r:id="rId${rid}"/>`);
      }

      let tagDrawing = "";
      if (aba.imagemGrafo) {
        temPng = true;
        const di = ++numeroDrawing;
        const rid = relacoes.length + 1;
        relacoes.push(`<Relationship Id="rId${rid}" Type="${relns}/drawing" Target="../drawings/drawing${di}.xml"/>`);
        tagDrawing = `<drawing r:id="rId${rid}"/>`;
        arquivos.push([`xl/media/image${di}.png`, aba.imagemGrafo]);
        arquivos.push([`xl/drawings/_rels/drawing${di}.xml.rels`,
          decl + `<Relationships xmlns="${pkgns}"><Relationship Id="rId1" Type="${relns}/image" Target="../media/image${di}.png"/></Relationships>`]);
        arquivos.push([`xl/drawings/drawing${di}.xml`, decl +
          `<xdr:wsDr xmlns:xdr="${xdrns}" xmlns:a="${ans}" xmlns:r="${relns}">` +
          `<xdr:twoCellAnchor editAs="oneCell">` +
          `<xdr:from><xdr:col>0</xdr:col><xdr:colOff>19050</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>19050</xdr:rowOff></xdr:from>` +
          `<xdr:to><xdr:col>7</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>8</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>` +
          `<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Grafo ${di}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>` +
          `<xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
          `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2667000" cy="1381125"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>` +
          `</xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>`]);
        overrides.push(`<Override PartName="/xl/drawings/drawing${di}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
      }

      const cf = aba.colorRange ? `<conditionalFormatting sqref="${aba.colorRange}">` +
        `<cfRule type="cellIs" dxfId="0" priority="1" operator="equal"><formula>0</formula></cfRule>` +
        `<cfRule type="cellIs" dxfId="1" priority="2" operator="equal"><formula>1</formula></cfRule></conditionalFormatting>` : "";

      const mesclagem = (aba.mesclar || []).length ? `<mergeCells count="${aba.mesclar.length}">` +
        aba.mesclar.map(r => `<mergeCell ref="${r}"/>`).join("") + `</mergeCells>` : "";

      const dv = (aba.validacoes || []).length ? `<dataValidations count="${aba.validacoes.length}">` +
        aba.validacoes.map(v => `<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" ` +
          `errorTitle="Valor inválido" error="${esc(v.erro)}" promptTitle="${esc(v.titulo)}" prompt="${esc(v.dica)}" sqref="${v.sqref}">` +
          `<formula1>"${v.lista}"</formula1></dataValidation>`).join("") + `</dataValidations>` : "";

      const zoom = aba.zoom ? ` zoomScale="${aba.zoom}" zoomScaleNormal="${aba.zoom}"` : "";
      const gridLines = aba.ocultarGrade ? ' showGridLines="0"' : "";
      const congelar = aba.semCongelar ? "" : `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>`;
      const sheetPr = aba.semTabelas ? `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>` : "";
      const pageSetup = aba.semTabelas ? `<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="1"/>` : "";

      arquivos.push([`xl/worksheets/sheet${si + 1}.xml`, decl +
        `<worksheet xmlns="${ns}" xmlns:r="${relns}">${sheetPr}` +
        `<dimension ref="A1:${colName(largura - 1)}${aba.rows.length}"/>` +
        `<sheetViews><sheetView workbookViewId="0"${si === 0 ? ' tabSelected="1"' : ""}${zoom}${gridLines}>${congelar}</sheetView></sheetViews>` +
        `<sheetFormatPr defaultRowHeight="${aba.height || 30}"/><cols>${colunas}</cols><sheetData>${linhasXml}</sheetData>${mesclagem}${cf}${dv}` +
        `<pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/>${pageSetup}` +
        (partesTabela.length ? `<tableParts count="${partesTabela.length}">${partesTabela.join("")}</tableParts>` : "") +
        `${tagDrawing}</worksheet>`]);
      if (relacoes.length)
        arquivos.push([`xl/worksheets/_rels/sheet${si + 1}.xml.rels`,
          decl + `<Relationships xmlns="${pkgns}">${relacoes.join("")}</Relationships>`]);
      overrides.push(`<Override PartName="/xl/worksheets/sheet${si + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    });

    const estilos = decl + `<styleSheet xmlns="${ns}">` +
      `<fonts count="11">` +
      /* 0 */ `<font><sz val="11"/><color rgb="FF28251D"/><name val="Calibri"/></font>` +
      /* 1 */ `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
      /* 2 */ `<font><b/><sz val="11"/><color rgb="FF0000FF"/><name val="Calibri"/></font>` +
      /* 3 */ `<font><b/><sz val="11"/><color rgb="FF28251D"/><name val="Calibri"/></font>` +
      /* 4 */ `<font><b/><sz val="12"/><color rgb="FF000000"/><name val="Calibri"/></font>` +
      /* 5 */ `<font><b/><sz val="10.5"/><color rgb="FF000000"/><name val="Calibri"/></font>` +
      /* 6 */ `<font><sz val="12"/><color rgb="FF000000"/><name val="Calibri"/></font>` +
      /* 7 */ `<font><sz val="12"/><color rgb="FFFF0000"/><name val="Calibri"/></font>` +
      /* 8 */ `<font><strike/><sz val="12"/><color rgb="FFFF0000"/><name val="Calibri"/></font>` +
      /* 9 */ `<font><sz val="9.5"/><color rgb="FF1F1F1F"/><name val="Consolas"/></font>` +
      /* 10 */ `<font><b/><sz val="9.5"/><color rgb="FF8C1D18"/><name val="Consolas"/></font>` +
      `</fonts>` +
      `<fills count="8">` +
      /* 0 */ `<fill><patternFill patternType="none"/></fill>` +
      /* 1 */ `<fill><patternFill patternType="gray125"/></fill>` +
      /* 2 */ `<fill><patternFill patternType="solid"><fgColor rgb="FF01696F"/><bgColor indexed="64"/></patternFill></fill>` +
      /* 3 */ `<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>` +
      /* 4 */ `<fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill>` +
      /* 5 */ `<fill><patternFill patternType="solid"><fgColor rgb="FFECECEC"/><bgColor indexed="64"/></patternFill></fill>` +
      /* 6 */ `<fill><patternFill patternType="solid"><fgColor rgb="FFFF7C80"/><bgColor indexed="64"/></patternFill></fill>` +
      /* 7 */ `<fill><patternFill patternType="solid"><fgColor rgb="FF92D050"/><bgColor indexed="64"/></patternFill></fill>` +
      `</fills>` +
      `<borders count="5">` +
      /* 0 */ `<border><left/><right/><top/><bottom/><diagonal/></border>` +
      /* 1 */ `<border><left style="thin"><color rgb="FF7F7F7F"/></left><right style="thin"><color rgb="FF7F7F7F"/></right><top style="thin"><color rgb="FF7F7F7F"/></top><bottom style="thin"><color rgb="FF7F7F7F"/></bottom><diagonal/></border>` +
      /* 2 */ `<border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border>` +
      /* 3 */ `<border><left style="dotted"><color rgb="FF000000"/></left><right style="dotted"><color rgb="FF000000"/></right><top style="dotted"><color rgb="FF000000"/></top><bottom style="dotted"><color rgb="FF000000"/></bottom><diagonal/></border>` +
      /* 4 */ `<border><left/><right style="thin"><color rgb="FF000000"/></right><top/><bottom/><diagonal/></border>` +
      `</borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="21">` +
      /* 0: NORMAL */ `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
      /* 1: CABECALHO */ `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
      /* 2: FORMULA */ `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
      /* 3: PERCENTUAL */ `<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>` +
      /* 4: ENTRADA */ `<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>` +
      /* 5: NEGRITO */ `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
      /* 6: TM_TITULO */ `<xf numFmtId="0" fontId="4" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 7: TM_VERTICAL */ `<xf numFmtId="0" fontId="5" fillId="4" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" textRotation="90"/></xf>` +
      /* 8: TM_ADJ_V_BRANCO */ `<xf numFmtId="0" fontId="6" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 9: TM_ADJ_V_SALMAO */ `<xf numFmtId="0" fontId="6" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 10: TM_ADJ_VIZ_BRANCO */ `<xf numFmtId="0" fontId="6" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 11: TM_ADJ_VIZ_SALMAO */ `<xf numFmtId="0" fontId="6" fillId="6" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 12: TM_CAB_CINZA */ `<xf numFmtId="0" fontId="3" fillId="5" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 13: TM_V_ID */ `<xf numFmtId="0" fontId="6" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 14: TM_VAL_VERMELHO */ `<xf numFmtId="0" fontId="7" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 15: TM_VAL_SALMAO */ `<xf numFmtId="0" fontId="7" fillId="6" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 16: TM_VAL_VERDE */ `<xf numFmtId="0" fontId="7" fillId="7" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 17: TM_VAL_RISCADO */ `<xf numFmtId="0" fontId="8" fillId="4" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>` +
      /* 18: TM_CODIGO */ `<xf numFmtId="0" fontId="9" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>` +
      /* 19: TM_CODIGO_ATIVO */ `<xf numFmtId="0" fontId="10" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>` +
      /* 20: TM_FUNDO_BRANCO */ `<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/>` +
      `</cellXfs>` +
      `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
      `<dxfs count="2">` +
      `<dxf><font><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FF116B74"/><bgColor rgb="FF116B74"/></patternFill></fill></dxf>` +
      `<dxf><font><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFA45209"/><bgColor rgb="FFA45209"/></patternFill></fill></dxf>` +
      `</dxfs></styleSheet>`;

    arquivos.push(["xl/styles.xml", estilos]);
    arquivos.push(["xl/workbook.xml", decl +
      `<workbook xmlns="${ns}" xmlns:r="${relns}"><bookViews><workbookView/></bookViews>` +
      `<sheets>${abas.map((a, i) => `<sheet name="${esc(a.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>` +
      `<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`]);
    arquivos.push(["xl/_rels/workbook.xml.rels", decl +
      `<Relationships xmlns="${pkgns}">` +
      abas.map((a, i) => `<Relationship Id="rId${i + 1}" Type="${relns}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
      `<Relationship Id="rId${abas.length + 1}" Type="${relns}/styles" Target="styles.xml"/></Relationships>`]);
    arquivos.push(["_rels/.rels", decl +
      `<Relationships xmlns="${pkgns}"><Relationship Id="rId1" Type="${relns}/officeDocument" Target="xl/workbook.xml"/></Relationships>`]);
    arquivos.push(["[Content_Types].xml", decl +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      (temPng ? `<Default Extension="png" ContentType="image/png"/>` : "") +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `${overrides.join("")}</Types>`]);
    return zip(arquivos);
  }

  exportar({ ESTILO, colName, formula, estilizada, gerarXlsx, gerarPngGrafo, crc32 });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Xlsx = o; });
