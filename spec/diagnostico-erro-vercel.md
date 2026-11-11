# Spec: diagnóstico do erro no Vercel

## Objetivo
Identificar a causa do erro observado no projeto EmpresTI publicado no Vercel e indicar a correção necessária.

## Escopo
- Revisar somente fontes disponíveis no repositório, GitHub e URL pública informada/contextual.
- Comparar comandos e requisitos de build do repositório com a configuração declarada do deploy.
- Consultar logs de deploy se houver acesso disponível.

## Restrições
- Diagnóstico somente leitura: não fazer deploy, não alterar configuração do Vercel, secrets, dados ou branch remota.
- Não presumir que o ambiente de produção usa o `.env` local.
- Diferenciar erro comprovado de hipótese quando os logs não estiverem acessíveis.

## Critérios de aceite
- Registrar evidência observável do erro ou indicar precisamente a falta de acesso aos logs.
- Identificar a causa com arquivo/linha ou log correspondente quando disponível.
- Fornecer próximos passos específicos, sem aplicar alterações de produção.

## Estado
Concluída em 10/11/2026 após análise do log fornecido pelo usuário. Build do Vercel falhou ao coletar configuração da rota `/api/auth/login`: Zod recebeu `undefined` para `NEXT_PUBLIC_SUPABASE_URL` (`src/lib/supabase/config.ts`). Correção: configurar essa variável no ambiente Vercel da implantação, junto de `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e criar nova implantação. Nenhuma configuração do Vercel ou arquivo de ambiente foi alterado pelo agente.

## Continuação: revisar branch `chore/nocturne-layout-setup`

### Objetivo
Verificar se a falha atual do deployment Preview decorre de erro nos commits da branch ou apenas da configuração de ambiente Preview.

### Escopo e critérios
- Comparar head da branch com `main` e inspecionar checks/arquivos relevantes ao build.
- Separar evidência de erro do código de variáveis ausentes no ambiente Preview.
- Não alterar branch, variáveis do Vercel, nem fazer deploy.

### Estado
Concluída em 10/11/2026. O PR #2 (`6f39a896`) está aberto contra `main` (`805e193`). A comparação mostra seis arquivos alterados, todos de inicialização/validação Supabase/Prisma; sem mudanças de UI, dependências, build script ou schema. Typecheck e lint passam localmente. Achado: `getEnv()` é declarado em `src/env.ts`, mas não tem chamadas no repositório; a branch remove a única chamada/importação de `src/server/db.ts`, deixando `DATABASE_URL` e `DIRECT_URL` sem validação Zod no fluxo da aplicação. A tela/check do Vercel confirma falha no Preview atual, mas os logs da revisão do PR não estão expostos pelo GitHub; a falha exata do head `6f39a896` ainda precisa ser confirmada com `npx vercel inspect dpl_8jsVdYMCmzE22mR9LQQ9sfHPme5D --logs`. O log anteriormente enviado corresponde ao commit anterior `f39a2ed` e mostrava ausência de `NEXT_PUBLIC_SUPABASE_URL` no Preview.

## Continuação: corrigir validação lazy e enviar para branch do PR #2

### Objetivo
Restaurar a validação Zod de `DATABASE_URL` e `DIRECT_URL` no primeiro uso da API/Prisma em runtime, mantendo o build independente de variáveis que só existem no ambiente do deploy.

### Escopo e restrições
- Alterar apenas a validação de ambiente e o contexto tRPC que inicia acesso ao Prisma.
- Não mudar UI, dependências, schema, migrations, `.env`, configuração Vercel ou dados remotos.
- Validar typecheck, lint, build e `git diff --check`; não executar testes.
- Fazer commit e push somente para a branch `chore/nocturne-layout-setup` já ligada ao PR #2; não tocar em `main`.

### Critérios de aceite
- CA-09: `getEnv()` tem uso real em runtime antes de qualquer query Prisma pelo tRPC, sem validação eager ao importar módulos durante o build.
- CA-10: checks aplicáveis passam e as mudanças são enviadas para a branch do PR #2.

### Estado
Implementada e validada localmente em 10/11/2026. `createTRPCContext()` chama `getEnv()` somente para usuário autenticado e antes de consultar `memberships`; importação de módulos continua sem validação eager. Typecheck, lint, build e `git diff --check` passaram. Testes não executados conforme escopo. Correção enviada para `chore/nocturne-layout-setup` no commit `0c1376a`; verificação Vercel iniciada e ainda pendente.

## Continuação: alinhar diretório de build com Vercel

### Objetivo
Corrigir o erro `NEXT_OUTPUT_DIR_MISSING` observado após a Vercel detectar Next.js, usando o diretório padrão de build reconhecido pela integração.

### Escopo
- Remover `distDir: ".next-build"` de `next.config.ts` para usar `.next`.
- Alinhar os caminhos de tipos em `next-env.d.ts` e `tsconfig.json` a `.next`.
- Não alterar configurações, variáveis, domínios ou deployments no painel da Vercel.
- Validar lint, typecheck, build e diff; executar testes disponíveis e registrar resultados; publicar em branch separada para revisão por PR.

### Restrições
- Não tocar diretamente em `main`.
- Não incluir arquivos ou alterações locais fora do escopo.

### Critérios de aceite
- CA-11: o Next.js gera a saída em `.next`, consistente com o caminho esperado pela Vercel.
- CA-12: checks aplicáveis passam e a alteração é publicada em branch própria com PR para `main`.

### Evidência
O log de `main` no commit `fa5671a` detectou Next.js 16.4.6, concluiu compilação, TypeScript e geração de rotas, mas terminou com `[NEXT_OUTPUT_DIR_MISSING]`, procurando `/vercel/path0/.next` enquanto `next.config.ts` definia `.next-build`.

### Progresso
- [x] Confirmar causa pelo log e configuração.
- [x] Remover o diretório customizado e alinhar referências TypeScript.
- [x] Build, lint e typecheck locais passaram.
- [x] Suíte completa no checkout original falhou somente nos dois casos da fixture local não versionada `src/test/verifier-proof/catalog.test.ts`, que verifica deliberadamente um erro plantado fora do escopo. Ao excluir essa fixture, Vitest não encontrou outros testes e saiu com código 0. A fixture não faz parte desta branch.
- [ ] Revisar o diff, enviar branch e abrir PR.
