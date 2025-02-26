import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { PelaporanWBS } from "@prisma/client";
import { PelaporanWBSDTO } from "$entities/PelaporanWBS";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";

export type CreateResponse = PelaporanWBS | {};
export async function create(
  user: UserJWTDAO,
  data: PelaporanWBSDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Format tanggalKejadian to yyyy-mm-dd if it exists
    if (data.tanggalKejadian) {
      data.tanggalKejadian = new Date(data.tanggalKejadian);
    }

    const pelaporanWBS = await prisma.pelaporanWBS.create({
      data: {
        ...data,
        pelaporId: user.no_identitas,
      },
    });

    return {
      status: true,
      data: pelaporanWBS,
    };
  } catch (err) {
    Logger.error(`PelaporanWBSService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<PelaporanWBS[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);
    usedFilters.include = {
      kategori: {
        select: {
          nama: true,
        },
      },
      pelapor: {
        select: {
          name: {
            select: {
              name: true,
              no_identitas: true,
              email: true,
              role: true,
              program_studi: true,
            },
          },
        },
      },
    };
    const [pelaporanWBS, totalData] = await Promise.all([
      prisma.pelaporanWBS.findMany(usedFilters),
      prisma.pelaporanWBS.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: pelaporanWBS,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`PelaporanWBSService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = PelaporanWBS | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let pelaporanWBS = await prisma.pelaporanWBS.findUnique({
      where: {
        id,
      },
    });

    if (!pelaporanWBS) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: pelaporanWBS,
    };
  } catch (err) {
    Logger.error(`PelaporanWBSService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = PelaporanWBS | {};
export async function update(
  id: string,
  data: PelaporanWBSDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let pelaporanWBS = await prisma.pelaporanWBS.findUnique({
      where: {
        id,
      },
    });

    if (!pelaporanWBS) return INVALID_ID_SERVICE_RESPONSE;

    pelaporanWBS = await prisma.pelaporanWBS.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: pelaporanWBS,
    };
  } catch (err) {
    Logger.error(`PelaporanWBSService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    idArray.forEach(async (id) => {
      await prisma.pelaporanWBS.delete({
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
    Logger.error(`PelaporanWBSService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
