// src/entities/Unit.ts

import { User, Pengaduan, jenisUnit } from "@prisma/client";

// Base Unit interface
export interface Unit {
  id: string;
  nama_unit: string;
  petugasId?: string | null;
  petugas?: User;
  pengaduan?: Pengaduan[];
}

// DTO for creating new Unit
export interface UnitCreateDTO {
  nama_unit: string;
  jenis_unit: jenisUnit;
  petugasId?: string | null;
  kepalaUnit: string;
  pimpinanUnitId: string;
}

// DTO for updating Unit
export interface UnitUpdateDTO {
  nama_unit?: string;
  petugasId?: string | null;
  isActive?: boolean;
  kepalaUnit?: string;
}

// DTO for Unit response
export interface UnitDTO {
  id: string;
  nama_unit: string;
  petugas?: {
    id: string;
    name: string;
    email: string;
    no_identitas: string;
  };
}

export interface RemovePetugasDTO {
  petugasIds: string[];
}

// DTO for adding petugas to unit
export interface AddPetugasDTO {
  // nama_unit: string;
  petugasIds: string[];
}
