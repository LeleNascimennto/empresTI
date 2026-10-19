# Spec: revisão do protótipo de login e catálogo

## Objetivo

Revisar os textos e o acabamento visual do protótipo estático do EmpresTI,
mantendo a linguagem operacional em português BR e alinhando cores e medidas
com o Nocturne definido em `layout.md` e no ADR-002.

## Escopo

- Revisar títulos, descrições, rótulos e mensagens em `index.html` para que
  sejam consistentes, claros e operacionais.
- Manter as telas de login e catálogo como demonstração estática: o botão
  "Entrar" apenas navega ao catálogo e não autentica nem envia credenciais.
- Substituir o símbolo atual da marca por um ícone de computador integrado ao
  estilo visual existente.
- Ajustar `styles.css` para usar tokens CSS coerentes com a paleta Nocturne,
  preservando o layout existente e refinando legibilidade e responsividade.

## Restrições

- Não implementar autenticação, JavaScript, API, banco, rotas reais, busca ou
  ações de negócio além da navegação demonstrativa do botão "Entrar".
- A navegação demonstrativa não deve enviar valores de e-mail ou senha na URL
  nem para um servidor.
- Não criar dados sensíveis nem alterar schema/configuração do projeto.
- Não adicionar dependências, imagens ou ilustrações nesta revisão.
- Preservar o conteúdo demonstrativo e os exemplos de empréstimos existentes,
  sem sugerir que os dados sejam dinâmicos.
- Usar português BR e seguir ADR-002: modo escuro, tokens centralizados,
  sidebar de 236px, botões contornados e espaçamento por gap.

## Critérios de aceite

- Textos visíveis estão em português BR, consistentes e sem prometer ações que
  o protótipo não executa.
- Acionar "Entrar" leva à tela inicial do catálogo; isso não autentica nem
  transmite e-mail ou senha.
- O ícone da marca representa um computador e tem nome acessível pela marca.
- Cores e valores visuais recorrentes são expressos por tokens CSS; os
  componentes mantêm o modo escuro e os botões contornados do Nocturne.
- As telas preservam navegação, resumo e conteúdo do protótipo e continuam
  legíveis em viewport estreita, sem rolagem horizontal.
- `git diff --check` não aponta erros.
