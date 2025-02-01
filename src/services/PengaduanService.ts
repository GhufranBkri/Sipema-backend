import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import { prisma } from "$utils/prisma.utils";
import { Pengaduan, Roles } from "@prisma/client";
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
    usedFilters.include = {
      pelaporId: false,
      kategori: {
        select: {
          nama: true,
        },
      },
      pelapor:
        user.role === Roles.PETUGAS_SUPER
          ? {
              select: {
                name: true,
                no_identitas: true,
                email: true,
                role: true,
                program_studi: true,
              },
            }
          : false,
      unit: {
        select: {
          nama_unit: true,

          petugas: {
            select: {
              no_identitas: true,
              name: true,
            },
          },
        },
      },
    };

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
  data: PengaduanDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let Pengaduan = await prisma.pengaduan.findUnique({
      where: {
        id,
      },
    });

    if (!Pengaduan) return INVALID_ID_SERVICE_RESPONSE;

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
