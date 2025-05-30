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

    // Validate petugas if specified
    if (data.petugasId) {
      const petugasExists = await prisma.user.findUnique({
        where: { no_identitas: data.petugasId },
      });

      if (!petugasExists) {
        return BadRequestWithMessage("Referenced Petugas not found");
      }
    }

    // Validate pimpinan unit
    const pimpinanExists = await prisma.user.findUnique({
      where: { no_identitas: data.pimpinanUnitId },
    });

    if (!pimpinanExists) {
      return BadRequestWithMessage("Referenced Pimpinan Unit not found");
    }

    const unit = await prisma.unit.create({
      data: {
        nama_unit: data.nama_unit,
        jenis_unit: data.jenis_unit,
        kepalaUnit: {
          connect: { no_identitas: data.kepalaUnit },
        },
        pimpinanUnit: {
          connect: { no_identitas: data.pimpinanUnitId },
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
    // Find the unit where the user is either kepala unit or pimpinan unit
    const unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { kepalaUnitId: user.no_identitas },
          { pimpinanUnitId: user.no_identitas },
        ],
      },
    });

    if (!unit) {
      return BadRequestWithMessage(
        "User is not a kepala unit or pimpinan unit of any unit"
      );
    }

    // Update unitId for all specified users using the found unit's ID
    const updateResults = await Promise.all(
      data.petugasIds.map(async (id) => {
        const petugas = await prisma.user.findUnique({
          where: { no_identitas: id },
        });
        if (!petugas) {
          throw new Error(`Petugas with ID ${id} not found`);
        }

        return prisma.user.update({
          where: { no_identitas: id },
          data: {
            unitId: unit.id, // Use the found unit.id instead of user.unitId
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

    // Find the unit where the user is either kepala unit or pimpinan unit
    const unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { kepalaUnitId: user.no_identitas },
          { pimpinanUnitId: user.no_identitas },
        ],
      },
    });

    if (!unit) {
      return BadRequestWithMessage(
        "User is not a kepala unit or pimpinan unit of any unit"
      );
    }

    const unitId = unit.id;

    // Get valid user IDs
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
      pimpinanUnitId: false,
    };

    // Pastikan where sudah diinisialisasi
    if (!usedFilters.where) {
      usedFilters.where = {};
    }

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

      // Filter only active units for non-admin users
      if (userLevel?.name !== "ADMIN") {
        usedFilters.where = {
          ...usedFilters.where,
          isActive: true,
        };
      }
    } else {
      // Filter for public/unauthenticated users
      usedFilters.where = {
        ...usedFilters.where,
        isActive: true,
      };
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
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let Unit = await prisma.unit.findUnique({
      where: {
        id,
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

export type GetAllPetugasResponse = User[] | {};
export async function getAllPetugas(
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllPetugasResponse>> {
  try {
    // Find units where the user is either kepala unit or pimpinan unit
    const unit = await prisma.unit.findFirst({
      where: {
        OR: [
          { kepalaUnitId: user.no_identitas },
          { pimpinanUnitId: user.no_identitas },
        ],
      },
      select: {
        id: true,
        nama_unit: true,
        kepalaUnitId: true,
        pimpinanUnitId: true,
      },
    });

    if (!unit) {
      return BadRequestWithMessage(
        "User is not a kepala unit or pimpinan unit of any unit"
      );
    }

    // Fetch all petugas for the unit
    const petugas = await prisma.user.findMany({
      where: {
        unitId: unit.id,
        userLevel: {
          name: "PETUGAS",
        },
      },
      select: {
        no_identitas: true,
        name: true,
        email: true,
        program_studi: true,
        no_telphone: true,
        unit_petugas: {
          select: {
            id: true,
            nama_unit: true,
          },
        },
        userLevel: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      status: true,
      data: petugas,
    };
  } catch (err) {
    Logger.error(`unitService.getAllPetugas : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
