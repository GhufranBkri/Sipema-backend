import { Status } from "@prisma/client";

export interface PelaporanWBSDTO {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pihakTerlibat: string;
  kategoriId: string;
  pelaporId: string;
  status: Status;
  tanggalKejadian: Date;
  filePendukung?: string;
  filePetugas?: string;
  unit: string;
  petugasWBSId?: string;
}
