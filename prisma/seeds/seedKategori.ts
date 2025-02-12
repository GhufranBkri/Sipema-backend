import { PrismaClient } from '@prisma/client';

export async function seedKategori(prisma: PrismaClient) {
    const countKategori = await prisma.kategori.count();
    if (countKategori === 0) {
        await prisma.kategori.create({
            data: {
                nama: "Akademik"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Fasilitas Kampus"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Administrasi dan Layanan"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Keamanan dan Ketertiban"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Etika dan Perilaku"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Keuangan dan Beasiswa"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Teknologi Informasi dan Sistem"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Pengajaran dan Pembelajaran"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Kemahasiswaan"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Kerjasama dan Hubungan Masyarakat"
            }
        });
        await prisma.kategori.create({
            data: {
                nama: "Lainnya"
            }
        });

        console.log("Kategori seeded");
    }
}