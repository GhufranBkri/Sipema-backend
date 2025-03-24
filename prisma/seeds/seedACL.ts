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

// Constants
const ADMIN_PERMISSIONS: Permission[] = [
  {
    subject: "USER_MANAGEMENT",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "ROLE_MANAGEMENT",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "ACL",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "PENGADUAN",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "PENGADUAN_WBS",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "UNIT",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "KATEGORI",
    action: ["read", "create", "update", "delete"],
  },
  {
    subject: "KATEGORI_WBS",
    action: ["read", "create", "update", "delete"],
  },
];

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
    ],
  },
};

export async function seedAcl(prisma: PrismaClient): Promise<void> {
  try {
    // Check if ACL entries already exist
    const existingFeatures = await prisma.features.count();
    const existingActions = await prisma.actions.count();
    const existingAcl = await prisma.acl.count();

    if (existingFeatures > 0 && existingActions > 0 && existingAcl > 0) {
      console.log("ℹ️ ACL data already exists, skipping seed");
      return;
    }

    // If no existing data, proceed with seeding
    await seedAdminPermissions(prisma);
    await seedUserLevelPermissions(prisma);
    console.log("✅ All ACL permissions seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding ACL permissions:", error);
    throw error;
  }
}

async function seedAdminPermissions(prisma: PrismaClient): Promise<void> {
  const adminLevel = await prisma.userLevels.findFirst({
    where: { name: "ADMIN" },
  });

  if (!adminLevel) {
    console.log("⚠️ Admin level not found");
    return;
  }

  // Check if admin already has permissions
  const existingAdminAcl = await prisma.acl.findFirst({
    where: { userLevelId: adminLevel.id },
  });

  if (existingAdminAcl) {
    console.log("ℹ️ Admin permissions already exist, skipping");
    return;
  }

  await createFeaturesAndActions(prisma, ADMIN_PERMISSIONS);
  await linkAdminToPermissions(prisma, adminLevel.id);
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

    // Check if level already has permissions
    const existingLevelAcl = await prisma.acl.findFirst({
      where: { userLevelId: userLevel.id },
    });

    if (existingLevelAcl) {
      console.log(`ℹ️ Permissions for ${levelName} already exist, skipping`);
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
    // Create feature if it doesn't exist
    const existingFeature = await prisma.features.findUnique({
      where: { name: subject },
    });

    if (!existingFeature) {
      await prisma.features.create({
        data: { id: ulid(), name: subject },
      });
    }

    // Create actions for the feature
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
      const existingAcl = await prisma.acl.findUnique({
        where: {
          namaFeature_namaAction_userLevelId: {
            namaFeature: subject,
            namaAction: actionName,
            userLevelId,
          },
        },
      });

      if (!existingAcl) {
        aclEntries.push({
          id: ulid(),
          namaFeature: subject,
          namaAction: actionName,
          userLevelId,
        });
      }
    }
  }

  if (aclEntries.length > 0) {
    await prisma.acl.createMany({
      data: aclEntries,
      skipDuplicates: true,
    });
  }
}

async function linkAdminToPermissions(
  prisma: PrismaClient,
  adminLevelId: string
): Promise<void> {
  const superAdmin = await prisma.user.findUnique({
    where: { no_identitas: "1001" },
  });

  if (!superAdmin) {
    console.log("⚠️ Super admin user not found");
    return;
  }

  if (!superAdmin.userLevelId) {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: { userLevelId: adminLevelId },
    });
  }
}
