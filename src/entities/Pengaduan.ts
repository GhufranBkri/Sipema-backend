// src/entities/Pengaduan.ts

import { Status } from "@prisma/client";

export interface PengaduanDTO {
  id: string;
  judul: string;
  deskripsi: string;
  response: string;
  kategoriId: string;
  pelaporId: string;
  nameUnit: string;
  status: Status;
  filePendukung?: string;
  filePetugas?: string;
  harapanPelapor?: string;
  approvedBy?: string;
}
