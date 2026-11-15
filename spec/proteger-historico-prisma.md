# Proteger o histórico de migrations Prisma

## Objetivo

Impedir que papéis públicos da API do Supabase leiam ou alterem
`public._prisma_migrations`, sem interromper `prisma migrate deploy`.

## Escopo e decisão aprovada

Em 15/11/2026 a consulta remota confirmou RLS desligado e privilégios
SELECT, INSERT e UPDATE para `anon` e `authenticated`. A usuária aprovou
preparar uma migration Prisma nova com:

```sql
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public._prisma_migrations FROM anon, authenticated;
```

Em PostgreSQL local puro esses papéis não existem. A migration verifica a
existência de cada papel antes de executar o `REVOKE`; no Supabase, ambos
existem e recebem exatamente a revogação aprovada.

Nenhuma policy para papéis de aplicação: a tabela é metadado interno do Prisma.
As duas linhas existentes permanecem intactas. O comando de migration usa a
conexão de proprietário configurada no GitHub Actions.

## Restrições

- Não editar migrations já aplicadas.
- Não executar SQL direto no Supabase ou aplicar a migration remota pelo agente.
- Nenhuma mudança em tabelas de domínio, Auth, interface ou segredos.

## Critérios de aceite

- CA1: migration nova contém apenas o DDL aprovado e condicionais para papéis
  ausentes no PostgreSQL local.
- CA2: reset local aplica as migrations do zero e `migrate deploy` continua
  funcional para o proprietário.
- CA3: `anon` e `authenticated` não possuem privilégios sobre a tabela após
  aplicação; RLS está habilitado.
- CA4: testes, lint e build passam; sem `.env` versionado.
- CA5: revisão pelo verificador antes de declarar pronta.

## Validação

Executar localmente em PostgreSQL descartável. Após merge, a usuária executa
o workflow na `main` e verifica RLS e privilégios no Supabase por leitura.
