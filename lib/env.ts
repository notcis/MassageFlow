import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  UPLOADTHING_TOKEN: z.string().optional().default(""),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional().default(""),
  LINE_CHANNEL_SECRET: z.string().optional().default(""),
  ADMIN_INITIAL_EMAIL: z.string().email().optional().default("admin@massageflow.local"),
  ADMIN_INITIAL_PASSWORD: z.string().min(8).optional().default("AdminPassword123!"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL,
    ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    console.warn("Environment validation warning:", parsed.error.flatten().fieldErrors);
    return {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "fallback-dev-secret-key-at-least-32-chars",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN ?? "",
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ?? "",
      ADMIN_INITIAL_EMAIL: process.env.ADMIN_INITIAL_EMAIL ?? "admin@massageflow.local",
      ADMIN_INITIAL_PASSWORD: process.env.ADMIN_INITIAL_PASSWORD ?? "AdminPassword123!",
      NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") ?? "development",
    };
  }

  return parsed.data;
}

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
