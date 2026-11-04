# Mudou o código: o que testar?

Trabalho prático da disciplina de **Técnicas de Programação Avançada** (Prof. Rafael Vargas).  
**Dupla:** Marcos Ribeiro e André Valane  
**Tema:** Grafos Bipartidos • BFS com Duas Cores • Consulta de Testes Relacionados

---

## 1. Visão Geral e Contexto

O projeto investiga uma questão recorrente em engenharia de software: **ao alterar uma ou mais funções de uma aplicação, quais casos de teste devem ser revisados ou reexecutados?**

O domínio é modelado como um **grafo bipartido**, onde:
- Vértices do tipo `CODIGO` representam funções da aplicação.
- Vértices do tipo `TESTE` representam casos de teste.
- Arestas **não direcionadas e sem peso** indicam que determinado teste exercita determinada função.
- Uma função pode estar ligada a múltiplos testes, e um teste pode cobrir múltiplas funções.

> **Importante (Honestidade do Modelo):**  
> O mapeamento entre funções e testes é fornecido **manualmente via arquivo de texto (TXT)**. A aplicação **não** se integra a repositórios Git, não realiza análise estática de código-fonte, não mede cobertura em tempo de execução nem executa testes de fato. O resultado da indicação reflete estritamente as relações declaradas na entrada.

---

## 2. Separação Obrigatória das Quatro Operações

A ferramenta divide o processamento em quatro etapas independentes, sem misturar conceitos:

1. **Validação Sintática do TXT:**
   Lê o arquivo, valida registros (`V`, `E`, `A`), identificadores, duplicidades e referências. Coleta todos os erros informando **linha e motivo**. Se houver erro de sintaxe, nenhum grafo é construído e o estado anterior é limpo para evitar dados enganosos.
2. **Verificação Estrutural da Bipartição (BFS com Duas Cores):**
   Percorre todos os componentes conexos (incluindo vértices isolados) utilizando fila FIFO com índice de início (sem `Array.shift`). Atribui alternadamente as cores `0` e `1` (independentes dos tipos dos vértices). Caso dois vizinhos possuam a mesma cor, reconstrói um ciclo ímpar a partir da árvore de pais e declara que o grafo não é bipartido.
3. **Validação Semântica do Domínio:**
   Garante que toda aresta ligue um vértice `CODIGO` a um vértice `TESTE`. Essa verificação é independente da bipartição: um caminho `C1–C2–T1` é estruturalmente bipartido, mas viola a semântica por ligar duas funções.
4. **Consulta de Impacto (Testes Relacionados):**
   Dado um subconjunto $S$ de funções alteradas:
   - Obtém a união dos vizinhos imediatos do tipo `TESTE`.
   - Elimina testes duplicados na saída.
   - **Não** propaga de forma transitiva pelo componente (se $C_1$ liga a $T_3$ e $T_3$ liga a $C_2$, uma alteração exclusiva em $C_1$ não seleciona os outros testes de $C_2$).
   - Indica expressamente quais funções alteradas justificam cada teste selecionado.
   - Emite aviso claro de **"sem testes mapeados"** para funções sem vizinhos (o que não autoriza concluir que a função dispensa testes).
   - **Bloqueia** a indicação caso a estrutura (etapa 2) ou a semântica (etapa 3) seja inválida.

---

## 3. Complexidade Algorítmica e Modos de Execução

- **Núcleo do Algoritmo:**  
  A BFS percorre listas de adjacência com fila indexada em tempo $O(V + E)$ e espaço auxiliar $O(V)$.
- **Modo com Rastreamento (Animação e Teste de Mesa):**  
  Para animar a execução passo a passo e gerar o teste de mesa completo, a aplicação clona os vetores de cor, pai, componente e fila a cada evento. Esse processo gera até $O(V \cdot (V + E))$ de custo em tempo e memória.
- **Modo sem Rastreamento:**  
  Para conjuntos grandes ou consultas estáticas, a BFS é executada diretamente em $O(V + E)$, sem alocação redundante de estados. A interface aplica esse modo automaticamente se o grafo ultrapassar 600 elementos (vértices + arestas).

---

## 4. Formato do Arquivo de Entrada (TXT)

O arquivo TXT segue o formato delimitado por ponto e vírgula:

```text
# Linhas iniciadas por # são comentários
# Linhas vazias são ignoradas

# 1. Declaração de vértices
# V;ID;CODIGO|TESTE;Rótulo
V;C1;CODIGO;calcularDesconto
V;T1;TESTE;testeDesconto

# 2. Declaração de arestas (não direcionadas)
# E;ID_ORIGEM;ID_DESTINO
E;C1;T1

# 3. Funções alteradas inicialmente
# A;ID_CODIGO_ALTERADO
A;C1
```

### Regras do Formato:
- IDs devem iniciar com letra e conter apenas caracteres alfanuméricos e sublinhado (`^[A-Za-z][A-Za-z0-9_]*$`).
- Referências a vértices declarados em linhas posteriores são aceitas (duas passadas na leitura).
- Laços (`E;C1;C1`) e arestas duplicadas (inclusive invertidas `E;T1;C1`) são rejeitados com indicação da linha.
- Registro `A` é aceito exclusivamente para vértices do tipo `CODIGO`.

---

## 5. Cenários Fornecidos

1. **Cenário Válido (`cenarios/cenario-valido.txt`):**
   - 8 vértices: $C_1, C_2, C_3, C_4$ e $T_1, T_2, T_3, T_4$.
   - 5 arestas: $C_1\text{–}T_1, C_1\text{–}T_3, C_2\text{–}T_2, C_2\text{–}T_3, C_3\text{–}T_4$.
   - 3 componentes conexos: $\{C_1, C_2, T_1, T_2, T_3\}$, $\{C_3, T_4\}$ e $\{C_4\}$ (isolado).
   - Funções alteradas: $C_1$ e $C_2$.
   - Resultado do impacto: $T_1, T_2$ e $T_3$ (com $T_3$ justificado por $C_1$ e $C_2$, sem duplicidade).
2. **Cenário de Conflito (`cenarios/cenario-conflito.txt`):**
   - Idêntico ao cenário válido, acrescido da aresta $C_1\text{–}C_2$.
   - Origina o triângulo ímpar $C_1\text{–}T_3\text{–}C_2\text{–}C_1$.
   - Funciona como teste negativo: a BFS detecta ciclo ímpar e a validação semântica acusa conexão entre funções. A recomendação de testes é bloqueada.

---

## 6. Como Executar

### 6.1 Execução Direta (Sem Instalação)
Basta abrir o arquivo **`codigo-e-testes.html`** em qualquer navegador moderno (Chrome, Edge, Firefox, etc.).
- Funciona 100% offline (arquivo único autocontido, sem dependências externas, fontes de CDN ou servidores).
- Na barra superior, botões permitem carregar os cenários embutidos, importar TXT do disco, alternar tema claro/escuro e exportar os artefatos.

### 6.2 Execução em Linha de Comando e Testes (Node.js 22+)
Para desenvolvedores ou revisores que desejem inspecionar o código-fonte modular e rodar a suíte de testes automatizados:

```bash
# 1. Executar a suíte de testes (núcleo, interface headless, entregáveis e apresentação)
npm test

# 2. Revalidar a integridade da planilha Excel no Microsoft Excel real via automação COM
npm run excel

# 3. Recompilar o HTML autocontido e regerar os arquivos da pasta saida/
npm run gerar
```

---

## 7. Estrutura do Projeto

```text
trabalho-02-grafos-bipartidos/
├── codigo-e-testes.html          # Aplicação completa em arquivo único (autocontido)
├── README.md                     # Documentação geral do projeto
├── package.json                  # Scripts e metadados para Node.js
├── cenarios/
│   ├── cenario-valido.txt        # Cenário didático válido
│   └── cenario-conflito.txt      # Cenário didático negativo (com conflito ímpar)
├── docs/
│   ├── matriz-atendimento.md     # Matriz de requisitos confrontada com o código
│   └── resultado-verificacoes.md # Registro das verificações automatizadas executadas
├── saida/
│   ├── teste-de-mesa.xlsx        # Planilha Excel (.xlsx real) com 7 abas e fórmulas
│   ├── apresentacao.html         # Apresentação de slides autônoma (15 slides)
│   └── roteiro-de-fala.md        # Roteiro de fala detalhado slide a slide
├── src/                          # Código-fonte modular comentado
│   ├── nucleo.js                 # Parser TXT, BFS com 2 cores, semântica e consulta
│   ├── grafo-svg.js              # Renderizador SVG acessível do grafo
│   ├── xlsx.js                   # Gerador de Open XML / ZIP sem bibliotecas externas
│   ├── planilha.js               # Montagem das 7 abas do teste de mesa
│   ├── slides.js                 # Dados dos slides e gerador do roteiro
│   ├── interface.js              # Camada de controle da UI e eventos
│   ├── estilo.css                # Folha de estilos responsiva com suporte a temas
│   └── template.html             # Estrutura base da aplicação
├── tests/                        # Bateria de testes automatizados (66 testes)
│   ├── verificacoes.test.js      # Verificações obrigatórias e regras do núcleo
│   ├── entregaveis.test.js       # Integridade do Open XML, TXTs e empacotamento
│   ├── navegador.test.js         # Testes de UI ponta a ponta em navegador headless
│   └── apresentacao.test.js      # Navegação dos slides autônomos
└── tools/                        # Ferramentas auxiliares
    ├── gerar.js                  # Script de montagem e exportação dos entregáveis
    ├── cenarios.js               # Carregador de cenários para testes
    ├── navegador.js              # Cliente DevTools Protocol mínimo para Node
    └── verificar-excel.ps1       # Script PowerShell que abre e testa o Excel via COM
```

---

## 8. Conteúdo da Planilha Excel (`saida/teste-de-mesa.xlsx`)

O arquivo é um `.xlsx` real em Open XML legítimo (não CSV renomeado), contendo 7 abas estruturadas:
1. **Resumo:** Indicadores gerais (vértices, arestas, componentes, testes indicados, conferências).
2. **Guia:** Glossário e orientações de leitura do teste de mesa.
3. **Entradas:** Dados brutos dos cenários com o número das linhas originais.
4. **BFS_valido:** Rastreamento evento a evento da BFS no cenário válido (fila, cores, pais, componentes, exames).
5. **BFS_conflito:** Rastreamento evento a evento até a detecção do ciclo ímpar no cenário com conflito.
6. **Impacto:** Matriz de relações com seleção interativa nas células `C2:C5` (`1` ou `0`). Os testes recomendados, totalizadores e avisos de funções sem testes são calculados exclusivamente por **fórmulas nativas do Excel** (`SUMPRODUCT`, `IF`, `SUM`, `COUNTA`, `COUNTIF`).
7. **Validacoes:** Tabela com o resultado das verificações automatizadas de integridade.

---

## 9. Pendências e Confronto Acadêmico

Conforme registrado na [Matriz de Atendimento](docs/matriz-atendimento.md):
- O enunciado original do professor Rafael Vargas **não estava presente no repositório inicial**.
- Portanto, **não foram inventadas restrições**: duração exata de apresentação, prazo de entrega, exigência de linguagem de programação específica ou número fixo de vértices não foram presumidos.
- A dupla deve conferir com o professor ou com a plataforma da disciplina se há requisitos adicionais de submissão (ex.: envio em zip, repositório git ou apresentação em aula).
