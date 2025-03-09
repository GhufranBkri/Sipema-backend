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
import { Unit } from "@prisma/client";
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
    // Validate input
    let NameUnit = await prisma.unit.findUnique({
      where: { id: user.unitId },
    });
    if (!Array.isArray(data.petugasIds) || data.petugasIds.length === 0) {
      return BadRequestWithMessage("Invalid input data");
    }

    // Check if all petugasIds exist before updating
    const existingPetugas = await prisma.user.findMany({
      where: {
        no_identitas: {
          in: data.petugasIds,
        },
      },
    });

    if (existingPetugas.length !== data.petugasIds.length) {
      return BadRequestWithMessage("One or more petugas IDs do not exist");
    }

    // Use transaction to ensure data consistency
    const updatedUnit = await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({
        where: { nama_unit: NameUnit?.nama_unit },
      });

      if (!unit) {
        throw new Error("INVALID_ID");
      }

      return tx.unit.update({
        where: { nama_unit: NameUnit?.nama_unit },
        data: {
          petugas: {
            connect: data.petugasIds.map((id) => ({ no_identitas: id })),
          },
        },
        include: {
          petugas: {
            select: {
              no_identitas: true,
              name: true,
            },
          },
        },
      });
    });

    return {
      status: true,
      data: updatedUnit,
    };
  } catch (err) {
    Logger.error(`unitService.addPetugas : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deletePetugasByIds(
  nama_unit: string,
  petugasIds: string | string[]
): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = Array.isArray(petugasIds)
      ? petugasIds
      : JSON.parse(petugasIds);

    const unit = await prisma.unit.findUnique({
      where: { nama_unit },
    });

    if (!unit) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    const updatedUnit = await prisma.unit.update({
      where: { nama_unit },
      data: {
        petugas: {
          disconnect: idArray.map((id) => ({ no_identitas: id })),
        },
      },
    });

    return {
      status: true,
      data: updatedUnit,
    };
  } catch (err) {
    Logger.error(`unitService.deletePetugasByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<Unit[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    usedFilters.include = {
      kepalaUnitId: false,
    };
    if (user?.role === "ADMIN") {
      usedFilters.include = {
        kepalaUnit: true,
        petugas: true,
      };
    }

    const [Unit, totalData] = await Promise.all([
      prisma.unit.findMany(usedFilters),
      prisma.unit.count({
        where: usedFilters.where,
      }),
    ]);

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: Unit,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`unitService.getAll : ${err} `);
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

    await Promise.all(
      idArray.map(async (nama) => {
        await prisma.pengaduan.deleteMany({
          where: {
            nameUnit: nama,
          },
        });

        await prisma.pengaduanMasyarakat.deleteMany({
          where: {
            nameUnit: nama,
          },
        });
      })
    );
    idArray.forEach(async (nama_unit) => {
      await prisma.unit.delete({
        where: {
          nama_unit,
        },
      });
    });

    return {
      status: true,
      data: true,
    };
  } catch (err) {
    Logger.error(`unitService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
