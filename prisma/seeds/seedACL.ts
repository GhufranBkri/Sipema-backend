import { Prisma, PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

// Types for better type safety
interface Permission {
  subject: string;
  action: string[];
}

interface UserLevelPermission {
  permissions: Permission[];
}

interface PermissionMap {
  [key: string]: UserLevelPermission;
}

const USER_LEVEL_PERMISSIONS: PermissionMap = {
  TENAGA_KEPENDIDIKAN: {
    permissions: [
      { subject: "PENGADUAN", action: ["read", "create", "update", "delete"] },
      {
        subject: "PENGADUAN_WBS",
        action: ["read", "create", "update", "delete"],
      },
    ],
  },

  ADMIN: {
    permissions: [
      { subject: "UNIT", action: ["read", "create", "update", "delete"] },
      { subject: "KATEGORI", action: ["read", "create", "update", "delete"] },
      {
        subject: "USER_MANAGEMENT",
        action: ["read", "create", "update", "delete"],
      },
      // {
      //   subject: "ROLE_MANAGEMENT",
      //   action: ["read", "create", "update", "delete"],
      // },
      { subject: "ACL", action: ["read", "create", "delete"] },
    ],
  },

  MAHASISWA: {
    permissions: [
      { subject: "PENGADUAN", action: ["read", "create", "update", "delete"] },
    ],
  },
  DOSEN: {
    permissions: [
      { subject: "PENGADUAN", action: ["read", "create", "update", "delete"] },
      {
        subject: "PENGADUAN_WBS",
        action: ["read", "create", "update", "delete"],
      },
    ],
  },

  PETUGAS_SUPER: {
    permissions: [
      { subject: "PENGADUAN", action: ["read", "update", "delete"] },
      {
        subject: "PENGADUAN_WBS",
        action: ["read", "create", "update", "delete"],
      },
      { subject: "PENGADUAN_MASYARAKAT", action: ["read", "update", "delete"] },
    ],
  },

  PETUGAS_WBS: {
    permissions: [
      { subject: "PENGADUAN_WBS", action: ["read", "update", "delete"] },
    ],
  },
  KEPALA_WBS: {
    permissions: [
      { subject: "PENGADUAN_WBS", action: ["read", "update", "delete"] },
      { subject: "USER_MANAGEMENT", action: ["read"] },
    ],
  },
  PETUGAS: {
    permissions: [{ subject: "PENGADUAN", action: ["read", "update"] }],
  },
  KEPALA_PETUGAS_UNIT: {
    permissions: [
      { subject: "PENGADUAN", action: ["read", "update", "delete"] },
      // { subject: "USER_MANAGEMENT", action: ["read"] },
      { subject: "UM_UNIT", action: ["read", "create", "update", "delete"] },
    ],
  },
};

export async function seedAcl(prisma: PrismaClient): Promise<void> {
  try {
    // await seedAdminPermissions(prisma);
    await seedUserLevelPermissions(prisma);
    console.log("✅ All ACL permissions seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding ACL permissions:", error);
    throw error;
  }
}

async function seedUserLevelPermissions(prisma: PrismaClient): Promise<void> {
  for (const [levelName, { permissions }] of Object.entries(
    USER_LEVEL_PERMISSIONS
  )) {
    const userLevel = await prisma.userLevels.findFirst({
      where: { name: levelName },
    });

    if (!userLevel) {
      console.log(`⚠️ User level ${levelName} not found`);
      continue;
    }

    await createFeaturesAndActions(prisma, permissions);
    await createAclEntries(prisma, permissions, userLevel.id);
  }
}

async function createFeaturesAndActions(
  prisma: PrismaClient,
  permissions: Permission[]
): Promise<void> {
  for (const { subject, action } of permissions) {
    const existingFeature = await prisma.features.findUnique({
      where: { name: subject },
    });

    if (!existingFeature) {
      await prisma.features.create({
        data: { id: ulid(), name: subject },
      });
    }

    const actionCreateData = action.map((actionName) => ({
      id: ulid(),
      name: actionName,
      namaFeature: subject,
    }));

    await prisma.actions.createMany({
      data: actionCreateData,
      skipDuplicates: true,
    });
  }
}

async function createAclEntries(
  prisma: PrismaClient,
  permissions: Permission[],
  userLevelId: string
): Promise<void> {
  const aclEntries: Prisma.AclCreateManyInput[] = [];

  for (const { subject, action } of permissions) {
    for (const actionName of action) {
      aclEntries.push({
        id: ulid(),
        namaFeature: subject,
        namaAction: actionName,
        userLevelId,
      });
    }
  }

  await prisma.acl.createMany({
    data: aclEntries,
    skipDuplicates: true,
  });
}
