# Spec: layout responsivo à viewport

## Objetivo

Fazer as telas existentes do protótipo EmpresTI ocuparem pelo menos a altura
disponível da tela e se adaptarem a larguras menores, sem cortar conteúdo.

## Escopo

- Ajustar as telas de acesso e catálogo em `styles.css`.
- Manter o design system Nocturne e os conteúdos atuais.
- Adaptar a navegação lateral e a barra superior para telas menores.
- Permitir rolagem vertical quando o conteúdo exceder a viewport e evitar
  rolagem horizontal da página.

## Restrições

- Não alterar rotas, conteúdo de negócio, autenticação ou dependências.
- Não fixar a altura do documento quando houver conteúdo maior que a tela.
- Preservar a navegação e leitura em viewports estreitas, sem ocultar conteúdo
  necessário.

## Critérios de aceite

1. As telas ocupam pelo menos a altura da viewport, incluindo viewports móveis.
2. Conteúdo maior que a viewport continua alcançável por rolagem vertical.
3. A navegação e a barra superior se reorganizam em larguras menores sem
   sobreposição ou corte das ações.
4. Espaçamentos e títulos principais se ajustam progressivamente à largura
   disponível, mantendo o estilo existente.
5. O conteúdo não cria rolagem horizontal global em larguras de 320px ou mais.
6. `git diff --check` passa e somente arquivos do escopo são alterados.

## Tarefas

1. Ajustar o shell e a rolagem em telas grandes e pequenas.
2. Tornar navegação, barra superior, cards e tipografia adaptáveis.
3. Revisar o diff e validar a folha em viewports representativas.
