import "server-only";
import { z } from "zod";

const postgresUrl = z
  .url()
  .refine((value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol));

export const env = z
  .object({
    DATABASE_URL: postgresUrl.refine(
      (value) => ["5432", "6543"].includes(new URL(value).port),
      "DATABASE_URL deve usar uma porta Supabase válida: 5432 ou 6543.",
    ),
    DIRECT_URL: postgresUrl.refine(
      (value) => new URL(value).port === "5432",
      "DIRECT_URL deve usar a conexão de migration na porta 5432.",
    ),
  })
  .parse(process.env);
