import { Roles } from "@prisma/client";

export function transformRoleToEnumRole(payload: any): Roles {
  if (!payload || typeof payload.role !== "string") {
    return Roles.USER;
  }

  switch (payload.role) {
    case "ADMIN":
      return Roles.ADMIN;
    case "PETUGAS_SUPER":
      return Roles.PETUGAS_SUPER;
    case "KEPALA_PETUGAS_UNIT":
      return Roles.KEPALA_PETUGAS_UNIT;
    case "PETUGAS":
      return Roles.PETUGAS;
    case "PETUGAS_WBS":
      return Roles.PETUGAS_WBS;
    case "KEPALA_WBS":
      return Roles.KEPALA_WBS;
    case "USER":
      return Roles.USER;
    case "MAHASISWA":
      return Roles.MAHASISWA;
    case "DOSEN":
      return Roles.DOSEN;
    default:
      return Roles.USER;
  }
}
