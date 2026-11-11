import { z } from "zod";

const publicSupabaseConfigSchema = z.object({
  url: z.url(),
  publishableKey: z.string().min(1).optional(),
  anonKey: z.string().min(1).optional(),
});

export function getSupabaseConfig() {
  const config = publicSupabaseConfigSchema
    .refine((value) => value.publishableKey || value.anonKey, {
      message: "Defina NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    })
    .safeParse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

  if (!config.success) {
    throw new Error(
      `Configuração do Supabase ausente ou inválida. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY).`,
    );
  }

  return config.data;
}

export function getSupabaseUrl() {
  return getSupabaseConfig().url;
}

export function getSupabasePublishableKey() {
  const config = getSupabaseConfig();
  return config.publishableKey ?? config.anonKey!;
}
