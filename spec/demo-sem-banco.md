# Spec: demonstração sem banco

## Imagens aprovadas — 16/11/2026

A usuária aprovou as 12 fotos Pixabay e autorizou sua publicação no Supabase.
O catálogo da demonstração mostra os JPEGs do bucket público
`equipment-images`, usando `NEXT_PUBLIC_SUPABASE_URL` e o patrimônio para
formar a URL. Os pedidos da rota `/demo` continuam somente em memória, sem
autenticação ou mutação de dados reais. Se a URL pública não estiver disponível,
o cartão mantém um estado textual de imagem indisponível.

Aceite: cada um dos 12 cartões usa a foto correspondente, o layout Nocturne e
os fluxos fictícios permanecem; nenhum segredo ou chave de serviço é enviado
ao cliente.

## Objetivo

Permitir apresentar o catálogo e o fluxo básico de empréstimo sem depender de
uma conta real de demonstração.

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
- Exibir somente os arquivos já aprovados do bucket público; nenhuma chave de
  serviço ou consulta de dados do Supabase é usada pela rota.

## Critérios de aceite

- Acesso apenas após e-mail no formato pedido e senha de demonstração.
- Nenhuma integração com Supabase Auth, banco, Prisma ou tRPC; apenas imagens
  públicas do Storage.
- Fluxos simulados funcionam nos 12 equipamentos sem solicitar manutenção.
- Build e lint passam; rota real de login permanece independente.
