param([string]$Arquivo = "saida\teste-de-mesa.xlsx")
# Abre o XLSX no Excel real (COM) e confere abas, tabelas, filtros, fórmulas recalculadas,
# validação de dados, formatação condicional e o comportamento da seleção editável da aba Impacto.
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$caminho = (Resolve-Path $Arquivo).Path
$falhas = 0
function Conferir($ok, $texto) {
  if ($ok) { "[OK]     $texto" } else { "[FALHOU] $texto"; $script:falhas++ }
}

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open($caminho)
  "Excel $($xl.Version) abriu '$($wb.Name)'"
  $nomes = @($wb.Worksheets | ForEach-Object { $_.Name })
  Conferir (($nomes -join ",") -eq "Resumo,Guia,Entradas,BFS_valido,BFS_conflito,Impacto,Validacoes") "7 abas na ordem exigida: $($nomes -join ', ')"
  Conferir (-not $wb.Name.Contains("Repaired")) "nome do arquivo sem marca de reparo"

  foreach ($ws in $wb.Worksheets) {
    $lo = $ws.ListObjects
    $comFiltro = @($lo | Where-Object { $_.ShowAutoFilter }).Count
    Conferir ($lo.Count -ge 1 -and $comFiltro -eq $lo.Count) "$($ws.Name): $($lo.Count) tabela(s) com filtro automático"
    $erros = 0
    foreach ($c in $ws.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|NAME|DIV|N/A|NUM|NULL)' -or $c.Text -match '^#+$' -and $c.Value2 -is [string]) { $erros++ } }
    Conferir ($erros -eq 0) "$($ws.Name): nenhuma célula com erro de fórmula"
  }

  # --- Impacto: valores recalculados pelo Excel ---
  $imp = $wb.Worksheets.Item("Impacto")
  function LerTestes() {
    $r = @()
    foreach ($linha in 9..12) { $r += "$($imp.Cells.Item($linha,1).Text)=$($imp.Cells.Item($linha,4).Text)[$($imp.Cells.Item($linha,5).Text)]" }
    $r -join " "
  }
  $xl.CalculateFull()
  $estado = LerTestes
  Conferir ($estado -eq "T1=SIM[C1] T2=SIM[C2] T3=SIM[C1 C2] T4=NAO[]") "Impacto com C1 e C2: $estado"
  Conferir ($wb.Worksheets.Item("Resumo").Cells.Item(6,2).Text -eq "3") "Resumo: 3 testes indicados"

  $imp.Range("C3").Value2 = 0   # só C1 alterada
  $xl.CalculateFull()
  $estado = LerTestes
  Conferir ($estado -eq "T1=SIM[C1] T2=NAO[] T3=SIM[C1] T4=NAO[]") "Impacto só com C1 (sem propagação): $estado"
  Conferir ($wb.Worksheets.Item("Resumo").Cells.Item(6,2).Text -eq "2") "Resumo: 2 testes indicados após editar a seleção"

  $imp.Range("C2").Value2 = 0; $imp.Range("C5").Value2 = 1   # só C4 (isolada)
  $xl.CalculateFull()
  $estado = LerTestes
  Conferir ($estado -eq "T1=NAO[] T2=NAO[] T3=NAO[] T4=NAO[]") "Impacto só com C4: $estado"
  Conferir ($imp.Cells.Item(5,9).Text -like "Sem testes mapeados*") "Impacto: aviso de C4 sem testes mapeados: '$($imp.Cells.Item(5,9).Text)'"

  $v = $imp.Range("C2").Validation
  Conferir ($v.Type -eq 3 -and ($v.Formula1 -eq "0,1" -or $v.Formula1 -eq "0;1")) "Impacto: validação de dados C2:C5 aceita só 0,1 (tipo=$($v.Type), '$($v.Formula1)')"
  Conferir ($imp.Range("A7").MergeCells) "Impacto: notas mescladas"

  # --- formatação condicional das cores 0/1 nas abas da BFS ---
  foreach ($n in "BFS_valido", "BFS_conflito") {
    $cf = $wb.Worksheets.Item($n).Cells.FormatConditions.Count
    Conferir ($cf -eq 2) "$n : $cf regras de formatação condicional (cor 0 e cor 1)"
  }
  $bv = $wb.Worksheets.Item("BFS_valido")
  Conferir ($bv.Cells.Item(2,2).Text -like "Inicializa*" -and $bv.Cells.Item($bv.UsedRange.Rows.Count,2).Text -eq "Bipartido") "BFS_valido: do evento Inicialização ao Bipartido ($($bv.UsedRange.Rows.Count - 1) eventos)"
  $bc = $wb.Worksheets.Item("BFS_conflito")
  Conferir ($bc.Cells.Item($bc.UsedRange.Rows.Count,2).Text -eq "Conflito") "BFS_conflito: termina em Conflito"
  $res = $wb.Worksheets.Item("Validacoes")
  Conferir ($res.Range("E2").Text -eq "APROVADO") "Validacoes: primeira linha APROVADO"

  $wb.Close($false)
} finally {
  $xl.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}
if ($falhas -gt 0) { "RESULTADO: $falhas conferência(s) falharam"; exit 1 } else { "RESULTADO: todas as conferências passaram" }
