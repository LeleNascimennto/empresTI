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

## Continuação: novo erro no deploy de Production

### Evidência
O log enviado em 10/11/2026 é de `main` no commit `805e193`, não da branch `chore/nocturne-layout-setup`. Compilação e TypeScript passaram; durante coleta de configuração de `/api/trpc/[trpc]`, Zod reportou `DATABASE_URL` e `DIRECT_URL` ausentes.

### Próxima ação
Cadastrar ambas como variáveis `Secret` no ambiente Production do Vercel, com os valores correspondentes do projeto Supabase, e iniciar novo deploy. Se também desejar testar a branch Preview, as variáveis necessárias devem existir também em Preview, usando uma base de desenvolvimento quando possível.

## Continuação: erro de diretório de saída

### Evidência
No novo log de `main`/`805e193`, Prisma Client gerou, Next compilou, TypeScript passou e as páginas foram geradas. A etapa final falhou com `[STATIC_BUILD_NO_OUT_DIR] No Output Directory named "dist" found`. `next.config.ts` define `distDir: ".next-build"`; o painel do Vercel está configurado para procurar `dist`.

### Próxima ação
Naquele momento, a hipótese era remover o override `dist` e permitir a detecção automática do Next.js. A sugestão de definir `.next-build` manualmente foi preliminar e ficou superada pelo log posterior `NEXT_OUTPUT_DIR_MISSING`.

### Status posterior
O check do PR #2 (`f37edfb`) agora está `success` e tem Preview publicado. O status do commit de Production em `main` (`805e193`) continua `failure`. Portanto, o 404 no domínio de produção pode estar ligado à implantação de produção ainda malsucedida; confirmar a URL exata do 404 antes de atribuir causa.

## Continuação: página 404 do Vercel

### Objetivo
Determinar se o 404 informado ocorre no domínio público da aplicação ou na URL de uma implantação e comparar com o status atual dos deployments.

### Escopo e restrições
- Consulta somente leitura a status GitHub/Vercel público e ao domínio conhecido `empresti-delta.vercel.app`.
- Não alterar código, variáveis, aliases, domínios ou configuração do Vercel.

### Estado
Em investigação; usuário informou `404 NOT_FOUND` com request ID `gru1::km826-1794364411399-40139e323b2c`, sem indicar a URL que exibiu a página.

## Continuação: URL publicada retorna 404

### Objetivo
Investigar o `404 NOT_FOUND` exibido na URL publicada e identificar a ação mínima para publicar a aplicação corretamente.

### Evidências
- `app/page.tsx` existe e redireciona `/` para `/login`; o projeto não está sem rota raiz.
- `next.config.ts` configura `distDir: ".next-build"` e o `package.json` executa `next build --webpack`.
- O diagnóstico anterior registrou que o build da Vercel chegou à etapa final, mas falhou procurando o diretório `dist` (`[STATIC_BUILD_NO_OUT_DIR]`).
- O erro 404 genérico, sem URL e log da implantação atual, não identifica sozinho se o alias aponta para uma implantação falha ou se a configuração mudou desde o log anterior.

### Restrição
O contrato do projeto proíbe o agente de alterar as configurações da Vercel. Não abrir nem modificar `.env`, secrets, configurações de produção ou deployments.

### Próxima ação
No projeto Vercel, conferir **Settings → Build and Deployment**: selecionar framework **Next.js**, manter o comando de build `npm run build` (ou `prisma generate && next build --webpack`) e remover o override de **Output Directory** (`dist`); deixar o Next.js detectar sua saída. Em seguida, criar um novo deployment a partir do commit que contém a correção. Se ainda falhar, usar o log desse deployment para revisar as variáveis de ambiente necessárias sem compartilhá-las publicamente.

### Estado
Diagnóstico do código concluído; correção do painel/deployment bloqueada pela regra do repositório que proíbe alterar configuração da Vercel. A spec não declara a publicação resolvida até o novo deployment passar e a URL abrir a aplicação.

## Continuação: alinhar diretório de build com Vercel

### Objetivo
Corrigir o novo erro `NEXT_OUTPUT_DIR_MISSING` no deploy, usando o diretório padrão do Next.js reconhecido pela integração da Vercel.

### Escopo
- Remover `distDir: ".next-build"` de `next.config.ts` para voltar ao padrão `.next`.
- Alinhar os caminhos gerados em `next-env.d.ts` e `tsconfig.json` ao padrão `.next`.
- Manter as configurações de projeto da Vercel sem override de Output Directory.
- Validar lint, build e diff antes de enviar a mudança em branch e abrir PR, sem deploy manual nem alteração no painel.

### Restrições
- Não alterar `main` diretamente, variáveis, domínios, secrets, configurações da Vercel ou dados remotos.
- Preservar alterações locais não relacionadas à correção e não incluir arquivos fora do escopo no PR.

### Critérios de aceite
- CA-11: a configuração Next.js usa o diretório padrão `.next`, compatível com o caminho esperado pelo adapter da Vercel.
- CA-12: lint, build e `git diff --check` passam, e a correção é publicada em branch própria para revisão via PR.

### Evidência e estado
O log mais recente, do commit `fa5671a` em `main`, detectou Next.js 16.4.6 e concluiu compilação, TypeScript e geração de rotas; falhou depois com `[NEXT_OUTPUT_DIR_MISSING]`, procurando `/vercel/path0/.next` enquanto `next.config.ts` ainda define `.next-build`. A orientação anterior de apontar Output Directory para `.next-build` não se aplica à integração detectada: deixar o override desligado e remover `distDir` permite que o Next use `.next`.

### Progresso
- [x] Confirmar causa pelo log e pela configuração local.
- [x] Remover `distDir` e deixar o build atualizar os caminhos de tipos para `.next`.
- [x] Rodar lint e build; ambos passaram. O `git diff --check` global apontou apenas whitespace preexistente em `spec/verificador-subagente.md`; validar somente os arquivos da correção.
- [ ] Commitar e enviar em branch separada; abrir PR.
