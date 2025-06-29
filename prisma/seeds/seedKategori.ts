import { PrismaClient } from "@prisma/client";

export async function seedKategori(prisma: PrismaClient) {
  const countKategori = await prisma.kategori.count();
  if (countKategori === 0) {
    await prisma.kategori.create({
      data: {
        nama: "kemahasiswaan",
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "akademik",
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Administrasi dan Layanan",
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Fasilitas Kampus",
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Keamanan dan Ketertiban",
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "kebersihan",
      },
    });
    console.log("Kategori seeded");
  }
}

export async function seedKategoriWBS(prisma: PrismaClient) {
  const KategoriWBS = await prisma.kategori.count({
    where: { isWBS: true },
  });
  if (KategoriWBS === 0) {
    await prisma.kategori.create({
      data: {
        nama: "Korupsi atau Gratifikasi",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Penyalahgunaan Wewenang",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Pelanggaran Etika",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Pencurian atau Penipuan",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Pelanggaran Kesehatan dan Keselamatan Kerja (K3)",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Perlakuan Tidak Adil atau Diskriminasi",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Kerugian Keuangan",
        isWBS: true,
      },
    });
    await prisma.kategori.create({
      data: {
        nama: "Pelanggaran Terhadap Regulasi atau Hukum",
        isWBS: true,
      },
    });
  }
}
