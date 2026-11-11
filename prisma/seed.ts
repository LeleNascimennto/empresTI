import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { equipment } from "../scripts/prepare-equipment-images.mjs";

type ImageManifestEntry = {
  assetTag: string;
  category: string;
  conditionStatus: "AVAILABLE" | "MAINTENANCE";
  providerPhotoId: number;
  imageUrl: string;
  sourceUrl: string;
  photographer: string;
  license: string;
  reviewStatus: string;
};

function assertLocalDatabase(urlValue: string | undefined) {
  if (!urlValue) throw new Error("DIRECT_URL obrigatória para executar o seed local.");
  let hostname: string;
  try {
    hostname = new URL(urlValue).hostname;
  } catch {
    throw new Error("DIRECT_URL precisa ser uma URL válida.");
  }
  if (!["localhost", "127.0.0.1", "[::1]", "host.docker.internal"].includes(hostname)) {
    throw new Error("Seed bloqueado: só pode escrever em banco local.");
  }
}

function parseImageManifest(raw: string | undefined) {
  if (!raw) return new Map<string, ImageManifestEntry>();
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries)) throw new Error("manifest.json precisa conter uma lista de imagens.");
  const byAsset = new Map<string, ImageManifestEntry>();
  const photoIds = new Set<number>();
  for (const entry of entries as ImageManifestEntry[]) {
    if (entry.reviewStatus !== "approved") continue;
    if (!Number.isSafeInteger(entry.providerPhotoId) || photoIds.has(entry.providerPhotoId)) {
      throw new Error("Manifesto de imagens inválido: ID Pixabay ausente ou duplicado.");
    }
    if (byAsset.has(entry.assetTag)) throw new Error(`Manifesto contém patrimônio duplicado: ${entry.assetTag}.`);
    photoIds.add(entry.providerPhotoId);
    byAsset.set(entry.assetTag, entry);
  }
  return byAsset;
}

async function main() {
  const directUrl = process.env.DIRECT_URL;
  assertLocalDatabase(directUrl);

  const teacherUserId = process.argv[2];
  if (teacherUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teacherUserId)) {
    throw new Error("Informe um UUID válido para vincular o professor como colaborador.");
  }

  let manifestRaw: string | undefined;
  try {
    manifestRaw = await readFile("artifacts/equipment-images/manifest.json", "utf8");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
  const images = parseImageManifest(manifestRaw);
  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

  try {
    const [databaseRole] = await prisma.$queryRaw<Array<{ rolsuper: boolean; rolbypassrls: boolean }>>`
      SELECT rolsuper, rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `;
    if (!databaseRole?.rolsuper && !databaseRole?.rolbypassrls) {
      throw new Error("Seed local exige uma role que possa bypassar RLS forçada.");
    }

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.upsert({
        where: { slug: "suporte_ti" },
        update: {},
        create: { slug: "suporte_ti" },
      });

      for (const item of equipment) {
        const image = images.get(item.assetTag);
        if (image && (image.category !== item.category || image.conditionStatus !== item.conditionStatus)) {
          throw new Error(`Manifesto diverge dos dados de ${item.assetTag}.`);
        }
        const existing = await tx.equipment.findUnique({
          where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: item.assetTag } },
          include: { loans: { select: { id: true }, take: 1 } },
        });
        if (existing) {
          if (existing.name !== item.name || existing.category !== item.category || existing.conditionStatus !== item.conditionStatus) {
            throw new Error(`Conflito em ${item.assetTag}; seed não sobrescreve dados existentes.`);
          }
          if (image && existing.imageProviderPhotoId && existing.imageProviderPhotoId !== String(image.providerPhotoId)) {
            throw new Error(`Foto já associada a ${item.assetTag}; revise manualmente antes de trocar.`);
          }
        }

        const imageData = image ? {
          imageUrl: image.imageUrl,
          imageSourceUrl: image.sourceUrl,
          imageProviderPhotoId: String(image.providerPhotoId),
          imagePhotographer: image.photographer,
          imageLicense: image.license,
        } : {};
        await tx.equipment.upsert({
          where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: item.assetTag } },
          update: imageData,
          create: {
            tenantId: tenant.id,
            assetTag: item.assetTag,
            name: item.name,
            category: item.category,
            conditionStatus: item.conditionStatus,
            ...imageData,
          },
        });
      }

      if (teacherUserId) {
        const existingLoans = await tx.loan.count({ where: { tenantId: tenant.id, borrowerUserId: teacherUserId } });
        if (existingLoans > 0) throw new Error("Professor já tem empréstimos; seed não altera essa conta.");
        await tx.membership.upsert({
          where: { tenantId_userId: { tenantId: tenant.id, userId: teacherUserId } },
          update: {},
          create: { tenantId: tenant.id, userId: teacherUserId, role: "COLLABORATOR" },
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }
  process.stdout.write(`Seed local concluído: ${equipment.length} equipamentos; ${images.size} fotos aprovadas.\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Falha no seed local."}\n`);
  process.exitCode = 1;
});
