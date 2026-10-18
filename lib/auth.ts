import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/env";
import { USER_ROLES } from "@/lib/constants";

const env = getServerEnv();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mysql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: USER_ROLES.USER,
      },
    },
  },
});

export async function getServerSession() {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });
    return session;
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getServerSession();
  if (!session || !session.user) {
    return { authorized: false as const, reason: "UNAUTHENTICATED" as const, session: null };
  }
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== USER_ROLES.ADMIN) {
    return { authorized: false as const, reason: "FORBIDDEN" as const, session };
  }
  return { authorized: true as const, reason: null, session };
}
