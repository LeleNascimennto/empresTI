---
description: Contrato de operacao entre mim e o agente neste projeto
globs: []
alwaysApply: true
---

# Contrato de operação

## Git
> leitor: agente

Git, commits, branches, push e deploy seguem [AGENTS.md](../AGENTS.md) e
[rules/spec-flow.md](spec-flow.md). Este arquivo não substitui essas regras:
o agente não cria commit nem faz push sem solicitação explícita.

## Migrations no Supabase de produção
> leitor: agente

- Aplicar migrations exclusivamente pelo workflow
  `.github/workflows/prisma-migrations.yml`, que executa
  `npx prisma migrate deploy` na branch `main`.
- O workflow usa o segredo GitHub `DIRECT_URL` na porta 5432. No runner sem
  acesso IPv6, usar a URI **Session pooler** do mesmo projeto; ela ocupa o
  campo `directUrl` do Prisma. Nunca copiar o segredo para arquivos, mensagens
  ou logs.
- Rodar manualmente em **Actions → Prisma migrations to Supabase** e marcar a
  confirmação de produção. Esperar o sucesso da migration antes de publicar
  código dependente do schema.
- Não aplicar `migration.sql` pelo conector Supabase, CLI Supabase ou SQL Editor;
  Prisma Migrate continua sendo o dono do schema.

## Autorização por tipo de ação
> leitor: agente

| ação                                        | nível          |
|---------------------------------------------|----------------|
| Editar arquivo existente dentro do escopo da tarefa | livre          |
| Criar arquivo novo                          | avisar depois  |
| Deletar ou renomear arquivo                 | pedir antes    |
| Instalar ou atualizar dependência           | pedir antes    |
| Criar ou alterar migration                  | pedir antes    |
| Alterar configurações e variáveis de ambiente | livre          |

O que cada nível significa:
- livre — faça e siga em frente.
- avisar depois — faça e me diga na resposta o que fez.
- pedir antes — descreva o que pretende fazer e PARE.
- proibido — não faça, mesmo que eu peça no meio de uma tarefa.
  Se eu pedir, me lembre desta linha.

## Configuração do operador
> leitor: humano — isto não é instrução para o agente

| fase                              | modelo / raciocínio |
|-----------------------------------|---------------------|
| Escrever a spec                   | raciocínio alto     |
| Planejar e quebrar em tarefas     | raciocínio alto     |
| Executar uma tarefa já decidida   | rápido              |
| Debugar algo que quebrou          | raciocínio alto     |
| Revisar o diff antes do commit    | padrão              |

- Revisão de diff acontece em sessão limpa, de preferência com
  modelo diferente do que escreveu o código.
- Sessão longa não se corrige com regra mais enfática: encerre seguindo
  [handoff/handoff.md](../handoff/handoff.md), somente depois de perguntar ao
  usuário se ele deseja que um handoff seja criado ou atualizado, e abra outra.