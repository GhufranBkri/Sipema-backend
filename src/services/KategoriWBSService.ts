import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { KategoriWBS } from "@prisma/client";
import { KategoriWBSDTO } from "$entities/KategoriWBS";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";

export type CreateResponse = KategoriWBS | {};
export async function create(
  data: KategoriWBSDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    const KategoriWBS = await prisma.kategoriWBS.create({
      data,
    });

    return {
      status: true,
      data: KategoriWBS,
    };
  } catch (err) {
    Logger.error(`KategoriWBSService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<KategoriWBS[]> | {};
export async function getAll(
  filters: FilteringQueryV2
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    const [KategoriWBS, totalData] = await Promise.all([
      prisma.kategoriWBS.findMany(usedFilters),
      prisma.kategoriWBS.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: KategoriWBS,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`KategoriWBSService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = KategoriWBS | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let KategoriWBS = await prisma.kategoriWBS.findUnique({
      where: {
        id,
      },
    });

    if (!KategoriWBS) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: KategoriWBS,
    };
  } catch (err) {
    Logger.error(`KategoriWBSService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = KategoriWBS | {};
export async function update(
  id: string,
  data: KategoriWBSDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let KategoriWBS = await prisma.kategoriWBS.findUnique({
      where: {
        id,
      },
    });

    if (!KategoriWBS) return INVALID_ID_SERVICE_RESPONSE;

    KategoriWBS = await prisma.kategoriWBS.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: KategoriWBS,
    };
  } catch (err) {
    Logger.error(`KategoriWBSService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    idArray.forEach(async (id) => {
      await prisma.kategoriWBS.delete({
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
    Logger.error(`KategoriWBSService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
