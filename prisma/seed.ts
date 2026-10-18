import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";
import { getServerEnv } from "../lib/env";
import {
  DEFAULT_SERVICES,
  DEFAULT_STAFFS,
  USER_ROLES,
} from "../lib/constants";

async function main() {
  const env = getServerEnv();

  console.log("Seeding services...");
  for (const service of DEFAULT_SERVICES) {
    await prisma.service.upsert({
      where: { code: service.code },
      update: {
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        sortOrder: service.sortOrder,
        isActive: true,
      },
      create: {
        code: service.code,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        sortOrder: service.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("Seeding massage staff...");
  for (const staff of DEFAULT_STAFFS) {
    await prisma.staff.upsert({
      where: { code: staff.code },
      update: {
        name: staff.name,
        specialty: staff.specialty,
        sortOrder: staff.sortOrder,
        isActive: true,
      },
      create: {
        code: staff.code,
        name: staff.name,
        specialty: staff.specialty,
        sortOrder: staff.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("Seeding initial ADMIN user...");
  const existingAdmin = await prisma.user.findUnique({
    where: { email: env.ADMIN_INITIAL_EMAIL },
  });

  if (!existingAdmin) {
    await auth.api.signUpEmail({
      body: {
        email: env.ADMIN_INITIAL_EMAIL,
        password: env.ADMIN_INITIAL_PASSWORD,
        name: "MassageFlow Admin",
      },
    });
  }

  await prisma.user.update({
    where: { email: env.ADMIN_INITIAL_EMAIL },
    data: {
      role: USER_ROLES.ADMIN,
      emailVerified: true,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
