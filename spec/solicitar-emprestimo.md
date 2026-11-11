# Spec: solicitar empréstimo

## Objetivo

Implementar o fluxo imediato de pedido pendente, confirmação de retirada,
cancelamento antes da retirada e consulta dos itens do colaborador, conforme o
briefing da prática e as decisões aprovadas.

## Escopo

- Catálogo autenticado mostra os equipamentos com foto, nome, categoria e
  situação; itens em manutenção não são solicitáveis.
- Solicitação cria um pedido pendente imediatamente e retira o item da
  disponibilidade. Não há aprovação nem fila de espera.
- O colaborador pode cancelar somente enquanto o pedido aguarda retirada. Uma
  confirmação da retirada física promove o pedido a empréstimo ativo; a data
  prevista é 14 dias úteis após essa confirmação, excluindo fins de semana e
  feriados nacionais brasileiros; não exclui feriados estaduais/municipais nem
  pontos facultativos.
- Se a pessoa tentar confirmar ou cancelar após `expiresAt`, o service marca o
  pedido como expirado na transação e informa que o prazo venceu; a listagem não
  mostra pedidos expirados.
- Pedido sem confirmação expira após 24 horas úteis exatas. Cada data útil é uma
  janela de 24h no calendário `America/Sao_Paulo`; sábados, domingos e feriados
  nacionais são pulados. Pedido criado em dia não útil começa às 00:00 da
  próxima data útil. O cálculo não depende do fuso do navegador ou de horário
  comercial.
- Máximo de cinco pedidos pendentes + empréstimos ativos por pessoa; atraso em
  empréstimo ativo bloqueia novos pedidos.
- Equipamento precisa pertencer ao tenant do contexto, estar disponível e sem
  empréstimo ativo ou pedido pendente. Duas solicitações concorrentes ao mesmo
  equipamento resultam em apenas uma criação.
- `Meus empréstimos` lista pedidos pendentes e empréstimos ativos do usuário;
  somente os ativos têm data prevista. Exibe contagem e motivo de bloqueios em
  português.
- Quem confirma a retirada física é o colaborador em `Meus empréstimos`;
  não depende de ação de Operações. Só o dono do pedido pode confirmar ou
  cancelar; usuário e tenant vêm do contexto tRPC, não da entrada.
- Pedidos pendentes contam junto dos empréstimos ativos no limite de cinco,
  decisão explícita da usuária em 2026-11-11.
- Pedido pendente expira após 24 horas úteis exatas: calendário de 24h por data
  útil em `America/Sao_Paulo`, excluindo fim de semana e feriado nacional.
- Duas solicitações simultâneas do mesmo usuário para equipamentos diferentes,
  perto do limite de cinco: no máximo uma pode ser criada se ambas excederem o
  limite em conjunto.
- Equipamento com pedido pendente aparece no catálogo como “Aguardando retirada”
  e não pode ser solicitado; disponibilidade é derivada de pedidos pendentes e
  empréstimos ativos, além de `conditionStatus`.
- UI segue Nocturne. Catálogo sem rodapé ou texto de crédito; fonte/autor/licença
  ficam nos metadados de equipamento. Pixabay não exige atribuição, mas incentiva
  crédito; fontes oficiais: documentação da API e licença do Pixabay.

## Schema/concorrência propostos (DDL aprovado pela usuária em 2026-11-11)

Expandir `Loan`: adicionar `createdAt DateTime @default(now()) @map("created_at")`,
`expiresAt DateTime? @map("expires_at")`, `cancelledAt DateTime? @map("cancelled_at")`
e `expiredAt DateTime? @map("expired_at")`; tornar `checkedOutAt` e `dueAt`
opcionais e remover o default de `checkedOutAt`. Estados derivados sem enum:
pendente = `checkedOutAt`, `dueAt`, `returnedAt`, `cancelledAt` e `expiredAt`
nulos e `expiresAt` no futuro; ativo = `checkedOutAt`/`dueAt` preenchidos e
demais timestamps de encerramento nulos; cancelado = `cancelledAt` preenchido
sem retirada; expirado = `expiredAt` preenchido sem retirada; devolvido =
`returnedAt` e retirada preenchidas. `createdAt` preserva o instante do pedido.
Migration mantém empréstimos atuais: os que têm `returnedAt` continuam
devolvidos; os outros mantêm datas e ficam ativos.

Trocar o índice único parcial existente por um índice que trate pendentes e
ativos como ocupação: `WHERE returned_at IS NULL AND cancelled_at IS NULL AND
expired_at IS NULL`. Listagens usam `expiresAt > now()` para mostrar somente
pedidos ainda pendentes, sem mutar dados durante uma query. Em transação antes
de criar, confirmar ou cancelar, o service marca pendentes expirados do
equipamento/usuário como expirados; isso libera o índice sem cron/job, fora do
ADR. Cancelamento ou expiração libera o item; confirmação guarda
`checkedOutAt` e `dueAt`. Nenhuma tabela nova. SQL/DDL exatos serão apresentados
separadamente antes de qualquer migration.

## Regras de data

Contar 14 dias úteis após a confirmação da retirada, avançando somente em dias de segunda a
sexta que não sejam feriado nacional oficial. Regra deve ser pura e testada em
datas que atravessam fim de semana e feriado. Sem biblioteca de feriados/API
externa: a lista anual de feriados nacionais deve ser versionada e claramente
documentada; pontos facultativos, estaduais e municipais não entram.

## Fora de escopo

Devolução, tela de Operações, reserva, notificações, renovação e gravação remota
em produção.

## Critérios de aceite

- CA-SE-01: somente equipamento disponível no tenant do contexto pode ser
  solicitado; entrada não escolhe tenant nem usuário.
- CA-SE-02: solicitação válida cria pedido pendente que bloqueia o equipamento;
  confirmação da retirada o torna ativo e calcula prazo de 14 dias úteis; pedido
  pendente pode ser cancelado, liberando o item.
- CA-SE-03: limite de cinco pendentes+ativos e bloqueio por atraso em empréstimo
  ativo são aplicados no service e informados à pessoa; solicitações
  concorrentes do mesmo usuário em equipamentos diferentes nunca passam juntas
  do limite. A transação serializável refaz a checagem após conflito; só o dono
  pode confirmar/cancelar.
- CA-SE-04: corrida por um mesmo equipamento cria no máximo um empréstimo.
- CA-SE-05: usuário vê somente seus pedidos pendentes e empréstimos ativos;
  isolamento entre tenants é testado.
- CA-SE-06: manutenção/emprestado não podem ser solicitados e estados visuais
  seguem Nocturne; pedidos pendentes mostram “Aguardando retirada” e permitem
  confirmação/cancelamento apenas ao dono; o catálogo mostra equipamentos
  ocupados por pedido pendente como “Aguardando retirada · até {data/hora}", sem
  ação, usando a cor neutra já definida para Emprestado. Listagens ignoram
  pedidos expirados pelo tempo; mutations marcam o vencimento e liberam o item.
  Em 360×800
  as telas continuam operáveis sem rolagem horizontal; carregar mostra skeleton;
  erro oferece “Tentar novamente”; lista vazia mostra “Nenhum pedido em aberto”.
- CA-SE-07: testes de service por regra, procedimentos tRPC (incluindo
  isolamento), interações de componente e checks de `rules/checks.md` (`npm test`,
  `npx prisma migrate reset --force` somente em Postgres local se o schema mudar,
  `npm run lint`, `npm run typecheck`, `npm run build`, `git status --short`)
  passam sem mock de Prisma para constraints/transações.

## Questões resolvidas / lacunas registradas

- A usuária definiu limite 5, prazo 14 dias úteis com exclusão de feriados
  nacionais, e TI-0010 em manutenção.
- A usuária resolveu a pergunta de cancelamento do PRD: permitir cancelar antes
  da retirada. Para reconciliar com a solicitação imediata sem criar fila, o
  pedido ocupa o item enquanto aguarda retirada; o colaborador confirma a
  retirada para iniciar o prazo ou cancela antes disso. Pedidos pendentes
  contam no limite junto dos empréstimos ativos.
- Expiração de pedidos foi decidida pela usuária: 24 horas úteis exatas, sem
  janela de expediente. Em dias sem expediente, a contagem começa às 00:00 da
  próxima data útil no fuso de São Paulo.
- O briefing desta etapa exclui devoluções e tela de Operações; devolução
  permanece na v1 mais ampla do PRD.
- “Feriado nacional” seguirá feriados estabelecidos em lei federal; feriados
  religiosos municipais, estaduais e pontos facultativos não entram.

## Riscos / validação

- Transação/índice deve preservar concorrência e tenant; teste real Postgres.
- Testar data prevista em final de semana, feriado fixo e feriado móvel.
- Nenhum teste aponta a banco Supabase remoto.

## Execução desta etapa

Escopo autorizado em 2026-11-11: implementar fluxo pendente/retirada/
cancelamento/expiração, regra de limite e telas acordadas. A migration foi
aprovada, mas deve ser criada pelo Prisma e aplicada remotamente somente pelo
workflow de CI definido no ADR-001; não executar contra Supabase diretamente.
