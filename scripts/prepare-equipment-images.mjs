import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

export const equipment = [
  ["TI-0001", "Notebook 14 polegadas", "notebook", "AVAILABLE", "laptop on white desk"],
  ["TI-0002", "Notebook 15 polegadas", "notebook", "AVAILABLE", "open laptop minimal desk"],
  ["TI-0003", "Notebook 13 polegadas", "notebook", "AVAILABLE", "laptop closeup keyboard"],
  ["TI-0004", "Notebook 15 polegadas", "notebook", "MAINTENANCE", "closed laptop on table"],
  ["TI-0005", "Monitor 24 polegadas", "monitor", "AVAILABLE", "computer monitor on desk"],
  ["TI-0006", "Monitor 27 polegadas", "monitor", "AVAILABLE", "monitor screen office desk"],
  ["TI-0007", "Monitor 22 polegadas", "monitor", "MAINTENANCE", "black computer screen"],
  ["TI-0008", "Cabo HDMI 2 m", "cabo", "AVAILABLE", "hdmi cable"],
  ["TI-0009", "Cabo USB-C 1 m", "cabo", "AVAILABLE", "usb cable white background"],
  ["TI-0010", "Cabo de rede 3 m", "cabo", "MAINTENANCE", "ethernet cable"],
  ["TI-0011", "Webcam Full HD", "camera", "AVAILABLE", "webcam"],
  ["TI-0012", "Câmera compacta", "camera", "AVAILABLE", "compact camera on table"],
].map(([assetTag, name, category, conditionStatus, query]) => ({
  assetTag,
  name,
  category,
  conditionStatus,
  query,
}));

const root = process.cwd();
const cacheDirectory = path.join(root, "artifacts", "equipment-images", ".cache");
const outputDirectory = path.join(root, "artifacts", "equipment-images");
const cacheDurationMs = 24 * 60 * 60 * 1000;
const licenseUrl = "https://pixabay.com/service/license-summary/";
const apiKey = process.env.PIXABAY_API_KEY;

export async function resizeToJpeg(input) {
  return sharp(input, { failOn: "error" })
    .rotate()
    .resize(800, 600, { fit: "cover", position: "centre" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function isPhoto(candidate) {
  return Number.isSafeInteger(candidate.id) && candidate.id > 0 &&
    typeof candidate.pageURL === "string" &&
    typeof candidate.webformatURL === "string" &&
    typeof candidate.user === "string" &&
    typeof candidate.user_id === "number" &&
    typeof candidate.userImageURL === "string";
}

async function loadCachedResults(item) {
  const cachePath = path.join(cacheDirectory, `${item.assetTag}.json`);
  try {
    const cache = JSON.parse(await readFile(cachePath, "utf8"));
    if (Date.now() - cache.cachedAt < cacheDurationMs && Array.isArray(cache.hits)) {
      return cache.hits;
    }
  } catch {
    // Missing or invalid cache is refreshed below.
  }

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", item.query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "horizontal");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "12");
  url.searchParams.set("min_width", "800");
  url.searchParams.set("min_height", "600");

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new Error(`Pixabay não respondeu à busca de ${item.assetTag}.`);
  }
  if (!response.ok) {
    throw new Error(`Pixabay recusou a busca de ${item.assetTag} (HTTP ${response.status}).`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`Pixabay retornou dados inválidos para ${item.assetTag}.`);
  }
  const hits = Array.isArray(payload?.hits) ? payload.hits.filter(isPhoto).map((hit) => ({
    id: hit.id,
    pageURL: hit.pageURL,
    webformatURL: hit.webformatURL,
    user: hit.user,
    user_id: hit.user_id,
    userImageURL: hit.userImageURL,
  })) : [];

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(cachePath, JSON.stringify({ cachedAt: Date.now(), hits }, null, 2));
  return hits;
}

async function search() {
  const candidates = {};
  for (const [index, item] of equipment.entries()) {
    const hits = await loadCachedResults(item);
    candidates[item.assetTag] = hits.slice(0, 12);
    process.stdout.write(`\n${item.assetTag} · ${item.name}\n`);
    if (!hits.length) process.stdout.write("  Nenhum resultado; tente outra busca manualmente.\n");
    for (const hit of candidates[item.assetTag]) {
      process.stdout.write(`  ID ${hit.id} · ${hit.user} · ${hit.pageURL}\n`);
    }
    if (index < equipment.length - 1) await new Promise((resolve) => setTimeout(resolve, 1_100));
  }
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "candidates.json"), JSON.stringify(candidates, null, 2));
  process.stdout.write(`\nCandidatos locais: ${path.join(outputDirectory, "candidates.json")}\n`);
  process.stdout.write("Revise visualmente cada página Pixabay antes de escolher os IDs.\n");
}

async function download(selectionFile) {
  const supabaseUrlValue = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrlValue) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não encontrada. Configure a URL pública do projeto no .env local.");
  }
  let supabaseOrigin;
  try {
    const parsedSupabaseUrl = new URL(supabaseUrlValue);
    if (!["https:", "http:"].includes(parsedSupabaseUrl.protocol)) throw new Error();
    supabaseOrigin = parsedSupabaseUrl.origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL precisa ser uma URL válida.");
  }

  const selectionPath = path.resolve(root, selectionFile);
  const selections = JSON.parse(await readFile(selectionPath, "utf8"));
  if (!selections || typeof selections !== "object" || Array.isArray(selections)) {
    throw new Error("O arquivo de escolhas precisa ser um objeto JSON por patrimônio.");
  }
  const seenIds = new Set();
  const manifest = [];

  await mkdir(outputDirectory, { recursive: true });
  for (const item of equipment) {
    const selectedId = Number(selections[item.assetTag]);
    if (!Number.isSafeInteger(selectedId) || selectedId <= 0) {
      throw new Error(`Escolha um ID Pixabay válido para ${item.assetTag}.`);
    }
    if (seenIds.has(selectedId)) {
      throw new Error(`O ID Pixabay ${selectedId} foi escolhido mais de uma vez.`);
    }
    seenIds.add(selectedId);

    const hits = await loadCachedResults(item);
    const selected = hits.find((hit) => hit.id === selectedId);
    if (!selected) {
      throw new Error(`O ID Pixabay escolhido para ${item.assetTag} não está nos resultados em cache; rode --search novamente.`);
    }

    let response;
    try {
      response = await fetch(selected.webformatURL, { signal: AbortSignal.timeout(30_000) });
    } catch {
      throw new Error(`Não foi possível baixar a foto selecionada para ${item.assetTag}.`);
    }
    if (!response.ok) throw new Error(`Pixabay não entregou a foto de ${item.assetTag} (HTTP ${response.status}).`);
    const input = Buffer.from(await response.arrayBuffer());
    if (input.byteLength > 20 * 1024 * 1024) throw new Error(`A foto de ${item.assetTag} excede 20 MB.`);

    const outputName = `${item.assetTag}.jpg`;
    const outputPath = path.join(outputDirectory, outputName);
    await writeFile(outputPath, await resizeToJpeg(input));

    manifest.push({
      assetTag: item.assetTag,
      name: item.name,
      category: item.category,
      conditionStatus: item.conditionStatus,
      provider: "Pixabay",
      providerPhotoId: selected.id,
      imageUrl: `${supabaseOrigin}/storage/v1/object/public/equipment-images/${outputName}`,
      sourceUrl: selected.pageURL,
      photographer: selected.user,
      photographerProfileUrl: `https://pixabay.com/users/${encodeURIComponent(selected.user)}-${selected.user_id}/`,
      license: "Pixabay Content License",
      licenseUrl,
      output: outputName,
      width: 800,
      height: 600,
      format: "jpeg",
      reviewStatus: "needs_human_review",
    });
  }

  await writeFile(path.join(outputDirectory, "manifest.json"), JSON.stringify(manifest, null, 2));
  process.stdout.write(`12 imagens preparadas para revisão: ${path.join(outputDirectory, "manifest.json")}\n`);
  process.stdout.write("Revise cada JPEG localmente antes do upload manual ao Storage.\n");
}

async function main() {
  if (!apiKey) {
    fail("PIXABAY_API_KEY não encontrada. Configure-a localmente no .env e tente novamente.");
    return;
  }
  if (process.argv.includes("--search")) {
    await search();
    return;
  }
  if (process.argv.includes("--download")) {
    const selectionIndex = process.argv.indexOf("--selection-file");
    if (selectionIndex < 0 || !process.argv[selectionIndex + 1]) {
      throw new Error("Informe --selection-file <arquivo.json> com um ID Pixabay revisado por patrimônio.");
    }
    await download(process.argv[selectionIndex + 1]);
    return;
  }
  throw new Error("Use --search ou --download --selection-file <arquivo.json>.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => fail(error instanceof Error ? error.message : "Falha ao preparar imagens Pixabay."));
}
