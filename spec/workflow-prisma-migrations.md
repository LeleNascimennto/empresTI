# Spec: workflow de migrations Prisma no Supabase

## Objetivo

Permitir aplicar migrations pendentes do Prisma ao banco Supabase de produção
por GitHub Actions, sem executar SQL avulso nem usar Supabase CLI como dono do
schema.

## Escopo

- Criar workflow manual de GitHub Actions, selecionável somente na branch
  `main`, com confirmação explícita antes de tocar produção.
- Instalar dependências pelo `package-lock.json` e executar
  `npx prisma migrate deploy` usando segredo `DIRECT_URL` (conexão direta,
  porta 5432); fornecer também `DATABASE_URL` no processo para resolver o
  schema Prisma sem depender de segredo de pooler.
- Aplicar todas as migrations pendentes em ordem timestamp: schema inicial e
  depois alterações de empréstimos/imagens.
- Serializar execuções concorrentes e não imprimir URLs/segredos nos logs.

## Fora de escopo

- Alterar dados, seed, Storage, Auth ou políticas da Vercel.
- SQL executado por `supabase_apply_migration`, Supabase CLI ou editor SQL.
- Disparo automático paralelo ao deploy da Vercel; a execução deve ocorrer
  antes da publicação de código que dependa das novas tabelas.

## Critérios de aceite

- CA-WF-01: workflow usa `workflow_dispatch`, valida `main` e exige confirmação.
- CA-WF-02: usa somente Prisma Migrate e segredo `DIRECT_URL`.
- CA-WF-03: usa lockfile, serializa execuções e aplica migrations em ordem.
- CA-WF-04: documentação lista o segredo e o passo para iniciar a ação.
- CA-WF-05: workflow validado por inspeção/YAML; não executar produção sem
  autorização separada para acionar a ação.
