# Matriz de Atendimento

Documento confrontado antes da implementação e atualizado ao término do projeto com as evidências reais de execução.

## 1. Enunciado oficial do AVA e Critérios de Avaliação

**Situação:** Os materiais oficiais publicados pelo Prof. Rafael Vargas Mesquita no AVA foram adicionados em `conteudo_ava/`:
- Especificação oficial: `conteudo_ava/IFES-TPA-Trabalho02 (1).pdf` (Grupo 06: **Grafo Bipartido** — Marcos e André).
- Rubrica de avaliação: `conteudo_ava/criterios de avaliação.png`:
  - **Código (2,32 pts):** algoritmo correto; apresentação visual; abstração de grafo associado à aplicação prática.
  - **Apresentação (4,67 pts):** tempo de **20 minutos**; contextualização do tema; ideia geral do algoritmo; aplicação prática vinculada ao problema.
  - **Arquivos TXT com Grafos (0,67 pt):** dois arquivos distintos (`cenarios/cenario-valido.txt` e `cenarios/cenario-conflito.txt`).
  - **Arquivo Excel com Teste de Mesa (0,67 pt):** `saida/teste-de-mesa.xlsx`.
  - **Animação com Funcionamento do Algoritmo (0,67 pt):** interativa tanto em `codigo-e-testes.html` quanto embutida nos slides de `saida/apresentacao.html`.
- Modelo institucional de slides do professor: `conteudo_ava/_Apresentacao/modelo2-apresentacao-institucional.ppt`.

---

## 2. Matriz: Requisitos do Edital × Situação Final

Legenda: ✅ Atendido integralmente com testes reais

| # | Requisito Conhecido | Situação Inicial (HTML-base) | Ação Realizada | Situação Final e Evidência Real |
|---|---|---|---|---|
| **R1** | Algoritmo de bipartição por BFS com 2 cores | Existia no arquivo | Refatorado para `src/nucleo.js`, modular, documentado e testado isoladamente | ✅ 100% aprovado nos testes automatizados e no navegador |
| **R2** | Aplicação prática (funções × testes) | Existia no arquivo | Preservada a metáfora: vértices CODIGO e TESTE, arestas sem peso | ✅ Exibição clara na UI, nos slides interativos e no Excel com justificativas |
| **R3** | Animação da execução | Existia apenas na aba principal | Passo a passo, play/pause (`Espaço`), setas `↑`/`↓` na aplicação e também dentro do Slide 5 da apresentação | ✅ Testado via DevTools Protocol (`tests/navegador.test.js` e `tests/apresentacao.test.js`) |
| **R4** | Leitura de dois TXT com situações distintas | Embutidos no HTML (não existiam arquivos físicos) | Criados `cenarios/cenario-valido.txt` e `cenarios/cenario-conflito.txt` | ✅ Arquivos no repositório e leitura por upload/botões testada |
| **R5** | Teste de mesa | Gerado somente em runtime | Criado `saida/teste-de-mesa.xlsx` real + slides `Teste de Mesa :: Início` e `Término` | ✅ 7 abas, fórmulas vivas, validado no Excel 16.0 |
| **R6** | Apresentação (20 min, padrão Ifes) e roteiro de fala | Sem identidade Ifes e sem interatividade nos slides | Criados `saida/apresentacao.html` (13 slides interativos no padrão Ifes), `saida/apresentacao-reserva.pdf` e `saida/roteiro-de-fala.md` (20 min) | ✅ Identidade institucional Ifes, 4 widgets ao vivo nos slides e roteiro cronometrado |
| **R7** | Separação das 4 operações | Misturadas na UI; erro interrompia no 1º | UI separada em 4 etapas numeradas com badges e feedback próprio | ✅ Cada etapa possui seu status independente (ok, erro, bloqueada) |
| **R8** | BFS com fila indexada, sem `Array.shift` | Atendia no código | Mantida fila indexada (`inicio++`); teste unitário dedicado | ✅ `tests/verificacoes.test.js` testa ausência de `.shift()` |
| **R9** | Rastrear cor, pai, fila, componente e exames | Componente era só contador global | Adicionado vetor `componente[v]` para cada vértice | ✅ Testado e gravado no teste de mesa em `BFS_valido` |
| **R10** | Ciclo ímpar via árvore de pais | Existia | Mantido algoritmo LCA; testado em triângulo e pentágono | ✅ Detecta $C_1\text{–}T_3\text{–}C_2\text{–}C_1$ (3 arestas) |
| **R11** | BFS modo sem rastreamento e análise de custo | Existia mas nunca era usado | Integrado na UI: grafos > 600 desativam rastreamento automaticamente | ✅ Testado com grafo de 50.000 vértices |
| **R12** | Consulta de impacto direta, sem transitividade | Existia | Mantida união de vizinhos TESTE, sem repetição, com justificativa | ✅ Testada com $C_1+C_2$ ($T_1, T_2, T_3$) e só $C_1$ ($T_1, T_3$) |
| **R13** | Função sem vizinhos: aviso "sem testes mapeados" | Existia | Aviso explícito na UI e na planilha | ✅ Testada seleção de $C_4$ isolado |
| **R14** | Bloqueio de consulta se estrutura/semântica inválida | Lançava exceção | Retorno com objeto de bloqueio estruturado e motivos claros | ✅ Testada consulta em cenário de conflito e tipos inválidos |
| **R15** | Formato TXT com V, E, A, comentários e linhas vazias | Atendia | Mantido e enriquecido com suporte a CRLF, BOM UTF-8 | ✅ Testado no parser |
| **R16** | Erros com linha e motivo, sem parar no primeiro | Parava no 1º erro | Coleta todos os erros em duas passadas e ordena por linha | ✅ Teste unitário confirma múltiplos erros com linha e motivo |
| **R17** | Aceitar referências a vértices declarados depois | Atendia | Segunda passada do parser resolve referências | ✅ Testado unitariamente |
| **R18** | Não inserir arestas automáticas entre mesmo tipo | Atendia | Apenas arestas explicitamente declaradas são criadas | ✅ Testado unitariamente |
| **R19** | Sem limites artificiais de vértices | Tinha limite artificial de 80V/300E | Limite artificial do TXT removido (somente proteção técnica de UI) | ✅ Parser processa grafos de qualquer dimensão |
| **R20** | Cenário válido (8V, 5E, 3 componentes, impacto T1..T3) | Atendia | Padronizado no TXT oficial e nos testes automatizados | ✅ 100% conferido |
| **R21** | Cenário de conflito (aresta C1–C2, ciclo ímpar) | Atendia | Padronizado no TXT oficial e nos testes automatizados | ✅ 100% conferido |
| **R22** | UI em pt-BR; tipos sem depender só de cor | Cores BFS dependiam só de cor | Adicionado rótulo textual da cor dentro de cada nó e legenda | ✅ Acessível por forma (▭/◯) e por texto (`cor 0`, `cor 1`) |
| **R23** | Destacar conflito e ciclo | Destacava arestas | Destaca arestas e vértices pertencentes ao ciclo em vermelho | ✅ Testado no navegador headless |
| **R24** | Mensagens de erro e estados vazios limpos | Mantinha visualização anterior | Em erro de TXT, o grafo e a consulta são resetados | ✅ Testado: evita recomendação enganosa |
| **R25** | Responsivo, claro/escuro, anti-XSS | Sem teste formal | Testes automatizados de tema, mobile (390px) e injeção de HTML | ✅ Testado via DevTools Protocol |
| **R26** | Código comentado nos pontos de decisão | Parcial | Comentários detalhados em todos os módulos de `src/` | ✅ Documentado e legível |
| **R27** | README completo | 2 linhas | README reescrito com execução, modelo, limitações e formatos | ✅ Arquivo `README.md` completo |
| **R28** | Excel real .xlsx com 7 abas e fórmulas | Criado via ZIP em runtime | Gerado em `saida/teste-de-mesa.xlsx`, verificado via COM no Excel | ✅ Testado via PowerShell/COM sem erros |
| **R29** | Resultado real das verificações automatizadas | Não existia | Criado `docs/resultado-verificacoes.md` com dados reais | ✅ 66 testes Node + 27 conferências Excel documentados |
| **R30** | 15 testes obrigatórios do enunciado | Cobertos parcialmente | Módulo único `src/verificacoes.js` executado em 3 ambientes | ✅ 100% aprovados |
| **R31** | Versão simples de executar (arquivo único) | Existia | Script `tools/gerar.js` empacota em `codigo-e-testes.html` | ✅ Duplo clique para abrir |
| **P1** | Exigências adicionais do professor | Não constavam | Listadas na seção de pendências do README e apresentação | ❓ Dupla deve consultar o professor |
