# Registro Real das Verificações Automatizadas

Data de execução: 03/11/2026  
Ambiente: Windows 11, Node.js v24.14.1, Microsoft Excel 16.0 (Office 365 / Desktop), Microsoft Edge 141 (Chromium headless)

---

## 1. Resumo Geral

| Categoria | Comando Executado | Total de Testes / Verificações | Aprovados | Falhas | Tempo / Status |
|---|---|---|---|---|---|
| Suíte Completa de Testes | `npm test` | 66 | 66 | 0 | ~7.7s (100% OK) |
| Validação no Excel Real (COM) | `npm run excel` | 27 conferências | 27 | 0 | Todas aprovadas |
| Verificações Locais no Navegador | Execução embutida no HTML | 41 verificações | 41 | 0 | Instantâneo |

---

## 2. Detalhamento dos Testes do `npm test` (66 testes)

### 2.1 Verificações Obrigatórias do Enunciado (24 testes)
- `[Obrigatório] Grafo válido: TXT aceito, 8 vértices, 5 arestas` — **APROVADO**
- `[Obrigatório] Grafo válido: bipartido e semântica válida` — **APROVADO**
- `[Obrigatório] Ciclo ímpar: conflito não é bipartido` — **APROVADO**
- `[Obrigatório] Ciclo ímpar: triângulo com C1, C2 e T3 (3 arestas, fechado)` — **APROVADO**
- `[Obrigatório] Componentes desconectados: três no cenário válido` — **APROVADO**
- `[Obrigatório] Componentes desconectados: {C1,C2,T1,T2,T3}, {C3,T4}, {C4} em ordem` — **APROVADO**
- `[Obrigatório] Vértice isolado: C4 visitado, cor 0, sem pai, em componente próprio` — **APROVADO**
- `[Obrigatório] Vértice isolado: C4 gera aviso 'sem testes mapeados'` — **APROVADO**
- `[Obrigatório] Teste compartilhado: T3 aparece uma vez, justificado por C1 e C2` — **APROVADO**
- `[Obrigatório] Sem propagação transitiva: só C1 indica T1,T3 (T2 fica de fora)` — **APROVADO**
- `[Obrigatório] Consulta C1 e C2: T1,T2,T3` — **APROVADO**
- `[Obrigatório] Seleção vazia: nenhum teste, sem bloqueio, marcada como vazia` — **APROVADO**
- `[Obrigatório] Tipo inválido em grafo bipartido: BFS aceita (estrutura OK)` — **APROVADO**
- `[Obrigatório] Tipo inválido em grafo bipartido: semântica rejeita C1–C2` — **APROVADO**
- `[Obrigatório] Tipo inválido em grafo bipartido: consulta bloqueada` — **APROVADO**
- `[Obrigatório] Conflito: consulta bloqueada pela estrutura e pela semântica` — **APROVADO**
- `[Obrigatório] Vértice duplicado rejeitado (informa linha)` — **APROVADO**
- `[Obrigatório] Aresta duplicada rejeitada` — **APROVADO**
- `[Obrigatório] Aresta duplicada INVERTIDA rejeitada` — **APROVADO**
- `[Obrigatório] Referência inexistente rejeitada` — **APROVADO**
- `[Obrigatório] Laço rejeitado` — **APROVADO**
- `[Obrigatório] Função alterada inexistente rejeitada` — **APROVADO**
- `[Obrigatório] Marcar TESTE como alterado rejeitado` — **APROVADO**
- `[Obrigatório] Grafo vazio: aceito, bipartido, 0 componentes, com aviso` — **APROVADO**

### 2.2 Garantias do Núcleo Algorítmico (17 testes)
- `[Núcleo] Exames de adjacência: 2 por aresta no cenário válido` — **APROVADO**
- `[Núcleo] Cores independentes dos tipos: TESTE declarado primeiro recebe cor 0` — **APROVADO**
- `[Núcleo] Modo sem rastreamento dá o mesmo resultado e não guarda rastro` — **APROVADO**
- `[Núcleo] Núcleo da BFS não usa Array.shift` — **APROVADO**
- `[Núcleo] Ciclo ímpar de 5 arestas em um pentágono` — **APROVADO**
- `[Núcleo] Conflito em componente posterior: o primeiro componente não impede a detecção` — **APROVADO**
- `[Núcleo] Ordem dos vértices e das arestas preservada` — **APROVADO**
- `[Núcleo] Funções alteradas lidas do TXT: C1,C2` — **APROVADO**
- `[Núcleo] Não insere arestas automáticas entre vértices do mesmo tipo` — **APROVADO**
- `[Núcleo] Referências a vértices declarados depois são aceitas` — **APROVADO**
- `[Núcleo] Comentários, linhas vazias, BOM e CRLF aceitos` — **APROVADO**
- `[Núcleo] Vários erros são coletados, ordenados por linha, com motivo` — **APROVADO**
- `[Núcleo] Erros de campos: V com 3 campos, tipo inválido, ID inválido, registro desconhecido` — **APROVADO**
- `[Núcleo] TXT inválido não gera grafo` — **APROVADO**
- `[Núcleo] Rótulo com HTML é aceito como texto (a interface escapa)` — **APROVADO**
- `[Núcleo] Grafo grande sem rastreamento: caminho com 50000 vértices é bipartido` — **APROVADO**
- `[Núcleo] Consulta bloqueia seleção de TESTE ou de função inexistente` — **APROVADO**

### 2.3 Interface e UI no Navegador Headless (16 testes)
- `abre sem erros de JavaScript e mostra o cenário válido` — **APROVADO**
- `consulta C1+C2 indica T1, T2, T3 com justificativa e T3 uma única vez` — **APROVADO**
- `desmarcar C2 não propaga: T1 e T3, sem T2` — **APROVADO**
- `seleção vazia mostra estado vazio; C4 mostra aviso de sem testes mapeados` — **APROVADO**
- `animação: próximo, slider, reiniciar, executar/pausar` — **APROVADO**
- `BFS visita C4 (isolado) e mostra 3 componentes ao final` — **APROVADO**
- `cenário com conflito: ciclo destacado e consulta bloqueada` — **APROVADO**
- `TXT inválido: todos os erros com linha e motivo; grafo e recomendação antigos somem` — **APROVADO**
- `rótulo malicioso é mostrado como texto, nunca interpretado (anti-XSS)` — **APROVADO**
- `grafo vazio: estados vazios, sem erro` — **APROVADO**
- `grafo grande usa o modo sem rastreamento e desativa a animação` — **APROVADO**
- `alternância claro/escuro` — **APROVADO**
- `celular (390 px): sem rolagem horizontal` — **APROVADO**
- `apresentação: 15 slides, navegação e grafos desenhados` — **APROVADO**
- `guia: verificações automatizadas do navegador todas aprovadas` — **APROVADO**
- `Excel e roteiro gerados no navegador são idênticos aos arquivos entregues` — **APROVADO**

### 2.4 Integridade dos Entregáveis e Apresentação Autônoma (9 testes)
- `apresentação autônoma: navegação e conteúdo` — **APROVADO**
- `TXT válido: 8 vértices, 5 arestas, 3 componentes, impacto T1,T2,T3` — **APROVADO**
- `TXT de conflito: sintaxe válida, triângulo C1-T3-C2, semântica inválida` — **APROVADO**
- `codigo-e-testes.html está em dia com src/ e com os TXT` — **APROVADO**
- `HTML gerado não depende de rede nem de arquivos externos` — **APROVADO**
- `XLSX é um ZIP Open XML real (não CSV renomeado), com 7 abas, tabelas e fórmulas` — **APROVADO**
- `XLSX: rastro BFS_valido tem o mesmo número de eventos que o algoritmo` — **APROVADO**
- `apresentação e roteiro: 15 slides, fala para cada um, sem promessa de duração` — **APROVADO**

---

## 3. Teste de Mesa no Microsoft Excel Real (COM Automation)

Execução do script `tools/verificar-excel.ps1`:
1. **Abertura:** Microsoft Excel 16.0 abriu `saida/teste-de-mesa.xlsx` sem nenhum aviso de erro, sem mensagem de "arquivo reparado" e sem solicitar recuperação.
2. **Abas:** Conferidas as 7 abas na ordem exata: `Resumo, Guia, Entradas, BFS_valido, BFS_conflito, Impacto, Validacoes`.
3. **Tabelas e Filtros:** Todas as abas possuem tabelas formatadas com autofiltro ativo.
4. **Células com erro:** Zero células com erro (`#REF!`, `#VALOR!`, `#NOME?`, `#DIV/0!`, etc.) em todas as abas.
5. **Recálculo de Fórmulas:**
   - Seleção inicial com $C_1$ e $C_2$: testes indicados $T_1$, $T_2$ e $T_3$ (calculado via `SUMPRODUCT` e `IF`).
   - Alterando $C_2$ para `0` dinamicamente: $T_2$ passa para "NAO" e $T_1, T_3$ permanecem "SIM".
   - Alterando $C_1$ para `0` e $C_4$ para `1`: todos os testes passam para "NAO" e a célula de aviso exibe *"Sem testes mapeados: isso NÃO dispensa testes"*.
   - A aba `Resumo` atualiza automaticamente a contagem de testes indicados via fórmula vinculada.
6. **Formatação Condicional:** 2 regras ativas nas abas `BFS_valido` e `BFS_conflito` colorindo as cores `0` e `1` da BFS.

