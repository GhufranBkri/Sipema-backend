import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
  ConflictResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { User } from "@prisma/client";
import { UserDTO, UserRegisterDTO } from "$entities/User";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";

export type CreateResponse = User | {};
export async function create(
  data: UserRegisterDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        no_identitas: data.no_identitas,
      },
    });
    if (existingUser)
      return ConflictResponse("Nomor identitas sudah terdaftar");

    const finduserLevel = await prisma.userLevels.findUnique({
      where: {
        name: data.userLevelName,
      },
    });

    if (!finduserLevel) return INVALID_ID_SERVICE_RESPONSE;

    // Create a new object without userLevelName
    const { userLevelName, ...userData } = data;

    const user = await prisma.user.create({
      data: {
        ...userData,
        userLevelId: finduserLevel.id,
      },
    });

    return {
      status: true,
      data: user,
    };
  } catch (err) {
    Logger.error(`UserService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<User[]> | {};
export async function getAll(
  filters: FilteringQueryV2
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    const [user, totalData] = await Promise.all([
      prisma.user.findMany({
        ...usedFilters,
        include: {
          unit_petugas: {
            select: {
              nama_unit: true,
            },
          },
          userLevel: {
            select: {
              name: true,
            },
          },
          pengaduan: {
            select: {
              id: true,
              judul: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: user,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`UserService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = User | {};
export async function getById(
  no_identitas: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let user = await prisma.user.findUnique({
      where: {
        no_identitas,
      },
    });

    if (!user) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: user,
    };
  } catch (err) {
    Logger.error(`UserService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = User | {};
export async function update(
  no_identitas: string,
  data: UserDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let user = await prisma.user.findUnique({
      where: {
        no_identitas,
      },
    });

    if (!user) return INVALID_ID_SERVICE_RESPONSE;

    user = await prisma.user.update({
      where: {
        no_identitas,
      },
      data,
    });

    return {
      status: true,
      data: user,
    };
  } catch (err) {
    Logger.error(`UserService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    // Validate all no_identitas exist
    const users = await prisma.user.findMany({
      where: {
        no_identitas: { in: idArray },
      },
      select: { no_identitas: true },
    });

    if (users.length !== idArray.length) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    await Promise.all(
      idArray.map(async (no_identitas) => {
        await prisma.pengaduan.deleteMany({
          where: {
            pelaporId: no_identitas,
          },
        });
        await prisma.pengaduanWBS.deleteMany({
          where: {
            pelaporId: no_identitas,
          },
        });
      })
    );

    await Promise.all(
      idArray.map(async (no_identitas) => {
        await prisma.user.delete({
          where: {
            no_identitas,
          },
        });
      })
    );

    return {
      status: true,
      data: true,
    };
  } catch (err) {
    Logger.error(`UserService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
