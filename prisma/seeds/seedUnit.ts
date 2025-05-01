import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";
import * as bcrypt from "bcrypt";

export async function seedUnit(prisma: PrismaClient) {
  const countUnit = await prisma.unit.count();
  if (countUnit > 0) {
    console.log("Units already seeded");
    return;
  }

  // Ensure UserLevels exist
  const kepalaUserLevel = await prisma.userLevels.findUnique({
    where: { name: "KEPALA_PETUGAS_UNIT" },
  });

  const petugasUserLevel = await prisma.userLevels.findUnique({
    where: { name: "PETUGAS" },
  });

  const pimpinanUserLevel = await prisma.userLevels.findUnique({
    where: { name: "PIMPINAN_UNIT" },
  });

  // List of faculties
  const faculties = [
    "Fakultas Ekonomi dan Bisnis",
    "Fakultas Kedokteran Hewan",
    "Fakultas Hukum",
    "Fakultas Teknik",
    "Fakultas Pertanian",
    "Fakultas Keguruan dan Ilmu Pendidikan",
    "Fakultas Kedokteran",
    "Fakultas Matematika dan Ilmu Pengetahuan Alam",
    "Fakultas Ilmu Sosial dan Ilmu Politik",
    "Fakultas Kelautan dan Perikanan",
    "Fakultas Keperawatan",
    "Fakultas Kedokteran Gigi",
    "Sekolah Pasca Sarjana",
  ];

  // Initialize sequential counters
  let kepalaCounter = 6001;
  let petugasCounter = 4001;
  let pimpinanCounter = 7001;

  // Create units and associated users
  for (const faculty of faculties) {
    // Generate a shortcode from faculty name for ID purposes
    const shortName = faculty
      .replace("dan ", "")
      .split(" ")
      .map((word) => word[0])
      .join("");

    // Create head user
    const headUser = await prisma.user.create({
      data: {
        id: ulid(),
        email: `kepala.${shortName.toLowerCase()}@example.com`,
        no_identitas: kepalaCounter.toString(),
        name: `Kepala ${faculty}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: kepalaUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    kepalaCounter++; // Increment counter

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        id: ulid(),
        email: `petugas.${shortName.toLowerCase()}@example.com`,
        no_identitas: petugasCounter.toString(),
        name: `Petugas ${faculty}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: petugasUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    petugasCounter++; // Increment counter

    // Create pimpinan unit user
    const pimpinanUnit = await prisma.user.create({
      data: {
        id: ulid(),
        email: `pimpinan.${shortName.toLowerCase()}@example.com`,
        no_identitas: pimpinanCounter.toString(),
        name: `Pimpinan ${faculty}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: pimpinanUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    pimpinanCounter++; // Increment counter

    // Create the unit
    await prisma.unit.create({
      data: {
        id: ulid(),
        nama_unit: faculty,
        jenis_unit: "FAKULTAS",
        kepalaUnitId: headUser.no_identitas,
        pimpinanUnitId: pimpinanUnit.no_identitas,
        petugas: {
          connect: { no_identitas: staffUser.no_identitas },
        },
      },
    });

    console.log(`Created unit: ${faculty}`);
  }

  console.log("Units and associated users seeded successfully");
}
