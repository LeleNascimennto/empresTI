# Spec: scaffold da aplicação EmpresTI

## Objetivo
Preparar o repositório existente para iniciar a aplicação EmpresTI conforme o ADR-001, sem ainda implementar fluxos de negócio.

## Contexto
O repositório contém Prisma e protótipo estático, mas não possui Next.js, `src/`, rotas App Router, integração tRPC ou cliente SSR do Supabase. O ADR define monólito Next.js, TypeScript strict, tRPC, Prisma, TanStack Query, Supabase Auth com `@supabase/ssr` e Tailwind/shadcn.

## Escopo proposto
- Configuração mínima do Next.js App Router e TypeScript strict, com scripts de desenvolvimento, lint e build.
- Estrutura `app/` e `src/` conforme AGENTS.md, incluindo página inicial neutra e rotas-base sem lógica de produto.
- Inicialização tRPC, endpoint Route Handler e `AppRouter` vazio tipado.
- Singleton Prisma preservando schema e seed existentes.
- Clientes Supabase browser/server e renovação de sessão SSR conforme documentação atual.
- Validação tipada das variáveis existentes, sem editar `.env`, `.env.example`, Vercel ou banco remoto.
- Estilo global mínimo compatível com Nocturne, sem entregar telas ou fluxos de produto.

## Arquivos previstos
- `package.json` e `package-lock.json` — dependências fixas e scripts do app.
- `.gitignore`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts` e setup de teste.
- `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `app/globals.css` e `app/api/trpc/[trpc]/route.ts`.
- `proxy.ts` e `src/lib/supabase/{client,server,proxy,config}.ts`.
- `src/env.ts`, `src/server/db.ts` e `src/server/api/{trpc,root}.ts`.
- `src/trpc/{client,provider}.tsx` e `src/components/placeholder-page.tsx`.
- Páginas provisórias para `/catalogo`, `/catalogo/[patrimonio]`, `/meus-emprestimos`, `/operacoes/emprestimos` e `/operacoes/equipamentos/novo`.

## Dependências autorizadas (versões consultadas em 10/11/2026)
- Runtime: `next@16.4.6`, `react@19.3.1`, `react-dom@19.3.1`, `@supabase/ssr@0.12.7`, `@supabase/supabase-js@2.119.0`, `@trpc/{server,client,react-query}@11.26.0`, `@tanstack/react-query@5.107.1`, `zod@4.6.7`, `superjson@2.2.6`, `react-hook-form@7.91.0`, `@hookform/resolvers@7.0.5`, `@phosphor-icons/web@2.1.2`, `server-only@0.0.1`, mantendo `@prisma/client@6.19.3`.
- Desenvolvimento: `typescript@6.0.3`, `eslint@9.39.5`, `eslint-config-next@16.4.6`, `tailwindcss@4.3.5`, `@tailwindcss/postcss@4.3.5`, `vitest@5.1.0`, `vite@8.3.7`, `@vitejs/plugin-react@6.3.0`, `jsdom@31.0.0`, `@testing-library/react@16.3.3`, `@testing-library/jest-dom@7.0.1`, `@testing-library/user-event@14.6.9`, `@testcontainers/postgresql@12.2.1`, `@playwright/test@1.65.0`, `@types/node@26.6.6`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`, mantendo `prisma@6.19.3`.

## Fora de escopo
- Login funcional, catálogo, empréstimos, operações, autorização de tenant e dados de exemplo.
- Alteração de schema ou migrations, configuração Vercel, instalação de CLI global e escrita no Supabase.
- Remover/renomear `index.html`, `styles.css` ou demais arquivos atuais.
- Executar testes nesta entrega: não foi solicitada implementação de testes; a infraestrutura fica configurada para etapas futuras.

## Restrições e dependências
- Preservar ADR-001 e as regras de tenant, segredos, Prisma Migrate e Supabase Auth.
- Usar Webpack nos scripts de desenvolvimento e build: o Turbopack encerrou um processo filho sem compilar CSS neste ambiente; o build com Webpack concluiu.
- O tRPC ADR especifica `@trpc/react-query`; a documentação atual marca essa integração como deprecated e recomenda `@trpc/tanstack-react-query`. Esta tarefa seguirá o ADR vigente, sem trocar a biblioteca nem escrever ADR.
- O ambiente atual tem `.env` local com chave publishable, enquanto `.env.example` lista a chave anon legada. O código deverá aceitar a chave publishable e compatibilidade com a anon; arquivos/configuração de ambiente não serão alterados nesta tarefa.
- A instalação necessária inclui Next.js, React, TypeScript, Tailwind/PostCSS, ESLint, tRPC, TanStack Query, Zod, superjson, `@supabase/ssr` e `@supabase/supabase-js`; instalar/atualizar dependências requer aprovação antes.

## Critérios de aceite
- CA-01: a árvore básica de App Router e `src/` corresponde à organização alvo do AGENTS.md.
- CA-02: endpoint tRPC usa Route Handler e exporta `AppRouter`; nenhum procedimento de domínio ou resposta manual duplicada é criado.
- CA-03: Prisma permanece singleton server-only e schema/migrations/seed não são alterados.
- CA-04: cliente Supabase SSR separa browser e server, usa chave publicável/anon e renova sessão sem expor segredo.
- CA-05: não há fluxo de negócio, escrita remota, segredo em arquivos versionados ou dependência fora do ADR.
- CA-06: dependências instaladas; typecheck, lint, build e `git diff --check` passam. A suíte de testes fica configurada, mas não é executada nesta entrega.

## Validações
- Revisão do diff e `git status --short`.
- Typecheck, lint e build após instalação autorizada; `npm test` não executado nesta solicitação.
- Nenhuma migration reset ou conexão de escrita remota.

## Estado
Concluída em 10/11/2026. O usuário autorizou a inclusão e instalação das dependências necessárias. Build, typecheck, lint e `git diff --check` validados; testes não executados nesta solicitação.

## Continuação: conexão runtime na porta 5432

### Objetivo e escopo
Alinhar a validação de `DATABASE_URL` às portas válidas do Supabase indicadas pelo usuário. O `.env` local está configurado em 6543 (pooler em modo transação); 5432 é válido para conexão direta ou pooler em modo sessão. Aceitar ambas sem alterar valores locais do `.env`, migrations, schema ou dados remotos.

### Critérios de aceite
- CA-07: `DATABASE_URL` aceita PostgreSQL nas portas 5432 e 6543 e rejeita portas diferentes com mensagem apropriada.
- CA-08: typecheck, lint e build continuam passando; a divergência com ADR-001 fica registrada sem alterar a decisão arquitetural.

### Restrição
O ADR-001 ainda especifica Supavisor na porta 6543 para runtime. Não editar o ADR nesta alteração; informar a divergência para o time decidir se atualiza formalmente a decisão arquitetural.

### Estado da continuação
Concluída: validação suporta portas 5432 e 6543; `.env` permaneceu intacto. Typecheck, lint e build passaram. A URL local usa 6543, portanto a aplicação continuará conectando por essa porta enquanto esse valor permanecer no `.env`; para usar 5432, o time deverá fornecer a string correspondente nessa variável. O ADR-001 ainda registra 6543 como runtime.
