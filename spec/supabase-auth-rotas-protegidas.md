# Spec — Supabase Auth e rotas protegidas

## Objetivo
Completar a autenticação Supabase por e-mail e senha e proteger as rotas autenticadas do app Next.js.

## Escopo
- Reutilizar o scaffold Next.js, `@supabase/ssr` e `@supabase/supabase-js` já presentes.
- Manter renovação de sessão no `proxy.ts` e proteger o grupo `app/(app)` no servidor.
- Implementar login e logout por Route Handlers com cookies `httpOnly`.
- Preservar `/login` como rota pública; não oferecer cadastro aberto (convites são geridos no Supabase).

## Restrições
- Seguir ADR-001, PRD v1 e Nocturne em `layout.md`.
- Não alterar `.env`, `.env.example`, configuração do operador, dependências, schema ou dados remotos.
- Nenhum token de sessão pode ser exposto ao JavaScript.

## Critérios de aceite
1. Requisições sem sessão às rotas do grupo `(app)` redirecionam para `/login`.
2. `/login` permanece pública e uma sessão válida redireciona para `/catalogo`.
3. Login e logout usam Supabase Auth e gravam/limpam cookies `httpOnly`, `sameSite=lax` e `secure` em produção.
4. Não há fluxo de signup público; erros de login têm mensagem operacional em português.
5. Lint e build passam; nenhum segredo novo aparece no diff.

## Validações
`npm run lint`, `npm run build` e revisão de `git diff --check`/`git status --short`.

## Riscos / dependências
A configuração pública do Supabase já é lida por `src/lib/supabase/config.ts`; os valores precisam estar configurados no ambiente pelo operador. A configuração `.env` não será editada nesta tarefa.
