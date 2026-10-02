# ADR-002: Design System

## Status

Aceito

## Contexto

`layout.md` define a linguagem visual Nocturne adaptada à marca EmpresTI: modo
escuro, paleta azul-marinho, tipografia Open Sans, ícones Phosphor, layouts
densos e controles com medidas e estados especificados. Essa especificação
visual deve ser preservada na implementação das seis telas da v1.

Há uma divergência de implementação: a seção 10 de `layout.md` pede estilos
inline e carregamento do bundle Nocturne, enquanto o ADR-001 define Tailwind CSS
e shadcn/ui e exige CSP restritiva sem `unsafe-inline`. Adotar literalmente os
estilos inline entraria em conflito com a CSP; carregar outro bundle de estilos
em runtime criaria um caminho de estilização paralelo ao stack já escolhido.

## Decisão

- Nocturne adaptado é a linguagem visual canônica do produto. Cores, tipografia,
  densidade, espaçamento, raios, componentes, navegação, estados, animações e
  exemplos visuais seguem `layout.md`.
- Tailwind CSS continua sendo a implementação de estilos, e shadcn/ui continua
  sendo a base dos componentes, conforme ADR-001. Os componentes shadcn/ui devem
  ser adaptados aos tokens e variantes EmpresTI; não se introduz uma biblioteca
  visual adicional.
- Os tokens de cor e os valores de tema de `layout.md` devem ser centralizados
  como variáveis CSS e integrados ao tema do Tailwind/shadcn.ui. CSS global pode
  conter esses tokens, as diretivas necessárias ao Tailwind e estilos base
  compartilhados.
- O trecho da seção 10 de `layout.md` sobre estilos inline, `_ds/nocturne-<id>` e
  `_ds_bundle.js` descreve a referência de protótipo, não a arquitetura de
  runtime do aplicativo. A implementação não usa atributos `style` nem carrega
  esse bundle em runtime. A CSP permanece sem `unsafe-inline`.
- A interface é somente modo escuro, sem alternador de tema. A primária
  `#001449` é reservada a fundos profundos; `#5B7FE0` é a cor de ação visível.
  Botões primários são contornados, não preenchidos com cor sólida.
- A tipografia é Open Sans nos pesos definidos em `layout.md`; títulos não usam
  peso 700. Ícones são Phosphor nos pesos regular e fill conforme o estado.
  Carregamento de fontes e ícones deve respeitar a CSP, sem enfraquecê-la para
  permitir estilos inline.
- Animações seguem os tempos de `layout.md`, limitados a 240 ms, e respeitam
  `prefers-reduced-motion`. Foco de teclado deve permanecer visível.
- Texto da interface permanece em português do Brasil, com tom operacional e
  datas no formato `dd/mmm`, conforme `layout.md`.

## Justificativa

- Separar linguagem visual de mecanismo de estilo conserva a especificação do
  layout sem introduzir um segundo sistema de componentes ou enfraquecer a CSP.
- Tailwind permite centralizar os tokens e reproduzir as medidas do layout; os
  componentes shadcn/ui copiados para o repositório podem receber as variantes
  necessárias sem uma dependência visual fechada.
- A especificação explícita dos estados de disponibilidade, empréstimo,
  manutenção e atraso mantém os sinais operacionais consistentes entre catálogo,
  empréstimos e telas de Operações.

## Alternativas descartadas

- **Usar estilos inline e carregar o bundle Nocturne em runtime** — conflita com
  a CSP sem `unsafe-inline` e mantém um caminho de estilos separado do Tailwind.
- **Trocar Tailwind/shadcn.ui por outro framework de componentes** — contradiz o
  ADR-001 e adiciona dependência sem necessidade para reproduzir o layout.
- **Usar os componentes shadcn/ui sem adaptação** — não atende às cores,
  dimensões, estados e hierarquia visual definidos em `layout.md`.
- **Adicionar modo claro ou alternador de tema** — contradiz a especificação de
  modo escuro único.

## Consequências

### Fica mais fácil

- Manter tokens, controles e estados visuais coerentes entre as telas.
- Ajustar o tema sem espalhar valores de cor e espaçamento por estilos locais.
- Preservar CSP restritiva e usar componentes adaptáveis dentro do stack atual.

### Fica mais difícil

- Converter medidas detalhadas de `layout.md` em tokens, utilitários e variantes
  reutilizáveis antes de montar as telas.
- Revisar alterações nos componentes shadcn/ui para evitar que atualizações
  apaguem adaptações visuais locais.

## Escopo

Este ADR decide a linguagem visual e a estratégia de estilos da interface. Não
altera rotas, regras de negócio, arquitetura de dados, comportamento de
autorização ou requisitos funcionais de `layout.md`.