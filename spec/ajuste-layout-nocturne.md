# Spec: ajuste inicial de layout Nocturne

## Objetivo

Ajustar a base visual atual do front-end para seguir o design system Nocturne definido em `layout.md`, sem alterar a arquitetura da aplicação ou a lógica de negócio.

## Escopo

- alinhar a paleta, fontes, espaçamento e bordas do app ao design system do projeto;
- padronizar a tela de login com o hero esquerdo e formulário direito do layout previsto;
- padronizar o shell de telas autenticadas com sidebar fixa e área principal;
- manter a estrutura funcional atual enquanto a visualização passa a seguir o sistema visual do projeto.

## Restrições

- não criar regra de negócio nova;
- não alterar o contrato de autenticação ou de API;
- não mexer em banco, migration, seed ou Supabase remoto;
- priorizar a consistência visual do layout sem alterar rota, comportamento ou fluxo já existente.

## Critérios de aceite

- a aplicação usa fundo escuro, superfície e bordas alinhados ao Nocturne;
- a tela de login mantém hero à esquerda e formulário à direita, com cores e espaçamento do layout;
- telas autenticadas usam sidebar fixa e área principal com estrutura de layout do app;
- botões e inputs seguem o padrão contornado, com tokens do design system;
- a identidade visual é consistente entre login e páginas internas placeholder.

## Tarefas

1. revisar o layout atual e comparar com o padrão definido em `layout.md`;
2. ajustar o CSS base global para tokens do Nocturne;
3. padronizar o shell das telas autenticadas com sidebar e header;
4. revisar o formulário de login e componentes de ação para acompanhar a visualização.

## Evidência de conclusão

A spec está concluída quando o front-end exibe a base visual Nocturne atualizada em login e shell das telas internas, e a aplicação continua compilando sem quebrar o fluxo atual.
