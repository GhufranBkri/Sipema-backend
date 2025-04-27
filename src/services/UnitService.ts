import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
  BadRequestWithMessage,
  ConflictResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { Unit, User } from "@prisma/client";
import {
  UnitCreateDTO,
  UnitUpdateDTO,
  UnitDTO,
  AddPetugasDTO,
} from "$entities/Unit";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";

export type CreateResponse = Unit | {};
export async function create(
  data: UnitCreateDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Check if unit name exists
    const unitExist = await prisma.unit.findUnique({
      where: { nama_unit: data.nama_unit },
    });

    if (unitExist) {
      return ConflictResponse("Unit with this name already exists");
    }

    if (data.petugasId) {
      const petugasExists = await prisma.user.findUnique({
        where: { no_identitas: data.petugasId },
      });

      if (!petugasExists) {
        return BadRequestWithMessage("Referenced Petugas not found");
      }
    }

    const unit = await prisma.unit.create({
      data: {
        ...data,
        kepalaUnit: {
          connect: { no_identitas: data.kepalaUnit },
        },
      },
    });

    if (data.kepalaUnit) {
      await prisma.user.update({
        where: {
          no_identitas: data.kepalaUnit,
        },

        data: {
          unitId: unit.id,
        },
      });
    }

    return {
      status: true,
      data: unit,
    };
  } catch (err) {
    Logger.error(`unitService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type AddPetugasResponse = Unit | {};
export async function addPetugas(
  data: AddPetugasDTO,
  user: UserJWTDAO
): Promise<ServiceResponse<AddPetugasResponse>> {
  try {
    // Update unitId for all specified users
    const updateResults = await Promise.all(
      data.petugasIds.map(async (id) => {
        return prisma.user.update({
          where: { no_identitas: id },
          data: {
            unitId: user.unitId,
          },
          select: {
            no_identitas: true,
            name: true,
            email: true,
            program_studi: true,
            unit_petugas: {
              select: {
                id: true,
                nama_unit: true,
              },
            },
          },
        });
      })
    );

    return {
      status: true,
      data: updateResults,
    };
  } catch (err) {
    Logger.error(`unitService.addPetugas : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deletePetugasByIds(
  petugasIds: string,
  user: UserJWTDAO
): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(petugasIds);
    const unitId = user.unitId;

    // Get valid user IDs - we can skip validation as it's done in middleware
    const existingUsers = await prisma.user.findMany({
      where: {
        no_identitas: { in: idArray },
        unitId: unitId,
        userLevel: {
          name: "PETUGAS",
        },
      },
    });

    const validUserIds = existingUsers.map((user) => user.no_identitas);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Disconnect users from unit relation
      await tx.unit.update({
        where: { id: unitId },
        data: {
          petugas: {
            disconnect: validUserIds.map((id) => ({ no_identitas: id })),
          },
        },
      });

      // Update unitId to null
      const updateResults = await tx.user.updateMany({
        where: {
          no_identitas: { in: validUserIds },
          unitId: unitId,
        },
        data: {
          unitId: null,
        },
      });

      return {
        disconnectCount: validUserIds.length,
        updateCount: updateResults.count,
      };
    });

    return {
      status: true,
      data: {
        message: `Successfully removed ${result.disconnectCount} petugas from unit`,
        updatedUsers: validUserIds,
        unitId: unitId,
        disconnectedCount: result.disconnectCount,
        updatedCount: result.updateCount,
      },
    };
  } catch (err) {
    Logger.error(`unitService.deletePetugasByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllPetugasResponse = PagedList<User[]> | {};
export async function getAllPetugas(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);
    usedFilters.include = {
      unit_petugas: {
        select: {
          id: true,
          nama_unit: true,
        },
      },
      userLevel: {
        select: {
          name: true,
        },
      },
    };
    usedFilters.where = {
      unitId: user.unitId ? user.unitId : undefined,
    };

    const [users, totalData] = await Promise.all([
      prisma.user.findMany(usedFilters),
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
        entries: users,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`UserService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<Unit[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user?: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    // Default include settings for public access
    usedFilters.include = {
      kepalaUnit: false,
      petugas: false,
      kepalaUnitId: false,
    };

    // Only proceed with user-specific includes if user is authenticated
    if (user?.userLevelId) {
      const userLevel = await prisma.userLevels.findUnique({
        where: {
          id: user.userLevelId,
        },
      });

      // Enhanced includes for admin and kepala petugas
      if (
        userLevel?.name === "ADMIN" ||
        userLevel?.name === "KEPALA_PETUGAS_UNIT"
      ) {
        usedFilters.include = {
          kepalaUnit: true,
          petugas: true,
        };
      }
    }

    const [units, totalData] = await Promise.all([
      prisma.unit.findMany(usedFilters),
      prisma.unit.count({
        where: usedFilters.where,
      }),
    ]);

    const totalPage = Math.max(1, Math.ceil(totalData / usedFilters.take));

    return {
      status: true,
      data: {
        entries: units,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`unitService.getAll : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = Unit | {};
export async function getById(
  nama_unit: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let Unit = await prisma.unit.findUnique({
      where: {
        nama_unit,
      },
    });

    if (!Unit) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: Unit,
    };
  } catch (err) {
    Logger.error(`unitService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = UnitDTO | {};
export async function update(
  id: string,
  data: UnitUpdateDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    if (data.kepalaUnit) {
      const kepalaUnit = await prisma.user.findUnique({
        where: { no_identitas: data.kepalaUnit },
      });

      if (!kepalaUnit) {
        return BadRequestWithMessage("Referenced Kepala Unit not found");
      }

      await prisma.user.update({
        where: {
          no_identitas: data.kepalaUnit,
        },
        data: {
          unitId: id,
        },
      });
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        ...data,
        kepalaUnit: data.kepalaUnit
          ? {
              connect: { no_identitas: data.kepalaUnit },
            }
          : undefined,
      },
    });

    return {
      status: true,
      data: updatedUnit,
    };
  } catch (err) {
    Logger.error(`UnitService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    // Use transaction to ensure all operations complete or none do
    await prisma.$transaction(async (tx) => {
      // First update all users to clear unitId for those associated with the units being deleted
      await tx.user.updateMany({
        where: {
          unitId: {
            in: idArray,
          },
        },
        data: {
          unitId: null,
        },
      });

      // Delete any pengaduan records associated with the units
      await tx.pengaduan.deleteMany({
        where: {
          unitId: {
            in: idArray,
          },
        },
      });

      // Delete the units themselves
      await tx.unit.deleteMany({
        where: {
          id: {
            in: idArray,
          },
        },
      });
    });

    return {
      status: true,
      data: {
        message: `Successfully deleted units and cleared associated user references`,
      },
    };
  } catch (err) {
    Logger.error(`unitService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
