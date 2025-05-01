import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

export async function seedUserLevels(prisma: PrismaClient) {
  const countUserLevels = await prisma.userLevels.count();

  const userLevelAkses = [
    "TENAGA_KEPENDIDIKAN",
    "MAHASISWA",
    "DOSEN",
    "ADMIN",
    "PETUGAS_SUPER",
    "PETUGAS_WBS",
    "KEPALA_WBS",
    "PETUGAS",
    "KEPALA_PETUGAS_UNIT",
    "PIMPINAN_UNIT",
    "PIMPINAN_UNIVERSITAS",
  ];

  if (countUserLevels === 0) {
    userLevelAkses.forEach(async (userLevel) => {
      await prisma.userLevels.create({
        data: {
          id: ulid(),
          name: userLevel,
        },
      });
    });
  }

  console.log("User Levels seeded");
}
