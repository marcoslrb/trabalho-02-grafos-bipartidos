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
│   ├── teste-de-mesa.xlsx        # Planilha Excel (.xlsx real) com 18 abas (11 no padrão visual do professor + 7 analíticas/fórmulas)
│   ├── apresentacao.html         # Apresentação interativa autônoma (13 slides, padrão Ifes)
│   ├── apresentacao-reserva.pdf  # Versão estática em PDF (reserva de segurança para projetor)
│   └── roteiro-de-fala.md        # Roteiro de fala de 20 minutos sincronizado slide a slide
├── src/                          # Código-fonte modular comentado
│   ├── nucleo.js                 # Parser TXT, BFS com 2 cores, semântica e consulta
│   ├── grafo-svg.js              # Renderizador SVG acessível do grafo
│   ├── xlsx.js                   # Gerador de Open XML / ZIP sem bibliotecas externas
│   ├── planilha.js               # Montagem das 18 abas do teste de mesa (padrão do professor + fórmulas)
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

O arquivo é um `.xlsx` real em Open XML legítimo (não CSV renomeado), contendo **18 abas** divididas em dois grupos:

### A. Abas Visuais de Teste de Mesa no Padrão do Prof. Rafael (11 abas)
Seguem exatamente o layout utilizado pelo Prof. Rafael Vargas Mesquita nas aulas de TPA (`Grafo G` com imagem PNG embutida + `Representação do Grafo G / adj[]` com bordas pontilhadas e preenchimento salmão `#FF7C80` + código-fonte + vetores `v | marcado[] | cor[] | pai[] | comp[]` em vermelho + `Fila FIFO q` riscando os itens removidos e destacando em salmão os recém-inseridos):
1. **`Bipartido-Ex01`:** Estado **Início** em branco (antes do laço principal da BFS).
2. **`Bipartido-GAB`:** Estado **Término / Gabarito Final** (todas as listas `adj[]` inspecionadas em salmão, fila toda riscada e 3 componentes identificados).
3. **`Bipartido-GAB-C1` a `Bipartido-GAB-C4` (8 abas passo a passo):** Uma aba para cada vértice `u` retirado da fila (`C1, T1, T3, C2, T2, C3, T4, C4`), mostrando a evolução da busca quadro a quadro.
4. **`Conflito-GAB`:** Teste de mesa do `cenario-conflito.txt` no exato passo em que `T3` encontra `C2` com a mesma cor (`cor = 1`) e reconstrói o ciclo ímpar `T3 → C1 → C2 → T3`.

### B. Abas Analíticas e de Fórmulas Vivas (7 abas)
5. **`Resumo`:** Indicadores gerais calculados por fórmulas (`COUNTA`, `SUM`, `COUNTIF`, `MAX`).
6. **`Guia`:** Glossário e orientações de leitura do teste de mesa.
7. **`Entradas`:** Dados brutos dos cenários com o número das linhas originais.
8. **`BFS_valido`:** Registro linear completo dos 26 eventos da BFS no cenário válido.
9. **`BFS_conflito`:** Registro linear dos eventos até a detecção do ciclo ímpar no cenário com conflito.
10. **`Impacto`:** Matriz de relações com seleção interativa nas células amarelas `C2:C5` (`1` ou `0`) e recálculo automático por **fórmulas nativas do Excel** (`SUMPRODUCT`, `IF`, `SUM`, `TRIM`).
11. **`Validacoes`:** Tabela com o resultado das 41 verificações automatizadas do núcleo.

---

## 9. Apresentação Interativa (13 slides · 20 minutos — Padrão Institucional Ifes)

A apresentação autônoma (`saida/apresentacao.html` + cópia de segurança em `saida/apresentacao-reserva.pdf`) segue a identidade visual institucional do Ifes (`modelo2-apresentacao-institucional.ppt` do Prof. Rafael Vargas Mesquita) e os critérios de avaliação do AVA (**20 minutos**, valendo 4,67 pts na rubrica), com roteiro cronometrado em `saida/roteiro-de-fala.md`:

1. **Capa e Problema Interativo** (slides 1–2): capa institucional e widget interativo ao vivo onde o apresentador clica nos vértices para testar a 2-coloração ou adiciona a aresta `C1–C2` para fechar o triângulo `C1–T3–C2`.
2. **Contextualização Histórica e Entradas TXT** (slides 3–4): Dénes König (1916/1936), caracterização por ausência de ciclos ímpares, os 2 arquivos TXT (`cenario-valido.txt` e `cenario-conflito.txt`) e as 4 operações separadas.
3. **Demonstração Animada da BFS e Implementação Interativa** (slides 5–6):
   - **Slide 5:** reprodutor completo da BFS embutido no slide (Play/Pause na tecla `Espaço`, passo a passo nas setas `↑`/`↓`, velocidade `1×/2×/4×`, troca ao vivo entre os 3 cenários).
   - **Slide 6:** código real de `executarBfs` com destaque interativo dos blocos 1 a 5 (clique ou setas `↓`/`↑`).
4. **Teste de Mesa :: Início e Término** (slides 7–8): visão geral do *antes* (Passo 0) e *depois* (Passo 25) no formato do template do professor (`Grafo G` + lista de adjacência `adj[ ]` + vetores `cor[ ]`, `pai[ ]`, `comp[ ]`).
5. **Prova Formal, Conflito e Cuidados do Modelo** (slides 9–10): paridade do nível na árvore BFS, reconstrução do ciclo ímpar via LCA, `Cor ≠ Tipo` e `Estrutura ≠ Semântica` (`C1–C2–T1`).
6. **Aplicação Prática Interativa, Complexidade e Conclusão** (slides 11–13): simulador ao vivo de seleção de testes de regressão (*"Mudou o código: o que testar?"*), tabela de complexidade + outras aplicações e síntese dos entregáveis.

## 10. Atendimento ao Edital Oficial do AVA

Conforme registrado na [Matriz de Atendimento](docs/matriz-atendimento.md), todos os itens do documento oficial (`conteudo_ava/IFES-TPA-Trabalho02 (1).pdf`) e da planilha de critérios (`conteudo_ava/criterios de avaliação.png`) estão 100% atendidos e verificados:
- **Código (2,32 pts):** algoritmo correto em $O(V + E)$, apresentação visual clara e abstração de grafo associada à aplicação prática.
- **Apresentação (4,67 pts):** roteiro cronometrado para **20 minutos**, contextualização histórica (König, 1916/1936), ideia geral do algoritmo e aplicação prática conectada ao problema.
- **Arquivos TXT com Grafos (0,67 pt):** `cenarios/cenario-valido.txt` e `cenarios/cenario-conflito.txt`.
- **Arquivo Excel com Teste de Mesa (0,67 pt):** `saida/teste-de-mesa.xlsx` (18 abas: 11 no padrão visual passo a passo do professor + 7 abas analíticas e de fórmulas nativas).
- **Animação com Funcionamento do Algoritmo (0,67 pt):** interativa tanto na aplicação principal (`codigo-e-testes.html`) quanto dentro dos próprios slides (`saida/apresentacao.html`).
