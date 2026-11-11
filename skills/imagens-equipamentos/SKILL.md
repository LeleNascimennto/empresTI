---
name: imagens-equipamentos
description: Busca e prepara imagens Pixabay para equipamentos do catálogo EmpresTI. Use somente para selecionar fotos reais de notebooks, monitores, cabos ou câmeras e gerar JPEGs locais para revisão humana.
---

# Imagens de equipamentos

Use exclusivamente a Pixabay API. Não use outros provedores, bancos de imagens,
buscadores ou imagens já presentes no projeto como substitutos para as fotos
dos equipamentos.

## Preparação

1. Confirme que `PIXABAY_API_KEY` está definida localmente. Nunca peça para a
   pessoa colar o segredo no chat, terminal compartilhado ou arquivo versionado.
   A chave é local-only e não é variável do app nem da Vercel.
2. Gere candidatos com `node --env-file-if-exists=.env scripts/prepare-equipment-images.mjs --search`.
   O script consulta uma vez cada busca de patrimônio, armazena a resposta por
   24 horas e imprime links de páginas Pixabay sem revelar a chave.
3. Abra visualmente as páginas e escolha um ID por patrimônio. Rejeite fotos
   com pessoas, marcas/logos legíveis, texto ou conteúdo legível em telas. Cada
   ID precisa ser único.
4. Crie um JSON local seguindo `scripts/equipment-image-selections.example.json`
   e rode `node --env-file-if-exists=.env scripts/prepare-equipment-images.mjs --download --selection-file
   <arquivo-local>`.
5. Abra e revise os JPEGs finais. O manifesto começa como `needs_human_review`;
   só depois da aprovação humana marque `approved` manualmente.

## Saída e segurança

- Os downloads ficam em `artifacts/equipment-images/`; não são publicados nem
  enviados automaticamente ao Supabase.
- Sharp recorta para 800×600 e codifica JPEG. Os arquivos não preservam EXIF.
- `manifest.json` registra patrimônio, Pixabay photo ID e página, autor,
  perfil, licença e estado da revisão.
- O script não imprime a chave, não imprime URLs de busca que a contenham e
  converte erros de API em mensagens sem URL/body. Não habilite logs HTTP brutos.
- Respeite a política de cache de 24 horas e limites de uso da API. Não faça
  download em lote de resultados não escolhidos e não faça hotlink permanente.
- Não faça upload ao Storage. A pessoa responsável revisa e envia os 12 JPEGs
  manualmente pelo painel do Supabase, conforme as instruções do projeto.

## Referências oficiais

- Pixabay API: <https://pixabay.com/api/docs/>
- Pixabay Content License: <https://pixabay.com/service/license-summary/>
