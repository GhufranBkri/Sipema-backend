// PengaduanMasyarakat.ts
import { Status, TypePengaduan } from "@prisma/client";

export interface PengaduanDTO {
  id: string;
  judul: string;
  deskripsi: string;
  status: Status;
  unitId: string;
  response: string;
  NIK?: string;
  kategoriId: string;
  nama?: string;
  no_telphone: string;
  filePendukung: string;
  harapan_pelapor?: string;
  tipePengaduan: TypePengaduan;
  filePetugas?: string;
  harapanPelapor?: string;
  approvedBy?: string;
}
