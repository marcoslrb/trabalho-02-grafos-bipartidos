# Matriz de Atendimento

Documento confrontado antes da implementação e atualizado ao término do projeto com as evidências reais de execução.

## 1. Enunciado original do professor

**Situação:** O repositório inicial continha apenas o `README.md` com menção aos nomes da dupla (Marcos Ribeiro e André Valane), professor (Rafael Vargas), disciplina (*Técnicas de Programação Avançada*) e tema (*Grafos Bipartidos*). O PDF ou documento oficial com diretrizes específicas não estava presente no repositório.

**Postura Acadêmica:** Nenhuma restrição não declarada foi inventada (como prazo, duração máxima/mínima de apresentação, limite de vértices do trabalho ou linguagem obrigatória). O projeto foi implementado atendendo integralmente aos requisitos conhecidos do prompt e aos fundamentos de grafos bipartidos.

---

## 2. Matriz: Requisitos Conhecidos × Situação Final

Legenda: ✅ Atendido integralmente com testes reais · ❓ Depende do enunciado original

| # | Requisito Conhecido | Situação Inicial (HTML-base) | Ação Realizada | Situação Final e Evidência Real |
|---|---|---|---|---|
| **R1** | Algoritmo de bipartição por BFS com 2 cores | Existia no arquivo | Refatorado para `src/nucleo.js`, modular, documentado e testado isoladamente | ✅ 100% aprovado nos testes automatizados e no navegador |
| **R2** | Aplicação prática (funções × testes) | Existia no arquivo | Preservada a metáfora: vértices CODIGO e TESTE, arestas sem peso | ✅ Exibição clara na UI e no Excel com justificativas |
| **R3** | Animação da execução | Existia | Passo a passo, slider, executar/pausar, reiniciar | ✅ Testado via DevTools Protocol (`tests/navegador.test.js`) |
| **R4** | Leitura de dois TXT com situações distintas | Embutidos no HTML (não existiam arquivos físicos) | Criados `cenarios/cenario-valido.txt` e `cenarios/cenario-conflito.txt` | ✅ Arquivos no repositório e leitura por upload/botões testada |
| **R5** | Teste de mesa | Gerado somente em runtime | Criado `saida/teste-de-mesa.xlsx` real e script COM de validação | ✅ 7 abas, fórmulas vivas, validado no Excel 16.0 |
| **R6** | Apresentação e roteiro de fala | Apenas tela embutida; sem texto de fala | Criados `saida/apresentacao.html` (15 slides) e `saida/roteiro-de-fala.md` | ✅ Roteiro com fala real slide a slide, sincronizado |
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
