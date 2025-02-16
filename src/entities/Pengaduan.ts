// src/entities/Pengaduan.ts

export interface PengaduanDTO {
    id: string;
    judul: string;
    deskripsi: string;
    response: string;
    kategoriId: string;
    pelaporId: string;
    nameUnit: string;
    filePendukung?: string;
    filePetugas?: string;
    harapanPelapor?: string;

}
