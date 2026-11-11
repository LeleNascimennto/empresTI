# Spec: demonstração sem banco

## Objetivo

Permitir apresentar o catálogo e o fluxo básico de empréstimo quando a
conexão de migration ao Supabase ainda não estiver operacional.

## Escopo

- Rota separada `/demo`, com dados fictícios e aviso visível de demonstração.
- Entrada aceita e-mail no formato `nome.sobrenome@institutojef.org.br` e a
  senha informada pela usuária para a demonstração. A sessão dura apenas
  enquanto a página permanece aberta.
- Mostrar os 12 equipamentos aprovados, manutenção em TI-0004, TI-0007 e
  TI-0010, limite de cinco pedidos/itens ativos, pedido pendente, confirmação,
  cancelamento e devolução simulados localmente.
- Preservar o visual Nocturne e a responsividade.

## Restrições

- A rota não cria sessão Supabase, não chama tRPC, não lê nem grava banco, não
  concede acesso às rotas reais e não usa credenciais de produção.
- Os dados e movimentos desaparecem ao recarregar a página; a interface deve
  deixar isso claro. Nunca apresentar a rota como login real.
- Sem imagens Pixabay enquanto a chave local e as fotos revisadas não estiverem
  disponíveis.

## Critérios de aceite

- Acesso apenas após e-mail no formato pedido e senha de demonstração.
- Nenhuma integração com Supabase, Prisma ou tRPC.
- Fluxos simulados funcionam nos 12 equipamentos sem solicitar manutenção.
- Build e lint passam; rota real de login permanece independente.
