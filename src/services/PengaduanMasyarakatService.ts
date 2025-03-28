import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  BadRequestWithMessage,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { Pengaduan, TypePengaduan } from "@prisma/client";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import WaService from "./waService";
import { PengaduanDTO } from "$entities/Pengaduan";

const waService = new WaService();

export type CreateResponse = Pengaduan | {};
export async function create(
  data: PengaduanDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Create pengaduan
    const pengaduan = await prisma.pengaduan.create({
      data: {
        ...data,
        tipePengaduan: TypePengaduan.MASYARAKAT,
      },
    });

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

export type GetAllResponse = PagedList<Pengaduan[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    // petugas universiatas can only see pengaduan masyarakat
    usedFilters.include = {
      unit: {
        include: {
          petugas: true,
        },
      },
      kategori: true,
    };

    const userLevel = await prisma.userLevels.findUnique({
      where: {
        id: user.userLevelId,
      },
    });

    if (!userLevel) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    if (
      userLevel.name === "PETUGAS" ||
      userLevel.name === "KEPALA_PETUGAS_UNIT"
    ) {
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
        unitId: officerUnit.id, // Menggunakan nameUnit bukan unit
      });
    }

    const [pengaduan, totalData] = await Promise.all([
      prisma.pengaduan.findMany(usedFilters),
      prisma.pengaduan.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: pengaduan,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`PengaduanMasyarakatService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = Pengaduan | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let pengaduanMasyarakat = await prisma.pengaduan.findUnique({
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

export type UpdateResponse = Pengaduan | {};
export async function update(
  id: string,
  data: PengaduanDTO,
  user: UserJWTDAO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let pengaduanMasyarakat = await prisma.pengaduan.findUnique({
      where: { id },
    });

    if (!pengaduanMasyarakat) return INVALID_ID_SERVICE_RESPONSE;

    // Update only allowed fields
    pengaduanMasyarakat = await prisma.pengaduan.update({
      where: { id },
      data: {
        ...data,
        approvedBy: user.no_identitas,
      },
    });

    // Send WhatsApp notification
    const waService = new WaService();
    await waService.sendStatusUpdate(
      pengaduanMasyarakat.no_telphone || "",
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
      await prisma.pengaduan.delete({
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
