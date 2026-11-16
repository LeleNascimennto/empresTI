import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const bucketName = "equipment-images";
const directory = path.resolve("artifacts/equipment-images");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function isNotFound(error) {
  return error?.status === 404 || String(error?.statusCode) === "404";
}

async function main() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !serviceKey) throw new Error("URL do Supabase e chave de serviço são necessárias no ambiente local.");
  const origin = new URL(projectUrl).origin;
  if (!origin.startsWith("https://")) throw new Error("O projeto Supabase deve usar HTTPS.");

  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  if (!Array.isArray(manifest) || manifest.length !== 12) throw new Error("O manifesto precisa conter 12 imagens.");
  const ids = new Set();
  const assets = new Set();
  const files = [];
  for (const item of manifest) {
    const fileName = `${item.assetTag}.jpg`;
    if (!/^TI-\d{4}\.jpg$/.test(fileName) || item.output !== fileName ||
        item.provider !== "Pixabay" || item.reviewStatus !== "approved" ||
        !Number.isSafeInteger(item.providerPhotoId) || ids.has(item.providerPhotoId) ||
        assets.has(item.assetTag) || !item.sourceUrl.startsWith("https://pixabay.com/photos/") ||
        item.imageUrl !== `${origin}/storage/v1/object/public/${bucketName}/${fileName}`) {
      throw new Error(`Manifesto inválido para ${item.assetTag ?? "patrimônio desconhecido"}.`);
    }
    ids.add(item.providerPhotoId);
    assets.add(item.assetTag);
    const bytes = await readFile(path.join(directory, fileName));
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== "jpeg" || metadata.width !== 800 || metadata.height !== 600 || bytes.length > 2_000_000) {
      throw new Error(`JPEG inválido para ${item.assetTag}.`);
    }
    files.push({ fileName, bytes });
  }

  process.stdout.write(`Destino: ${origin}; bucket público: ${bucketName}; imagens aprovadas: ${files.length}.\n`);
  if (!process.argv.includes("--confirm-production")) {
    process.stdout.write("Dry-run concluído. Use --confirm-production para publicar.\n");
    return;
  }

  const supabase = createClient(origin, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existingBucket, error: bucketError } = await supabase.storage.getBucket(bucketName);
  if (bucketError && !isNotFound(bucketError)) throw new Error(`Não foi possível consultar o bucket (${bucketError.status ?? "erro"}).`);
  if (!existingBucket) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ["image/jpeg"],
      fileSizeLimit: 2_000_000,
    });
    if (error) throw new Error(`Não foi possível criar o bucket (${error.status ?? "erro"}).`);
    process.stdout.write(`Bucket ${bucketName} criado.\n`);
  } else if (!existingBucket.public) {
    throw new Error(`O bucket ${bucketName} existe, mas não é público; nenhuma imagem será enviada.`);
  }

  for (const { fileName, bytes } of files) {
    const { data: existing, error: downloadError } = await supabase.storage.from(bucketName).download(fileName);
    if (existing) {
      if (sha256(Buffer.from(await existing.arrayBuffer())) !== sha256(bytes)) {
        throw new Error(`${fileName} já existe com conteúdo diferente; publicação interrompida.`);
      }
      process.stdout.write(`${fileName}: já publicado, conteúdo igual.\n`);
      continue;
    }
    if (downloadError && !isNotFound(downloadError)) {
      throw new Error(`Não foi possível verificar ${fileName} (${downloadError.statusCode ?? "erro"}).`);
    }
    const { error } = await supabase.storage.from(bucketName).upload(fileName, bytes, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw new Error(`Falha ao enviar ${fileName} (${error.statusCode ?? "erro"}).`);
    process.stdout.write(`${fileName}: publicado.\n`);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : "Falha ao publicar imagens."));
