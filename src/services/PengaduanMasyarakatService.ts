import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  BadRequestWithMessage,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { PengaduanMasyarakat } from "@prisma/client";
import { PengaduanMasyarakatDTO } from "$entities/PengaduanMasyarakat";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import WaService from "./waService";

const waService = new WaService();

export type CreateResponse = PengaduanMasyarakat | {};
export async function create(
  data: PengaduanMasyarakatDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Create pengaduan
    const pengaduan = await prisma.pengaduanMasyarakat.create({
      data,
    });

    // Prepare WhatsApp template data
    // Send WhatsApp notification
    if (data.no_telphone) {
      await waService.sendMessage(data.no_telphone, data);
    }

    return {
      status: true,
      data: pengaduan,
    };
  } catch (error) {
    Logger.error("Create pengaduan error:", error);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<PengaduanMasyarakat[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  filterByRole: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    // petugas universiatas can only see pengaduan masyarakat
    usedFilters.include = {
      pelapor: true,
      unit: {
        include: {
          petugas: true,
        },
      },
      kategori: true,
    };

    if (user.role === "PETUGAS") {
      const officerUnit = await prisma.unit.findFirst({
        where: {
          petugas: {
            some: { no_identitas: user.no_identitas },
          },
        },
      });

      if (!officerUnit) {
        return BadRequestWithMessage("You are not assigned to any unit");
      }

      usedFilters.where.AND.push({
        nameUnit: officerUnit.nama_unit, // Menggunakan nameUnit bukan unit
      });
    }

    const [pengaduanMasyarakat, totalData] = await Promise.all([
      prisma.pengaduanMasyarakat.findMany(usedFilters),
      prisma.pengaduanMasyarakat.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: pengaduanMasyarakat,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`PengaduanMasyarakatService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = PengaduanMasyarakat | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let pengaduanMasyarakat = await prisma.pengaduanMasyarakat.findUnique({
      where: {
        id,
      },
    });

    if (!pengaduanMasyarakat) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: pengaduanMasyarakat,
    };
  } catch (err) {
    Logger.error(`PengaduanMasyarakatService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = PengaduanMasyarakat | {};
export async function update(
  id: string,
  data: PengaduanMasyarakatDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let pengaduanMasyarakat = await prisma.pengaduanMasyarakat.findUnique({
      where: { id },
    });

    if (!pengaduanMasyarakat) return INVALID_ID_SERVICE_RESPONSE;

    // Update only allowed fields
    pengaduanMasyarakat = await prisma.pengaduanMasyarakat.update({
      where: { id },
      data,
    });

    // Send WhatsApp notification
    const waService = new WaService();
    await waService.sendStatusUpdate(
      pengaduanMasyarakat.no_telphone,
      pengaduanMasyarakat
    );

    return {
      status: true,
      data: pengaduanMasyarakat,
    };
  } catch (err) {
    Logger.error(`PengaduanMasyarakatService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    idArray.forEach(async (id) => {
      await prisma.pengaduanMasyarakat.delete({
        where: {
          id,
        },
      });
    });

    return {
      status: true,
      data: {},
    };
  } catch (err) {
    Logger.error(`PengaduanMasyarakatService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
