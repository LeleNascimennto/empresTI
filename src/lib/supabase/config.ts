import { z } from "zod";

const publicSupabaseConfig = z
  .object({
    url: z.url(),
    publishableKey: z.string().min(1).optional(),
    anonKey: z.string().min(1).optional(),
  })
  .refine((config) => config.publishableKey || config.anonKey, {
    message:
      "Defina NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  })
  .parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

export const supabaseUrl = publicSupabaseConfig.url;
export const supabasePublishableKey =
  publicSupabaseConfig.publishableKey ?? publicSupabaseConfig.anonKey!;
