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

## Incidente de conectividade — execução 42995051030

O job chegou a `prisma migrate deploy`, mas falhou com `P1001` ao tentar o
endpoint `db.<ref>.supabase.co:5432`. O aviso do runner Ubuntu não causou a
falha. O endpoint direto do Supabase usa IPv6 no plano sem IPv4 adicional.
Para CI sem acesso IPv6, o segredo `DIRECT_URL` pode receber a URI **Session
pooler** do mesmo projeto na porta 5432. O campo Prisma continua sendo
`directUrl`, e as migrations continuam pelo Prisma Migrate. Não usar o pooler
Transaction da porta 6543 para migrations. A correção exige que a usuária
substitua o segredo no GitHub sem publicar seu valor.
