import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { PetugasWBS } from "@prisma/client";
import { PetugasWBSDTO } from "$entities/PetugasWBS";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";

export type CreateResponse = PetugasWBS | {};
export async function create(
  data: PetugasWBSDTO,
  user: UserJWTDAO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    const petugasWBS = await prisma.petugasWBS.create({
      data: {
        ...data,
        kepalaWBSId: user.no_identitas,
      },
    });

    return {
      status: true,
      data: petugasWBS,
    };
  } catch (err) {
    Logger.error(`PetugasWBSService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<PetugasWBS[]> | {};
export async function getAll(
  filters: FilteringQueryV2
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    const [petugasWBS, totalData] = await Promise.all([
      prisma.petugasWBS.findMany(usedFilters),
      prisma.petugasWBS.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: petugasWBS,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`PetugasWBSService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = PetugasWBS | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let petugasWBS = await prisma.petugasWBS.findUnique({
      where: {
        id,
      },
    });

    if (!petugasWBS) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: petugasWBS,
    };
  } catch (err) {
    Logger.error(`PetugasWBSService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = PetugasWBS | {};
export async function update(
  id: string,
  data: PetugasWBSDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let petugasWBS = await prisma.petugasWBS.findUnique({
      where: {
        id,
      },
    });

    if (!petugasWBS) return INVALID_ID_SERVICE_RESPONSE;

    petugasWBS = await prisma.petugasWBS.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: petugasWBS,
    };
  } catch (err) {
    Logger.error(`PetugasWBSService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    idArray.forEach(async (id) => {
      await prisma.petugasWBS.delete({
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
    Logger.error(`PetugasWBSService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
