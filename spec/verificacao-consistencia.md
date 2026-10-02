# Spec: auditoria de duplicações e contradições do repositório

## Objetivo
Verificar todos os arquivos versionados do repositório para identificar conteúdo duplicado, instruções repetidas que possam divergir e contradições entre decisões normativas, specs e artefatos existentes.

## Escopo
- Inventariar e revisar todos os arquivos rastreados no Git, incluindo documentação, instruções, specs, configuração e protótipo.
- Procurar duplicação literal e conceitual, precedência confusa e contradição entre documentos e implementação.
- Conferir o `.env.example` e o rastreamento/ignore de arquivos locais sem abrir nem divulgar valores de `.env`.
- Registrar achados com os dois lados da divergência e links/linhas, distinguindo duplicação intencional de conflito.
- Executar checks leves disponíveis e informar validações que não se aplicam ou não podem rodar.

## Restrições
- Não ler nem divulgar valores de `.env`; não alterar ambiente, dependências, banco remoto nem corrigir arquivos auditados.
- A documentação normativa prevalece conforme a precedência definida em `AGENTS.md`.

## Critérios de aceite
- Revisar todos os arquivos rastreados e identificar itens excluídos do conteúdo por serem locais/sensíveis.
- Entregar veredito com duplicações, contradições e riscos de precedência, cada um ancorado em evidência/localização.
- Executar checks leves disponíveis e relatar limitações sem afirmar validação não realizada.
