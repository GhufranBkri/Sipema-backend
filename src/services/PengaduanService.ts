import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  BadRequestWithMessage,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import { prisma } from "$utils/prisma.utils";
import { Pengaduan } from "@prisma/client";
import { PengaduanDTO } from "$entities/Pengaduan";
import { ErrorHandler } from "$utils/errorHandler";
import Logger from "$pkg/logger";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";

export type CreateResponse = Pengaduan | {};
export async function create(
  data: PengaduanDTO,
  user: UserJWTDAO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Create pengaduan
    const pengaduan = await prisma.pengaduan.create({
      data: {
        ...data,
        pelaporId: user.no_identitas,
      },
    });

    return {
      status: true,
      data: pengaduan,
    };
  } catch (error) {
    // If error is a ServiceResponse (from validator), return it directly

    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      !error.status
    ) {
      return error as ServiceResponse<CreateResponse>;
    }

    // Handle Prisma errors
    if (error instanceof PrismaClientKnownRequestError) {
      Logger.error(`Database Error: ${error.code} - ${error.message}`);
      return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
    }

    // Handle other errors
    Logger.error(
      `Service Error: ${
        error instanceof Error ? error.message : JSON.stringify(error)
      }`
    );
    return ErrorHandler.handleServiceError(error);
  }
}

export type GetAllResponse = PagedList<Pengaduan[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    // petugas universitas
    usedFilters.include = {
      pelapor: true,
      unit: {
        include: {
          petugas: true,
        },
      },
      kategori: true,
    };

    //dosen mahasiswa
    if (user.role === "DOSEN" || user.role === "MAHASISWA") {
      usedFilters.where.AND.push({
        pelaporId: user.no_identitas,
      });

      usedFilters.include = {
        unit: false,
      };
    }

    if (user.role === "KEPALA_PETUGAS_UNIT") {
      const unit = await prisma.unit.findFirst({
        where: {
          kepalaUnitId: user.no_identitas,
        },
      });

      if (!unit) {
        return BadRequestWithMessage("You are not assigned to any unit");
      }

      usedFilters.where.AND.push({
        nameUnit: unit.nama_unit,
      });
    }
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

    const [PengaduanDTO, totalData] = await Promise.all([
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
        entries: PengaduanDTO,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`PengaduanService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetTotalCountResponse =
  | { totalCount: number; totalCountMasyarakat: number }
  | {};
export async function getTotalCount(): Promise<
  ServiceResponse<GetTotalCountResponse>
> {
  try {
    const [totalCount, totalCountMasyarakat] = await Promise.all([
      prisma.pengaduan.count(),
      prisma.pengaduanMasyarakat.count(),
    ]);

    return {
      status: true,
      data: { totalCount, totalCountMasyarakat },
    };
  } catch (err) {
    Logger.error(`PengaduanService.getTotalCount : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = Pengaduan | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let Pengaduan = await prisma.pengaduan.findUnique({
      where: {
        id,
      },
    });

    if (!Pengaduan) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: Pengaduan,
    };
  } catch (err) {
    Logger.error(`PengaduanService.getById : ${err}`);
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
    let Pengaduan = await prisma.pengaduan.findUnique({
      where: {
        id,
      },
    });

    if (!Pengaduan) return INVALID_ID_SERVICE_RESPONSE;

    if (
      user.role === "PETUGAS" ||
      user.role === "KEPALA_PETUGAS_UNIT" ||
      user.role === "PETUGAS_SUPER"
    ) {
      Pengaduan = await prisma.pengaduan.update({
        where: {
          id,
        },
        data: {
          ...data,
          approvedBy: user.no_identitas,
        },
      });
    }

    Pengaduan = await prisma.pengaduan.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: Pengaduan,
    };
  } catch (err) {
    Logger.error(`PengaduanService.update : ${err}`);
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
    Logger.error(`KategoriService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
