import { PrismaClient, Roles } from "@prisma/client";
import bcrypt from "bcrypt";
import { ulid } from "ulid";

export async function seedAdmin(prisma: PrismaClient) {
  // Check existing users for each role
  const countAdmin = await prisma.user.count({ where: { role: Roles.ADMIN } });
  const countUser = await prisma.user.count({
    where: { role: Roles.TENAGA_KEPENDIDIKAN },
  });
  const countMahasiswa = await prisma.user.count({
    where: { role: Roles.MAHASISWA },
  });
  const countDosen = await prisma.user.count({ where: { role: Roles.DOSEN } });

  const countKepalaPetugasUnit = await prisma.user.count({
    where: { role: Roles.KEPALA_PETUGAS_UNIT },
  });
  const countPetugasSuper = await prisma.user.count({
    where: { role: Roles.PETUGAS_SUPER },
  });
  const countPetugas = await prisma.user.count({
    where: { role: Roles.PETUGAS },
  });
  const countKepalaWBS = await prisma.user.count({
    where: { role: Roles.KEPALA_WBS },
  });
  // Admin seed
  if (countAdmin === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Admin",
        no_identitas: "1001",
        password: hashedPassword,
        email: "admin@test.com",
        role: Roles.ADMIN,
        program_studi: "ADMIN",
      },
    });
    console.log("Admin seeded");
  }

  // Dosen seed
  if (countDosen === 0) {
    const hashedPassword = await bcrypt.hash("dosen123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Dosen",
        no_identitas: "2002",
        password: hashedPassword,
        email: "dosen@test.com",
        role: Roles.DOSEN,
        program_studi: "Informatika",
      },
    });
    console.log("Dosen seeded");
  }

  // Kepala WBS seed
  if (countKepalaWBS === 0) {
    const hashedPassword = await bcrypt.hash("kepala123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Kepala WBS",
        no_identitas: "5002",
        password: hashedPassword,
        email: "kepalaWBS@test.com",
        role: Roles.KEPALA_WBS,
        program_studi: "KEPALA",
      },
    });
    console.log("Kepala WBS seeded");
  }

  // Mahasiswa seed
  if (countMahasiswa === 0) {
    const hashedPassword = await bcrypt.hash("Mahasiswa123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Dosen",
        no_identitas: "2003",
        password: hashedPassword,
        email: "mahasiswa@test.com",
        role: Roles.MAHASISWA,
        program_studi: "Informatika",
      },
    });
    console.log("Dosen seeded");
  }

  // Tenaga Kependidikan seed
  if (countUser === 0) {
    const hashedPassword = await bcrypt.hash("tendik123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Tenaga Kependidikan",
        no_identitas: "2001",
        password: hashedPassword,
        email: "tendik@test.com",
        role: Roles.TENAGA_KEPENDIDIKAN,
        program_studi: "Administrasi",
      },
    });
    console.log("Tenaga Kependidikan seeded");
  }

  // Petugas Super seed
  if (countPetugasSuper === 0) {
    const hashedPassword = await bcrypt.hash("super123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Petugas Super",
        no_identitas: "3001",
        password: hashedPassword,
        email: "super@test.com",
        role: Roles.PETUGAS_SUPER,
        program_studi: "SUPER",
      },
    });
    console.log("Petugas Super seeded");
  }

  // Kepala Unit seed
  if (countKepalaPetugasUnit === 0) {
    const hashedPassword = await bcrypt.hash("kepala123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Kepala Unit",
        no_identitas: "5001",
        password: hashedPassword,
        email: "kepala@test.com",
        role: Roles.KEPALA_PETUGAS_UNIT,
        program_studi: "KEPALA",
      },
    });
  }

  // Create Unit first
  if (countPetugas === 0) {
    const unit = await prisma.unit.create({
      data: {
        id: ulid(),
        nama_unit: "Unit TI",
        kepalaUnitId: "5001",
      },
    });

    // Petugas seed with unit assignment
    const hashedPassword = await bcrypt.hash("petugas123", 12);
    await prisma.user.create({
      data: {
        id: ulid(),
        name: "Petugas Unit TI",
        no_identitas: "4001",
        password: hashedPassword,
        email: "petugas@test.com",
        role: Roles.PETUGAS,
        program_studi: "Teknik Informatika",
        unit_petugas: {
          connect: {
            id: unit.id,
          },
        },
      },
    });
    console.log("Petugas and Unit seeded");
  }

  console.log("All roles seeding completed");
}
