"use strict";
/*
 * Escritor de XLSX real (Open XML dentro de um ZIP sem compressão), sem bibliotecas.
 * Roda no navegador (botão de download) e no Node (geração do arquivo entregue).
 * Cada aba: { name, rows, widths, height, tables, cabecalhos, entradas, colorRange, validacoes }.
 * Células: número, texto, { f, v, estilo } (fórmula com valor em cache) ou { v, estilo }.
 */
(function (exportar) {
  const { esc } = typeof require === "function" ? require("./grafo-svg.js") : globalThis.GrafoSvg;
  const utf8 = new TextEncoder();

  // Estilos (índices de cellXfs, ver styles.xml abaixo)
  const ESTILO = { NORMAL: 0, CABECALHO: 1, FORMULA: 2, PERCENTUAL: 3, ENTRADA: 4, NEGRITO: 5 };

  /* ---------- ZIP (método 0 = armazenado) ---------- */
  const tabelaCrc = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabelaCrc[n] = c >>> 0;
  }
  function crc32(bytes) {
    let c = 0xffffffff;
    for (const x of bytes) c = tabelaCrc[(c ^ x) & 255] ^ (c >>> 8);
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
    const decl = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    const arquivos = [], overrides = [];
    let numeroTabela = 0;

    abas.forEach((aba, si) => {
      const largura = Math.max(...aba.rows.map(r => r.length));
      const cabecalhos = aba.cabecalhos || [1];
      const linhasXml = aba.rows.map((linha, ri) => {
        const corpo = linha.map((valor, ci) => {
          if (valor === undefined || valor === null || valor === "") return "";
          const ref = colName(ci) + (ri + 1);
          let estilo = cabecalhos.includes(ri + 1) ? ESTILO.CABECALHO : ESTILO.NORMAL;
          if ((aba.entradas || []).includes(ref)) estilo = ESTILO.ENTRADA;
          if (valor && typeof valor === "object") {
            estilo = valor.estilo ?? estilo;
            if ("f" in valor) {
              const tipo = typeof valor.v === "string" ? ' t="str"' : "";
              return `<c r="${ref}" s="${estilo}"${tipo}><f>${esc(valor.f)}</f><v>${esc(valor.v)}</v></c>`;
            }
            valor = valor.v;
          }
          if (typeof valor === "number") return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
          return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${esc(valor)}</t></is></c>`;
        }).join("");
        const altura = (aba.alturas || {})[ri + 1] ?? (cabecalhos.includes(ri + 1) ? 30 : (aba.height || 30));
        return `<row r="${ri + 1}" ht="${altura}" customHeight="1">${corpo}</row>`;
      }).join("");

      const colunas = Array.from({ length: largura }, (_, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${(aba.widths || [])[i] || 18}" customWidth="1"/>`).join("");

      // Cada tabela do Excel dá filtro e estilo de listras. O nome das colunas é a linha de cabeçalho.
      const tabelas = aba.tables || [{ startRow: 1, endRow: aba.rows.length, startCol: 1, endCol: largura }];
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

      // Cor 0 e cor 1 da BFS nas colunas cor_*: mesma paleta da aplicação.
      const cf = aba.colorRange ? `<conditionalFormatting sqref="${aba.colorRange}">` +
        `<cfRule type="cellIs" dxfId="0" priority="1" operator="equal"><formula>0</formula></cfRule>` +
        `<cfRule type="cellIs" dxfId="1" priority="2" operator="equal"><formula>1</formula></cfRule></conditionalFormatting>` : "";

      // Células mescladas (usadas só nas notas explicativas, fora das tabelas).
      const mesclagem = (aba.mesclar || []).length ? `<mergeCells count="${aba.mesclar.length}">` +
        aba.mesclar.map(r => `<mergeCell ref="${r}"/>`).join("") + `</mergeCells>` : "";

      // Validação de dados: restringe as células editáveis (ex.: somente 0 ou 1).
      const dv = (aba.validacoes || []).length ? `<dataValidations count="${aba.validacoes.length}">` +
        aba.validacoes.map(v => `<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" ` +
          `errorTitle="Valor inválido" error="${esc(v.erro)}" promptTitle="${esc(v.titulo)}" prompt="${esc(v.dica)}" sqref="${v.sqref}">` +
          `<formula1>"${v.lista}"</formula1></dataValidation>`).join("") + `</dataValidations>` : "";

      arquivos.push([`xl/worksheets/sheet${si + 1}.xml`, decl +
        `<worksheet xmlns="${ns}" xmlns:r="${relns}">` +
        `<dimension ref="A1:${colName(largura - 1)}${aba.rows.length}"/>` +
        `<sheetViews><sheetView workbookViewId="0"${si === 0 ? ' tabSelected="1"' : ""}>` +
        `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
        `<sheetFormatPr defaultRowHeight="30"/><cols>${colunas}</cols><sheetData>${linhasXml}</sheetData>${mesclagem}${cf}${dv}` +
        `<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>` +
        (partesTabela.length ? `<tableParts count="${partesTabela.length}">${partesTabela.join("")}</tableParts>` : "") +
        `</worksheet>`]);
      if (relacoes.length)
        arquivos.push([`xl/worksheets/_rels/sheet${si + 1}.xml.rels`,
          decl + `<Relationships xmlns="${pkgns}">${relacoes.join("")}</Relationships>`]);
      overrides.push(`<Override PartName="/xl/worksheets/sheet${si + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
    });

    const estilos = decl + `<styleSheet xmlns="${ns}">` +
      `<fonts count="4">` +
      `<font><sz val="11"/><color rgb="FF28251D"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FF0000FF"/><name val="Calibri"/></font>` +
      `<font><b/><sz val="11"/><color rgb="FF28251D"/><name val="Calibri"/></font></fonts>` +
      `<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
      `<fill><patternFill patternType="solid"><fgColor rgb="FF01696F"/><bgColor indexed="64"/></patternFill></fill>` +
      `<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill></fills>` +
      `<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>` +
      `<border><left style="thin"><color rgb="FF7F7F7F"/></left><right style="thin"><color rgb="FF7F7F7F"/></right>` +
      `<top style="thin"><color rgb="FF7F7F7F"/></top><bottom style="thin"><color rgb="FF7F7F7F"/></bottom><diagonal/></border></borders>` +
      `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
      `<cellXfs count="6">` +
      `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
      `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>` +
      `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
      `<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top"/></xf>` +
      `<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>` +
      `<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
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
      // fullCalcOnLoad: o Excel recalcula todas as fórmulas ao abrir (os valores gravados são só um cache).
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
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
      `${overrides.join("")}</Types>`]);
    return zip(arquivos);
  }

  exportar({ ESTILO, colName, formula, estilizada, gerarXlsx, crc32 });
})(typeof module === "object" ? o => { module.exports = o; } : o => { globalThis.Xlsx = o; });
