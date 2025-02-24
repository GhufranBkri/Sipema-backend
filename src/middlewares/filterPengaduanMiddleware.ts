// filterPengaduanMiddleware.ts
import { Context, Next } from "hono";
import { Roles } from "@prisma/client";
import { response_forbidden } from "$utils/response.utils";
import { transformRoleToEnumRole } from "$utils/user.utils";
import { FilteringQueryV2 } from "$entities/Query";
import { prisma } from "$utils/prisma.utils";
import { UserJWTDAO } from "$entities/User";

// filterPengaduanMiddleware.ts
export async function filterPengaduanByRole(c: Context, next: Next) {
  // Parse query filters
  const queryFilters = c.req.query("filters");
  let filters: FilteringQueryV2 = {
    filters: queryFilters ? JSON.parse(queryFilters) : {},
  };

  const jwtPayload: UserJWTDAO = c.get("jwtPayload");
  const noIdentitas = jwtPayload.no_identitas;
  const role = transformRoleToEnumRole(jwtPayload);

  // Force role-based filters
  switch (role) {
    case Roles.PETUGAS_SUPER:
      break; // No additional filters

    case Roles.USER:
      filters.filters = {
        ...filters.filters,
        pelaporId: noIdentitas,
      };
      break;


    case Roles.DOSEN:
      filters.filters = {
        ...filters.filters,
        pelaporId: noIdentitas,
      };
      break;


    case Roles.MAHASISWA:
    filters.filters = {
      ...filters.filters,
      pelaporId: noIdentitas,
    };
    break;

      

    case Roles.PETUGAS:
      const officerUnit = await prisma.unit.findFirst({
        where: { 
          petugas: { 
            some: { no_identitas: noIdentitas } 
          } 
        },
      });

      if (!officerUnit) {
        return response_forbidden(c, "You are not assigned to any unit");
      }

      filters.filters = {
        ...filters.filters,
        nameUnit: officerUnit.nama_unit,
      };
      break;

    default:
      return response_forbidden(c, "Invalid role");
  }

  c.set("filters", filters);
  await next();
}
