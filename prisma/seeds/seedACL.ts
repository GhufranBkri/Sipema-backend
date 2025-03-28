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
    // Validate permissions structure
    if (!Array.isArray(permissions)) {
      throw new Error(`Invalid permissions format for ${levelName}`);
    }

    const userLevel = await prisma.userLevels.findFirst({
      where: { name: levelName },
    });

    if (!userLevel) {
      console.log(`⚠️ User level ${levelName} not found`);
      continue;
    }

    // Validate each permission
    permissions.forEach((permission) => {
      if (!permission.subject || typeof permission.subject !== "string") {
        throw new Error(`Invalid subject in ${levelName} permissions`);
      }
      if (!Array.isArray(permission.action) || permission.action.length === 0) {
        throw new Error(
          `Invalid actions for subject ${permission.subject} in ${levelName}`
        );
      }
    });

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
    // Validate each action
    action.forEach((act) => {
      if (!act || typeof act !== "string") {
        throw new Error(`Invalid action "${act}" for subject "${subject}"`);
      }
      if (!["read", "create", "update", "delete"].includes(act)) {
        throw new Error(`Unsupported action "${act}" for subject "${subject}"`);
      }
    });

    // Check if feature exists
    const existingFeature = await prisma.features.findUnique({
      where: { name: subject },
    });

    if (!existingFeature) {
      console.log(`Creating new feature: ${subject}`);
      await prisma.features.create({
        data: { id: ulid(), name: subject },
      });
    }

    // Check existing actions and only create new ones
    const existingActions = await prisma.actions.findMany({
      where: {
        namaFeature: subject,
        name: { in: action },
      },
    });

    const existingActionNames = new Set(existingActions.map((a) => a.name));
    const newActions = action.filter((act) => !existingActionNames.has(act));

    if (newActions.length > 0) {
      const actionCreateData = newActions.map((actionName) => ({
        id: ulid(),
        name: actionName,
        namaFeature: subject,
      }));

      console.log(`Creating new actions for ${subject}:`, newActions);
      await prisma.actions.createMany({
        data: actionCreateData,
        skipDuplicates: true,
      });
    }
  }
}

async function createAclEntries(
  prisma: PrismaClient,
  permissions: Permission[],
  userLevelId: string
): Promise<void> {
  if (!userLevelId) {
    throw new Error("Invalid userLevelId");
  }

  const aclEntries: Prisma.AclCreateManyInput[] = [];

  for (const { subject, action } of permissions) {
    // Verify feature exists
    const feature = await prisma.features.findUnique({
      where: { name: subject },
    });

    if (!feature) {
      throw new Error(`Feature "${subject}" not found`);
    }

    // Verify all actions exist for this feature
    const existingActions = await prisma.actions.findMany({
      where: {
        namaFeature: subject,
        name: { in: action },
      },
    });

    const missingActions = action.filter(
      (a) => !existingActions.find((ea) => ea.name === a)
    );

    if (missingActions.length > 0) {
      throw new Error(
        `Missing actions for feature "${subject}": ${missingActions.join(", ")}`
      );
    }

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
    console.log(`Creating ${aclEntries.length} new ACL entries`);
    await prisma.acl.createMany({
      data: aclEntries,
      skipDuplicates: true,
    });
  }
}
