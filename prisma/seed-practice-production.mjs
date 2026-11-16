import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { equipment } from "../scripts/prepare-equipment-images.mjs";

const manifestPath = "artifacts/equipment-images/manifest.json";

function assertTarget() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const databaseUrl = process.env.DATABASE_URL;
  if (!projectUrl || !databaseUrl) throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e DATABASE_URL.");
  const project = new URL(projectUrl);
  const database = new URL(databaseUrl);
  const projectRef = project.hostname.split(".")[0];
  if (project.protocol !== "https:" || !projectRef ||
      !["postgres:", "postgresql:"].includes(database.protocol) ||
      database.username !== `postgres.${projectRef}` || database.pathname !== "/postgres" ||
      !["5432", "6543"].includes(database.port)) {
    throw new Error("A conexão do banco não corresponde ao projeto Supabase configurado.");
  }
  database.searchParams.set("pgbouncer", "true");
  database.searchParams.set("connection_limit", "1");
  return { projectRef, origin: project.origin, databaseUrl: database.toString() };
}

async function loadApprovedManifest(origin) {
  const entries = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(entries) || entries.length !== 12 || equipment.length !== 12) {
    throw new Error("A carga exige exatamente 12 equipamentos e 12 imagens.");
  }
  const byAsset = new Map();
  const photoIds = new Set();
  for (const entry of entries) {
    if (entry.reviewStatus !== "approved" || entry.provider !== "Pixabay" ||
        !Number.isSafeInteger(entry.providerPhotoId) || photoIds.has(entry.providerPhotoId) ||
        byAsset.has(entry.assetTag) || !entry.sourceUrl.startsWith("https://pixabay.com/photos/") ||
        entry.imageUrl !== `${origin}/storage/v1/object/public/equipment-images/${entry.assetTag}.jpg`) {
      throw new Error(`Manifesto inválido para ${entry.assetTag ?? "item desconhecido"}.`);
    }
    photoIds.add(entry.providerPhotoId);
    byAsset.set(entry.assetTag, entry);
  }
  for (const item of equipment) {
    const image = byAsset.get(item.assetTag);
    if (!image || image.name !== item.name || image.category !== item.category ||
        image.conditionStatus !== item.conditionStatus) {
      throw new Error(`Dados do manifesto não correspondem a ${item.assetTag}.`);
    }
  }
  return byAsset;
}

async function assertImagesAccessible(images) {
  for (const item of equipment) {
    const response = await fetch(images.get(item.assetTag).imageUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/jpeg")) {
      throw new Error(`Imagem pública indisponível para ${item.assetTag} (HTTP ${response.status}).`);
    }
  }
}

function imageData(image) {
  return {
    imageUrl: image.imageUrl,
    imageSourceUrl: image.sourceUrl,
    imageProviderPhotoId: String(image.providerPhotoId),
    imagePhotographer: image.photographer,
    imageLicense: image.license,
  };
}

async function assertNoConflicts(prisma, tenantId, images) {
  const existing = tenantId ? await prisma.equipment.findMany({ where: { tenantId } }) : [];
  for (const record of existing) {
    const item = equipment.find((candidate) => candidate.assetTag === record.assetTag);
    if (!item) continue;
    const selectedId = String(images.get(item.assetTag).providerPhotoId);
    if (record.name !== item.name || record.category !== item.category ||
        record.conditionStatus !== item.conditionStatus ||
        (record.imageProviderPhotoId && record.imageProviderPhotoId !== selectedId)) {
      throw new Error(`Conflito com equipamento já cadastrado: ${item.assetTag}.`);
    }
  }
  const otherUse = await prisma.equipment.findFirst({
    where: {
      imageProviderPhotoId: { in: [...images.values()].map((image) => String(image.providerPhotoId)) },
      ...(tenantId ? { tenantId: { not: tenantId } } : {}),
    },
    select: { assetTag: true },
  });
  if (otherUse) throw new Error(`Uma foto Pixabay já está vinculada a outro equipamento: ${otherUse.assetTag}.`);
}

async function main() {
  const { projectRef, origin, databaseUrl } = assertTarget();
  const images = await loadApprovedManifest(origin);
  await assertImagesAccessible(images);
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const [role] = await prisma.$queryRaw`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user
    `;
    if (!role?.rolsuper && !role?.rolbypassrls) {
      throw new Error("A conexão Prisma não tem permissão para a carga com RLS.");
    }
    const tenant = await prisma.tenant.findUnique({ where: { slug: "suporte_ti" } });
    await assertNoConflicts(prisma, tenant?.id, images);
    process.stdout.write(`Projeto ${projectRef}; tenant suporte_ti; 12 imagens públicas verificadas; 12 registros sem conflito.\n`);
    if (!process.argv.includes("--confirm-production")) {
      process.stdout.write("Dry-run concluído. Use --confirm-production para gravar os dados.\n");
      return;
    }

    await prisma.$transaction(async (tx) => {
      const target = await tx.tenant.upsert({
        where: { slug: "suporte_ti" },
        update: {},
        create: { slug: "suporte_ti" },
      });
      for (const item of equipment) {
        const data = imageData(images.get(item.assetTag));
        await tx.equipment.upsert({
          where: { tenantId_assetTag: { tenantId: target.id, assetTag: item.assetTag } },
          update: data,
          create: {
            tenantId: target.id,
            assetTag: item.assetTag,
            name: item.name,
            category: item.category,
            conditionStatus: item.conditionStatus,
            ...data,
          },
        });
      }
    }, { maxWait: 15_000, timeout: 90_000 });
    process.stdout.write("Carga concluída: 12 equipamentos no tenant suporte_ti.\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Falha na carga de equipamentos."}\n`);
  process.exitCode = 1;
});
