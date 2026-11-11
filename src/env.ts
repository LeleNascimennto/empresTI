import "server-only";
import { z } from "zod";

const postgresUrlSchema = z.string().url().refine(
  (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
  "A URL do Postgres deve usar o protocolo postgres ou postgresql.",
);

const envSchema = z.object({
  DATABASE_URL: postgresUrlSchema.refine(
    (value) => ["5432", "6543"].includes(new URL(value).port),
    "DATABASE_URL deve usar uma porta Supabase válida: 5432 ou 6543.",
  ),
  DIRECT_URL: postgresUrlSchema.refine(
    (value) => new URL(value).port === "5432",
    "DIRECT_URL deve usar a conexão de migration na porta 5432.",
  ),
});

export function getEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.path.join(".") || "env");
    throw new Error(
      `Configuração do ambiente ausente ou inválida: ${issues.join(", ")}. Verifique DATABASE_URL e DIRECT_URL.`,
    );
  }

  return parsed.data;
}
