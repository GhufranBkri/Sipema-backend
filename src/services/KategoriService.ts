import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { Kategori } from "@prisma/client";
import { KategoriDTO } from "$entities/Kategori";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";

export type CreateResponse = Kategori | {};
export async function create(
  data: KategoriDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    const kategori = await prisma.kategori.create({
      data,
    });

    return {
      status: true,
      data: kategori,
    };
  } catch (err) {
    Logger.error(`KategoriService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<Kategori[]> | {};
export async function getAll(
  filters: FilteringQueryV2
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    const [kategori, totalData] = await Promise.all([
      prisma.kategori.findMany(usedFilters),
      prisma.kategori.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: kategori,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`KategoriService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = Kategori | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let kategori = await prisma.kategori.findUnique({
      where: {
        id,
      },
    });

    if (!kategori) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: kategori,
    };
  } catch (err) {
    Logger.error(`KategoriService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = Kategori | {};
export async function update(
  id: string,
  data: KategoriDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let kategori = await prisma.kategori.findUnique({
      where: {
        id,
      },
    });

    if (!kategori) return INVALID_ID_SERVICE_RESPONSE;

    kategori = await prisma.kategori.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: kategori,
    };
  } catch (err) {
    Logger.error(`KategoriService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    // Use transaction to ensure all operations complete or none do
    await prisma.$transaction(async (tx) => {
      // First delete all related PengaduanMasyarakat records
      await tx.pengaduan.deleteMany({
        where: {
          kategoriId: {
            in: idArray,
          },
        },
      });

      // Then delete the categories
      await tx.kategori.deleteMany({
        where: {
          id: {
            in: idArray,
          },
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
