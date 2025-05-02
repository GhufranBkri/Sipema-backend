import { PrismaClient, jenisUnit } from "@prisma/client";
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

  const direktorat = [
    "Direktorat Administrasi Akademik",
    "Direktorat Kemahasiswaan dan Alumni",
    "Direktorat Sumber Daya",
    "Direktorat Perencanaan dan Kemitraan",
    "Direktorat Keuangan",
  ];

  const LEMBAGA = [
    "Lembaga Penelitian dan Pengabdian Kepada Masyarakat",
    "Lembaga Penjaminan Mutu",
  ];

  const UPT = [
    "UPT Perpustakaan dan E-Learning",
    "UPT Teknologi Informasi dan Komunikasi",
    "UPT Pusat Bahasa",
    "UPT Laboratorium Terpadu",
    "UPT Mitigasi Bencana",
    "UPT Kewirausahaan",
    "UPT Percetakan",
    "UPT Mata Kuliah Umum",
    "UPT KUI",
    "UPT Asrama",
    "UPT CDC",
    "UPT Bimbingan Konseling",
    "UPT Rumah Sakit Pendidikan",
  ];

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

  // Helper function to create users and unit
  const createUnitWithUsers = async (
    unitName: string,
    jenisUnit: jenisUnit
  ) => {
    // Generate a shortcode from name for ID purposes
    const shortName = unitName
      .replace(/UPT |Fakultas |Sekolah |dan |Ilmu /g, "")
      .split(" ")
      .map((word: string) => word[0])
      .join("");

    // Create head user
    const headUser = await prisma.user.create({
      data: {
        id: ulid(),
        email: `kepala.${shortName.toLowerCase()}@example.com`,
        no_identitas: kepalaCounter.toString(),
        name: `Kepala ${unitName}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: kepalaUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    kepalaCounter++; // Increment counter

    // Create pimpinan unit user
    const pimpinanUnit = await prisma.user.create({
      data: {
        id: ulid(),
        email: `pimpinan.${shortName.toLowerCase()}@example.com`,
        no_identitas: pimpinanCounter.toString(),
        name: `Pimpinan ${unitName}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: pimpinanUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    pimpinanCounter++; // Increment counter

    // Create staff user
    const staffUser = await prisma.user.create({
      data: {
        id: ulid(),
        email: `petugas.${shortName.toLowerCase()}@example.com`,
        no_identitas: petugasCounter.toString(),
        name: `Petugas ${unitName}`,
        password: await bcrypt.hash("password123", 10),
        userLevelId: petugasUserLevel?.id ?? "",
        no_telphone: `08123456${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`,
      },
    });
    petugasCounter++; // Increment counter

    // Create the unit
    await prisma.unit.create({
      data: {
        id: ulid(),
        nama_unit: unitName,
        jenis_unit: jenisUnit,
        kepalaUnitId: headUser.no_identitas,
        pimpinanUnitId: pimpinanUnit.no_identitas,
        petugas: {
          connect: { no_identitas: staffUser.no_identitas },
        },
      },
    });

    console.log(`Created unit: ${unitName}`);
  };

  // Create faculties and associated users
  for (const faculty of faculties) {
    await createUnitWithUsers(faculty, "FAKULTAS");
  }

  // Create UPT units and associated users
  for (const uptUnit of UPT) {
    await createUnitWithUsers(uptUnit, "UPT");
  }

  for (const lembagaUnit of LEMBAGA) {
    await createUnitWithUsers(lembagaUnit, "LEMBAGA");
  }

  for (const direktoratUnit of direktorat) {
    await createUnitWithUsers(direktoratUnit, "DIREKTORAT");
  }

  console.log("Units and associated users seeded successfully");
}
