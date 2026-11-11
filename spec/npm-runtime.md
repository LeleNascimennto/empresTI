# Spec: runtime npm para executar o projeto

## Objetivo
Tornar os comandos npm do projeto executáveis neste ambiente, preservando as
dependências e scripts já declarados.

## Diagnóstico
O PowerShell não encontra `node` nem `npm`. Também não há executáveis Node.js
nos caminhos padrão verificados. O `package.json`, o `package-lock.json` e
`node_modules` existem; portanto, o bloqueio observado é a ausência do runtime
Node.js acessível, não um erro demonstrado nos scripts npm.

## Escopo
- Habilitar um runtime Node.js compatível com Next.js 16 (Node.js >=20.9).
- Revalidar `node --version`, `npm --version` e a execução dos scripts atuais.
- Não alterar dependências, lockfile, `.env`, scripts ou configuração do projeto
  sem evidência de falha adicional.

## Restrições
- Não ler nem modificar `.env`.
- Não atualizar ou instalar dependências do projeto sem aprovação.
- Não sobrescrever alterações preexistentes em `package.json` e
  `package-lock.json`.

## Critérios de aceite
- CA-01: `node` e `npm` ficam disponíveis no terminal.
- CA-02: testes, lint e build existentes podem ser executados e seus resultados
  são reportados sem ocultar falhas.
- CA-03: nenhuma alteração fora do escopo ou exposição de segredos ocorre.

## Validação
- Verificar versões de Node.js e npm.
- Executar `npm test`, `npm run lint` e `npm run build`.
- Conferir `git status --short` e garantir que `.env` não foi incluído.

## Estado
Node.js 22.22.0 foi instalado para o usuário com winget, e o PATH de usuário
foi atualizado. Confirmados `node --version`, `npm --version` e `npm run`;
`npm test`, `npm run lint`, `npm run typecheck`, `npm run build` e
`git diff --check` passaram. O Vitest não encontrou arquivos de teste e
terminou com sucesso por causa de `--passWithNoTests`. `npm run dev` mostrou o
servidor pronto, mas a primeira requisição HTTP ficou aguardando a compilação
de `/page` por mais de dois minutos; o processo de teste foi encerrado.

O worktree já estava modificado antes desta tarefa (`.gitignore`,
`package.json`, `package-lock.json`, scaffold e outras specs); essas alterações
foram preservadas. Esta tarefa acrescentou apenas esta spec ao repositório e
instalou o runtime no perfil do usuário. O verificador formal retornou
`NÃO PRONTA`: a checagem de CA-01 usou um shell que não herdou o PATH de usuário
atualizado, CA-03 atribuiu ao trabalho alterações que já constavam no estado
inicial, e a revisão exige testes automatizados que citem cada CA, embora esta
seja uma configuração local do runtime.

Como o terminal do VS Code pode manter o PATH antigo, reinicie o VS Code para
que novos terminais herdem o PATH atualizado.
