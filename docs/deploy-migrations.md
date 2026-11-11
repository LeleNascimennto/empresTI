# Aplicar migrations Prisma no Supabase

O workflow `.github/workflows/prisma-migrations.yml` executa migrations pelo
Prisma Migrate. Ele aplica todas as migrations pendentes em ordem, incluindo a
schema inicial antes das mudanças subsequentes.

## Configuração única no GitHub

1. Abra o repositório no GitHub e vá para **Settings → Secrets and variables →
   Actions → New repository secret**.
2. Crie o segredo `DIRECT_URL` com a URI **Session pooler** do Supabase, porta
   `5432`, copiada em **Supabase → Connect → Session pooler**. Esse endpoint
   funciona em redes IPv4. Use o usuário e host mostrados pelo Supabase; o
   usuário costuma incluir o identificador do
   projeto. Não use o pooler **Transaction** da porta `6543`. Não inclua a URI
   em arquivos, issues ou logs.
3. Se o ambiente `production` do repositório exigir aprovação, configure seus
   revisores em **Settings → Environments → production**.

## Executar

1. Envie o workflow para a branch `main`.
2. No GitHub, abra **Actions → Prisma migrations to Supabase → Run workflow**.
3. Selecione `main`, marque a confirmação de produção e inicie.
4. Espere a execução terminar com sucesso antes de publicar código que dependa
   das novas tabelas.

O workflow não executa seed nem grava registros de equipamentos. Se uma
migration falhar, corrija a causa e crie uma nova execução; não aplique o SQL
manualmente nem marque migrations como aplicadas sem confirmar o estado do
banco.

Se o log mostrar `P1001` para `db.<ref>.supabase.co:5432`, o runner não
alcançou o endpoint direto, que usa IPv6 sem o adicional de IPv4. Confira se
`DIRECT_URL` usa a URI **Session pooler** na porta `5432` e execute novamente.
O nome `DIRECT_URL` corresponde
ao campo `directUrl` do Prisma; a conexão pode passar pelo pooler em modo
sessão quando a rede do CI exige IPv4.
