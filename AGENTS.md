# AGENTS.md — EmpresTI

Instruções para agentes de IA que trabalham neste repositório.

Todo o conteúdo abaixo tem origem em três arquivos que já existiam aqui:
`docs/PRD.md`, `docs/adr/001-stack.md` e `layout.md`. Cada seção indica a fonte.
Este documento **não** preenche lacuna: o que esses arquivos não respondem está
na seção 13 como pergunta pendente, sem resposta inventada.

---

## 1. O que é o sistema

(fonte: `docs/PRD.md`)

Controle de empréstimo de equipamentos internos — notebooks, monitores, cabos,
câmeras. Hoje isso é uma planilha compartilhada: ninguém sabe o que está
disponível, itens somem, e a devolução só é registrada se alguém lembrar de
atualizar a linha.

Dois papéis de uso:

- **Colaborador** — vê o catálogo, pede um item emprestado, devolve.
- **Operações** — cadastra equipamentos, vê quem está com o quê e registra
  devolução no balcão.

Critério de sucesso da v1: Operações consegue abandonar a planilha depois de
duas semanas de uso.

## 2. Escopo da primeira versão

(fonte: `docs/PRD.md`)

O que precisa existir:

1. Login. Cada pessoa vê os próprios empréstimos.
2. Catálogo de equipamentos com a situação de cada um.
3. Solicitar empréstimo de um item disponível.
4. Devolver um item que está comigo.
5. Tela de Operações com todos os empréstimos em aberto.

Regras que Operações já decidiu:

- Cada pessoa pode estar com no máximo **3 itens** ao mesmo tempo.
- O prazo padrão de devolução é de **14 dias**.
- Quem tem item em atraso **não** pode pegar outro emprestado.
- Equipamento em manutenção **não** aparece como disponível.

Fora desta versão: reserva com data futura, notificação por e-mail e importação
da planilha atual. `layout.md` §9.5 repete que essas três não devem nem ser
desenhadas.

## 3. Stack e arquitetura

(fonte: `docs/adr/001-stack.md`)

| Item | Decisão |
|---|---|
| Arquitetura | Monolito; front e servidor no mesmo projeto Next.js (App Router) |
| Repositório | Único; um projeto na Vercel |
| Camada de servidor | Route Handlers do Next, sem servidor separado |
| Linguagem | TypeScript em modo `strict` |
| Renderização | Client Components como padrão para telas com dados |
| Estado de servidor | TanStack Query via `@trpc/react-query` |
| Estado de cliente | `useState` e Context; sem biblioteca de store |
| Formulários | React Hook Form + `zodResolver` |
| Estilização | Tailwind CSS |
| Componentes | shadcn/ui (componente copiado para o repositório) |
| Padrão de API | tRPC |
| Endpoint | Route Handler em `app/api/trpc/[trpc]/route.ts` |
| Organização | `src/server/api/routers/<dominio>.ts`, um router por domínio |
| Camadas | Router (procedimento) → Service → Prisma |
| Validação de entrada | Zod no `.input()` de todo procedimento |
| Serialização | superjson |
| Contexto de request | Sessão, `tenant_id`, `role` e cliente Prisma montados no `createContext` |
| Server Actions | Não usadas |
| Fonte da verdade | O `AppRouter` do tRPC |
| Consumo no cliente | `RouterInputs` e `RouterOutputs` inferidos, sem tipo escrito à mão |
| Versionamento | Nenhum |
| Formato de erro | `TRPCError` com código, tratado por `errorFormatter` |
| Paginação de listas | Cursor, via `useInfiniteQuery` |
| Consumidor externo | Fora de escopo |
| Tempo real | Fora de escopo |

O ADR explica as escolhas com estas razões, entre outras: um caminho só de
leitura e um caminho só de mutação são mais fáceis de auditar; a regra de
negócio no service é o que dá para testar sem montar contexto de tRPC; um
router por domínio mantém a feature inteira junta.

## 4. Dados, multi-tenancy e migrations

(fonte: `docs/adr/001-stack.md`)

| Item | Decisão |
|---|---|
| Banco | PostgreSQL gerenciado pelo Supabase, região `sa-east-1` (São Paulo) |
| ORM | Prisma |
| Dono do schema | Prisma Migrate (dono único; Supabase CLI não gerencia migrations) |
| RLS, policies e triggers | SQL bruto dentro das migrations do Prisma |
| Modelo | Tenant discriminado por coluna, banco único |
| Coluna | `tenant_id` em toda tabela de domínio |
| Vínculo usuário–tenant | Tabela `memberships (user_id, tenant_id, role)` |
| Primeiro tenant | `suporte_ti`, criado no seed |
| Origem do tenant | Resolvido no `createContext` a partir da sessão, **nunca** do input |
| Aplicação do filtro | `tenantProcedure` injeta o `tenant_id` no service |
| Instância do Prisma | Singleton global, para sobreviver ao hot reload |
| Conexão de runtime | Supavisor, porta 6543, `?pgbouncer=true&connection_limit=1` |
| Conexão de migration | `directUrl`, porta 5432 |
| Seed | `prisma/seed.ts`, idempotente |
| RLS | Habilitado em todas as tabelas, deny by default |
| Papel do RLS | Defesa em profundidade, não autorização primária |
| Auditoria | Tabela append-only com ator, tenant, ação e recurso |

Razões registradas no ADR que afetam o dia a dia: tabela sem `tenant_id` não tem
como ser protegida por policy; se o cliente manda o tenant no input, trocar o
valor é toda a exploração necessária; a autorização acontece no servidor porque o
Prisma conecta com um role dono das tabelas e **bypassa RLS por padrão**.

## 5. Autenticação e autorização

(fonte: `docs/adr/001-stack.md`)

| Item | Decisão |
|---|---|
| Provedor de identidade | Supabase Auth, e-mail e senha |
| Cadastro | Fechado, somente por convite de administrador |
| Integração com o Next | `@supabase/ssr` |
| Sessão no navegador | Cookie `httpOnly`, escrito pelo `@supabase/ssr` |
| Renovação de sessão | Middleware do Next em toda rota |
| Autorização | Middlewares do tRPC: `protectedProcedure`, `tenantProcedure`, `adminProcedure` |

## 6. Limites de plataforma e de execução

(fonte: `docs/adr/001-stack.md`)

| Item | Decisão |
|---|---|
| Hospedagem | Vercel, um projeto |
| Plano | Hobby |
| Região das functions | Padrão do Hobby (Estados Unidos) |
| Limite de execução | 60s por request |
| Fila e agendamento | Fora de escopo; tudo roda dentro do request |
| CI | GitHub Actions |
| Migration em deploy | `prisma migrate deploy` em job do GitHub Actions, antes do deploy |
| Configuração | Variáveis de ambiente validadas com Zod no boot |
| Log | Log estruturado em JSON, com `request_id` e `tenant_id` |
| Rastreamento de erro | Sentry |
| Cabeçalhos HTTP | Configurados em `next.config.js` |
| CSP | Restritiva, sem `unsafe-inline` |
| Rate limit | Por IP e por usuário, com contador no Postgres |
| Segredos | Environment variables da Vercel; nada com prefixo `NEXT_PUBLIC_` |
| `service_role` key do Supabase | Somente em código de servidor |

Consequências que o ADR já aceitou e que restringem o desenho de qualquer
operação: importação e relatório grande precisam caber em 60s, ou seja, ser
desenhados em lotes; envio de e-mail e integração externa seguram a resposta do
request; não há WebSocket na Vercel e atualização de tela é polling do TanStack
Query; migration não roda no boot, porque em serverless várias instâncias sobem
em paralelo e tentariam migrar ao mesmo tempo.

## 7. Interface

(fonte: `layout.md`)

- Base visual: design system **Nocturne** adaptado à primária `#001449`.
  **Somente modo escuro** — não existe modo claro nem alternador de tema.
- A cor de ação visível é `#5B7FE0`; a primária `#001449` é usada como fundo
  profundo, não como texto nem preenchimento de botão.
- Ações primárias são contornadas (borda de 1px + fundo transparente), nunca
  preenchidas com cor sólida.
- Tipografia: Open Sans (400/500/600/700), fallback `system-ui, sans-serif`;
  nunca 700 em títulos.
- Ícones: Phosphor (regular e fill).
- Espaçamento: `flex`/`grid` + `gap` em todos os grupos de irmãos, nunca margem
  individual nem espaço por whitespace.
- Telas especificadas: 01 Login, 02 Catálogo, 03 Detalhe do item,
  04 Meus empréstimos, 05 Operações (empréstimos em aberto), 06 Operações
  (cadastrar equipamento).
- Rotas indicadas no `layout.md` §7: `/login`, `/catalogo`,
  `/catalogo/:patrimonio`, `/meus-emprestimos`, `/operacoes/emprestimos`,
  `/operacoes/equipamentos/novo`.
- Navegação: sidebar fixa de 236px com dois grupos rotulados — **Colaborador**
  (Catálogo, Meus empréstimos) e **Operações** (Empréstimos em aberto, Cadastrar
  equipamento). Operações é seção do mesmo app, não app separado.
- Idioma da interface e do conteúdo: português do Brasil. Tom de copy seco e
  operacional — frases curtas, sem exclamação, sem emoji. Datas no formato
  `dd/mmm` (`14/set`).
- Animações discretas, nada acima de 240ms, nada que se mova sozinho, e
  `prefers-reduced-motion` respeitado.
- As regras de negócio com reflexo visual estão em `layout.md` §9 (contador
  "2 de 3", prazo de 14 dias, atraso bloqueando com botão desabilitado,
  manutenção fora do catálogo).

**Conflito não resolvido nos arquivos:** `layout.md` §10 pede estilos **inline**
no template do componente, com o único CSS global permitido sendo `@font-face`/
import de fonte, `@keyframes` e reset de `body` — e cita o design system Nocturne
carregado de `_ds/nocturne-<id>/styles.css` + `_ds_bundle.js`. O ADR-001 define
**Tailwind CSS + shadcn/ui**. Os dois não cabem juntos sem uma decisão que
nenhum arquivo toma. Ver item 7 da seção 13.

## 8. Testes

(fonte: `docs/adr/001-stack.md`)

| Item | Decisão |
|---|---|
| Runner | Vitest, único para servidor e componentes |
| Componentes | Testing Library |
| Integração de banco | Testcontainers com Postgres real |
| Teste de procedimento | `createCaller` do tRPC, chamando o router direto |
| E2E de interface | Playwright |
| Teste obrigatório de isolamento | Um caso por procedimento: tenant A não enxerga dado de tenant B |
| Meta de cobertura | Sem percentual; caminhos críticos obrigatórios |

Valem como decisão, não como sugestão: Prisma **não** é mockado (mockar testa o
mock, e constraint, transação e policy de RLS só falham contra Postgres de
verdade); `createCaller` monta o contexto à mão, incluindo sessão e tenant, sem
subir servidor HTTP; o teste de isolamento existe porque vazamento entre tenants
é a falha mais cara desse sistema e a mais fácil de introduzir sem perceber.

## 9. Convenções de código e de commit

(fonte: `docs/adr/001-stack.md`)

- Lint e formatação: ESLint + Prettier, uma config só para o repositório.
- Hook de pré-commit: lint-staged + husky, **apenas lint e formatação**.
- Convenção de commit: **nenhuma automação** — a mensagem é escrita pela pessoa.
  Não foi adotado commitlint.

## 10. Decisões fechadas (alternativas já descartadas)

(fonte: `docs/adr/001-stack.md`, seção "Alternativas descartadas")

Alternativas que o ADR-001 descartou, com a razão de cada uma:

- Front e API em projetos separados; REST com OpenAPI gerado; GraphQL.
- Server Actions para mutação; Server Components buscando dado direto no Prisma.
- RLS como autorização primária; acesso a dado pelo cliente do Supabase em vez do
  Prisma.
- Cadastro aberto por e-mail; SSO corporativo (OIDC/SAML); sessão em
  `localStorage` pelo `supabase-js`.
- Supabase CLI como dono das migrations; CASL ou outra biblioteca de política.
- Zustand ou Redux; biblioteca de componentes fechada (MUI, Mantine).
- Fila (BullMQ, pg-boss); schema ou banco por tenant.
- Prisma mockado nos testes.

## 11. Estado atual do repositório

Conferido na árvore de trabalho no momento em que este arquivo foi escrito:

- Conteúdo existente: `README.md` (só o título `# empresTI`), `docs/PRD.md`,
  `docs/adr/001-stack.md` e `layout.md`.
- `.env` existe mas está **vazio** (0 bytes), e `.gitignore` também está vazio.
- Não há `package.json`, `tsconfig.json`, `src/`, `prisma/` nem `.next/`: nenhum
  código de aplicação foi criado ainda.

Ou seja: as decisões do ADR-001 estão tomadas e documentadas, mas ainda não
existem scripts nem comandos para rodar. É por isso que a seção 13 começa pelos
comandos.

## 12. Checklist derivado das decisões já tomadas

Reafirmação do que está no ADR-001, útil na hora de revisar um procedimento novo:

- [ ] O procedimento está no router do domínio, em
      `src/server/api/routers/<dominio>.ts`.
- [ ] A entrada passa por Zod no `.input()`.
- [ ] A regra de negócio está no service, não no procedimento.
- [ ] O `tenant_id` vem do `createContext` (sessão), nunca do input.
- [ ] O procedimento usa um dos middlewares: `protectedProcedure`,
      `tenantProcedure` ou `adminProcedure`.
- [ ] A query filtra por `tenant_id`.
- [ ] O retorno é tipado pelo `AppRouter` — nada de interface escrita à mão nem
      de tipo duplicado em `RouterInputs`/`RouterOutputs`.
- [ ] Lista usa paginação por cursor, compatível com `useInfiniteQuery`.
- [ ] Erro sai como `TRPCError` com código.
- [ ] Existe teste de isolamento do procedimento (tenant A não vê dado de B).
- [ ] Migration com RLS/policy em SQL bruto, dentro do Prisma Migrate.
- [ ] Nada de `NEXT_PUBLIC_` com segredo e nada de `service_role` em código que o
      bundle do cliente alcança.
- [ ] Nenhum import de cliente para dentro de código de servidor (a fronteira
      servidor/cliente é fácil de cruzar por engano).

## 13. Lacunas em aberto

Os arquivos do repositório não respondem os pontos abaixo. Nada foi decidido
aqui no lugar delas; cada item é uma pergunta pendente de resposta humana.

1. **Comandos e ambiente.** Não existe `package.json`, então não há script de
   dev, build, lint, teste, migration ou seed para registrar, nem gerenciador de
   pacotes definido (npm, pnpm ou yarn), nem scaffold do Next/tRPC/Prisma no
   repositório. Falta saber onde o ambiente já configurado vive e quais comandos
   valem.
2. **Autonomia e limites de ação.** Até onde o agente pode ir sozinho: `git add`,
   `git commit`, `git push`, criar branch, abrir PR; e o que ele nunca faz sem
   pedido explícito (rodar `prisma migrate` contra banco remoto, trocar o `.env`,
   apagar arquivo, instalar dependência).
3. **Idioma e nomes no código.** Os documentos são em português do Brasil, mas o
   ADR usa nomes como `tenant_id`, `memberships` e `role` em inglês, e o
   `layout.md` define rotas em português. Falta a regra para nomes de entidade,
   model Prisma, tabela, type, componente, arquivo e mensagem de commit.
4. **Divergência com uma decisão fechada do ADR.** O que fazer quando a
   implementação esbarrar numa decisão registrada (precisar de Server Action,
   de uma biblioteca a mais, de RLS como autorização primária): parar e
   perguntar, implementar e sinalizar como desvio, ou nunca desviar.
5. **Pedido fora do escopo da v1.** Como reagir quando o pedido for reserva com
   data futura, notificação por e-mail ou importação da planilha — recusar,
   implementar mesmo assim, ou registrar para depois.
6. **Definição de "pronto".** O que precisa ser executado e mostrado antes de
   dizer que uma tarefa terminou (lint, testes, E2E, verificação no banco) e se
   a revisão vem antes ou depois do commit.
7. **Estilização.** `layout.md` §10 pede estilos inline no template, com CSS
   global restrito a `@font-face`/import, `@keyframes` e reset de `body`, e cita
   o design system Nocturne em `_ds/nocturne-<id>/styles.css` + `_ds_bundle.js`;
   o ADR-001 define Tailwind CSS + shadcn/ui. Os dois caminhos são incompatíveis
   e nenhum arquivo escolhe entre eles.


