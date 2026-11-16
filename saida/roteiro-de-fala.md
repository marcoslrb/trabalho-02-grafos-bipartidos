# Roteiro de fala — Trabalho 02: Grafo Bipartido (20 minutos)

**Dupla:** Marcos Ribeiro e André Valane  
**Disciplina:** Técnicas de Programação Avançada — Prof. Rafael Vargas Mesquita (Ifes Campus Cachoeiro)  
**Modelo Visual:** Baseado fielmente no `modelo2-apresentacao-institucional.ppt` do Prof. Rafael Vargas Mesquita  
**Tempo oficial do edital (AVA):** **20 minutos** (pontuação máxima de 4,67 pts na apresentação).

## Divisão de tempo sugerida (20 minutos)
- **Parte 1 — Marcos (0:00 a 10:00 · Slides 1 a 6):** Capa institucional, contextualização histórica (Dénes König, 1916/1936), definição + problema interativo de 2 cores, demonstração animada da BFS, implementação com destaque de código e interface gráfica + os 2 arquivos TXT.
- **Parte 2 — André (10:00 a 19:00 · Slides 7 a 13):** Teste de Mesa (Início e Término no padrão do professor), prova pela paridade de nível + cenário de conflito, cuidados conceituais (Cor ≠ Tipo e Estrutura ≠ Semântica), simulador prático ("Mudou o código: o que testar?"), complexidade e encerramento institucional.
- **Fechamento e Demonstração Complementar / Excel (19:00 a 20:00):** Abrir `saida/teste-de-mesa.xlsx` na aba `Impacto` e mostrar as fórmulas reagindo.

## Atalhos da Apresentação (`saida/apresentacao.html`)
- `←` / `→` ou `PageUp` / `PageDown`: slide anterior / próximo.
- `Espaço`: toca ou pausa a animação da BFS (no Slide 4) ou avança nos demais slides.
- `↓` / `↑`: avança ou volta passo a passo na BFS (Slide 4) e alterna a faixa branca de destaque entre os blocos do código (Slide 5).
- `F`: entra/sai da tela cheia.
- `B` ou `.`: deixa a tela preta (para focar a atenção na fala).

---

## Slide 1 (0:00–1:00) — Trabalho sobre Grafos — Grafo Bipartido
**Quem fala:** Marcos

**Na tela:**
- Tema (Grupo 06): Reconhecimento de Grafo Bipartido por BFS com 2 cores.
- Aplicação prática: seleção de casos de teste impactados por alterações de código.

**Fala:**
> Olá, professor Rafael e colegas. Eu sou o Marcos e, junto com o André, vamos apresentar o Trabalho 02 de Técnicas de Programação Avançada sobre Grafos Bipartidos. Nosso trabalho responde a uma pergunta prática do dia a dia de desenvolvimento: quando alteramos funções do código, quais testes precisam ser reexecutados?

## Slide 2 (1:00–2:30) — Problema: Contextualização
**Quem fala:** Marcos

**Na tela:**
- Problema: Grafo Bipartido (Reconhecimento e Bipartição em 2 Cores);
- Primeiro Teorema Estrutural: Dénes König (1916 / livro clássico de 1936);
- Algoritmo de Decisão: Busca em Largura (BFS) com 2 cores alternadas;
- Complexidade: V + A em tempo e V em espaço com listas de adjacência.

**Fala:**
> Começando pela contextualização histórica: o estudo formal dos grafos bipartidos foi consolidado pelo matemático húngaro Dénes König em 1916 e publicado em 1936 no primeiro livro-texto da história da Teoria dos Grafos. König provou que um grafo é bipartido se, e somente se, não possui ciclo de comprimento ímpar. Usando busca em largura com duas cores sobre listas de adjacência, decidimos isso em tempo linear V mais A.

## Slide 3 (2:30–4:15) — Problema: Contextualização
**Quem fala:** Marcos

**Na tela:**
- Definição: Um grafo G = (V, A) é bipartido quando V pode ser particionado em dois conjuntos disjuntos V₁ e V₂ tais que toda aresta une um vértice de V₁ a um vértice de V₂.

**Fala:**
> Pela definição formal, um grafo é bipartido quando conseguimos dividir seus vértices em dois conjuntos disjuntos V1 e V2 de modo que toda aresta atravesse de um lado para o outro, sem arestas internas. Aqui no slide podemos testar ao vivo: com funções de um lado e testes do outro, duas cores bastam. Mas se clicarmos em 'Adicionar aresta C1–C2', fechamos o triângulo C1–T3–C2 de 3 arestas, e duas cores se tornam matematicamente impossíveis.

## Slide 4 (4:15–6:45) — Solução: BFS 2-Cores — Demonstração
**Quem fala:** Marcos

**Na tela:**
- A raiz de cada componente recebe cor 0; cada vizinho novo recebe 1 − cor[u] e entra na fila FIFO.

**Fala:**
> Neste slide demonstramos o algoritmo em funcionamento passo a passo. A busca começa em C1 com cor 0. Ao inspecionar a lista de adjacência de C1, descobrimos T1 e T3 com a cor oposta, cor 1, e colocamos ambos na fila FIFO. De T3, descobrimos C2 com cor 0. Quando o primeiro componente termina, o laço externo garante a visita a C3 e T4 e também ao vértice isolado C4. E trocando aqui em cima para o segundo cenário, vemos a BFS detectar o conflito ímpar no exato momento em que examina T3 para C2.

## Slide 5 (6:45–8:30) — Solução: BFS 2-Cores — Implementação
**Quem fala:** Marcos

**Na tela:**
- Implementação em JavaScript (src/nucleo.js) fiel à estrutura clássica com listas de adjacência.

**Fala:**
> Aqui temos a implementação da nossa função executarBfs, seguindo exatamente o estilo de destaque do modelo da disciplina. No bloco destacado em branco, para cada vértice u retirado da fila, percorremos sua lista de adjacência: se o vizinho v ainda tem cor menos 1, ele recebe a cor complementar 1 menos cor de u, guarda u como pai e entra na fila. Se clicarmos no Bloco 4, vemos o tratamento de conflito: quando v já tem a mesma cor de u, reconstruímos o ciclo ímpar subindo pelos pais até o menor ancestral comum.

## Slide 6 (8:30–10:00) — Solução: Implementação — Interface Gráfica
**Quem fala:** Marcos

**Na tela:**
- Leitura dos 2 arquivos TXT e separação rigorosa das 4 operações na interface.

**Fala:**
> Seguindo o modelo da apresentação, aqui mostramos o formato dos nossos dois arquivos TXT à esquerda e a interface gráfica à direita. O arquivo declara vértices com V, arestas com E e funções alteradas com A. Nossa arquitetura separa quatro operações independentes: validação sintática do TXT com linha e motivo, verificação estrutural pela BFS, validação semântica entre CODIGO e TESTE, e consulta de impacto. Passo agora a palavra ao André.

## Slide 7 (10:00–11:15) — Teste de Mesa :: Início
**Quem fala:** André

**Na tela:**
- Visual completo de Teste de Mesa / Encerramento no padrão do professor.

**Fala:**
> Obrigado, Marcos. No Teste de Mesa :: Início, damos a visão geral do estado das estruturas antes da execução do laço principal da BFS sobre o cenario-valido.txt. À esquerda temos o grafo G e sua lista de adjacência adj com as células pontilhadas ainda não visitadas. À direita, a fila FIFO está vazia e todos os 8 vértices começam na tabela com cor igual a menos 1, pai nulo e componente 0.

## Slide 8 (11:15–12:30) — Teste de Mesa :: Término
**Quem fala:** André

**Na tela:**
- Visual completo de Teste de Mesa / Encerramento no padrão do professor.

**Fala:**
> E aqui temos o Teste de Mesa :: Término, após percorrer todas as listas de adjacência. Note que na representação adj à esquerda todas as 10 entradas ficaram marcadas em salmão, confirmando que cada uma das 5 arestas foi inspecionada nos dois sentidos: 2 vezes A exames. Na tabela à direita, todas as funções receberam cor 0, todos os testes receberam cor 1, e os três componentes conexos foram identificados, conforme a floresta BFS desenhada abaixo da fila.

## Slide 9 (12:30–14:00) — Teste de Mesa :: Conflito e Prova Formal
**Quem fala:** André

**Na tela:**
- Visual completo de Teste de Mesa / Encerramento no padrão do professor.

**Fala:**
> Por que duas cores sempre bastam quando não há ciclo ímpar? Porque na árvore da BFS a cor de cada vértice é a paridade da sua distância até a raiz. Se uma aresta liga dois vértices u e v da mesma cor, a soma dos dois caminhos até o ancestral comum é par, e somando a própria aresta u–v obtemos um ciclo ímpar. É exatamente o que ocorre no segundo arquivo, cenario-conflito.txt: no passo 10, T3 encontra C2 ambos com cor 1, reconstruindo o triângulo T3–C1–C2–T3.

## Slide 10 (14:00–15:30) — Solução: Cuidados Conceituais (Cor ≠ Tipo e Estrutura ≠ Semântica)
**Quem fala:** André

**Na tela:**
- Cor 0/1 depende apenas da ordem de visita da BFS; já a etapa semântica exige que toda aresta ligue CODIGO a TESTE.

**Fala:**
> Dois cuidados conceituais importantes: primeiro, cor da BFS não é tipo de vértice. Se declararmos T1 antes de C1 no arquivo TXT, T1 recebe cor 0 e C1 recebe cor 1, enquanto C4 isolado continua com cor 0 por ser raiz do seu próprio componente. Segundo, ser bipartido na BFS não basta para o domínio: o caminho C1–C2–T1 à direita é bipartido, mas nossa etapa semântica bloqueia a consulta porque C1–C2 liga duas funções.

## Slide 11 (15:30–17:45) — Problema: Aplicação prática
**Quem fala:** André

**Na tela:**
- Identificar quais casos de teste devem ser reexecutados quando funções são alteradas, sem propagar pelo componente e alertando funções sem cobertura.
- Arestas: cobertura declarada (teste exercita função) | Vértices: funções (CODIGO) e testes (TESTE)

**Fala:**
> Chegamos à aplicação prática, que é o coração do nosso problema. Os vértices representam funções e casos de teste, e as arestas representam quais testes exercitam quais funções. Podemos simular aqui no próprio slide: com C1 e C2 alteradas, o sistema recomenda T1, T2 e T3 sem duplicar T3. Se marcarmos apenas C1, ele recomenda apenas T1 e T3 — sem propagar para C2 nem puxar T2 indevidamente. E se clicarmos em C4, recebemos o alerta de que registrarAuditoria não possui testes mapeados.

## Slide 12 (17:45–19:00) — Problema: Complexidade e Outras Aplicações Práticas
**Quem fala:** André

**Na tela:**
- Núcleo da BFS roda em O(V + A); a mesma estrutura bipartida modela problemas clássicos de pareamento e alocação.

**Fala:**
> Na tabela de complexidade separamos o custo do núcleo da BFS, que é O de V mais A com fila indexada sem shift, do modo com rastreamento O de V vezes V mais A, usado para gravar cada passo da animação e da planilha Excel. Ao lado, destacamos que essa mesma estrutura bipartida resolve problemas clássicos de alocação de candidatos a vagas e matrícula de alunos em turmas.

## Slide 13 (19:00–20:00) — Conclusão e Encerramento
**Quem fala:** André

**Na tela:**
- Entregáveis completos: código modular + aplicação em arquivo único, 2 TXTs, planilha Excel real com teste de mesa e apresentação interativa.
- Obrigado pela atenção! Estamos à disposição para perguntas.

**Fala:**
> Para concluir, todos os entregáveis solicitados no edital estão prontos e validados por 66 testes automatizados: o código com a aplicação visual, os dois arquivos TXT, a planilha Excel com o teste de mesa completo e as fórmulas de impacto, que podemos abrir agora para demonstrar, além desta apresentação. Muito obrigado pela atenção, professor Rafael e colegas! Estamos à disposição para perguntas.

---

## Perguntas prováveis da banca
**1. Por que não usar só uma tabela em vez de um grafo?**  
Uma tabela também armazena os pares, mas o grafo bipartido explicita as adjacências em duas classes disjuntas ($V_1 	imes V_2$) e permite validar estruturalmente a bipartição em $O(V + A)$ usando a BFS.

**2. O grafo válido já não nasce bipartido por construção se só ligarmos CODIGO a TESTE?**  
Sim, quando a semântica é respeitada. O papel da BFS é demonstrar o algoritmo clássico de reconhecimento de bipartição (inclusive detectando o ciclo ímpar no segundo arquivo TXT), enquanto a validação semântica garante que um caminho bipartido como $C_1	ext{–}C_2	ext{–}T_1$ não passe despercebido.

**3. A BFS é quem seleciona os testes na consulta?**  
Não. A BFS verifica se o grafo é bipartido (etapa 2). A consulta de impacto (etapa 4) percorre apenas os vizinhos diretos das funções alteradas, em tempo proporcional à soma dos graus das funções escolhidas.

**4. Por que não propagar a consulta pelo componente conexo inteiro?**  
Porque se $C_1$ mudou e $T_3$ testa $C_1$ e $C_2$, a função $C_2$ **não** foi alterada. Propagar para os outros testes de $C_2$ (como $T_2$) selecionaria testes de funções intactas.

**5. Por que usar fila com índice `inicio++` em vez de `Array.shift()`?**  
Porque `Array.shift()` desloca todos os elementos restantes na memória e custa $O(V)$ por retirada; com ponteiro de início, cada retirada é $O(1)$ e a BFS inteira mantém custo linear $O(V + A)$.
