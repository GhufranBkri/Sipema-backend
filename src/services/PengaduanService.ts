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
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import { NotificationUtils } from "$utils/notification.utils";

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

    // Get staff members
    const unit = await prisma.unit.findUnique({
      where: { nama_unit: data.nameUnit },
    });

    const staff = await prisma.user.findMany({
      where: {
        unitId: unit?.id,
        role: { in: ["PETUGAS", "KEPALA_PETUGAS_UNIT"] },
      },
    });

    // Send notifications to all staff members
    for (const staffMember of staff) {
      await NotificationUtils.sendNewComplaintNotification(
        data,
        staffMember.no_identitas,
        pengaduan.id
      );
    }

    return { status: true, data: pengaduan };
  } catch (error) {
    // Error handling
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
        kategori: true,
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
        nameUnit: officerUnit.nama_unit,
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
      if (data.status) {
        await NotificationUtils.sendStatusUpdateNotification(
          Pengaduan.judul,
          Pengaduan.status,
          Pengaduan.pelaporId,
          Pengaduan.id,
          user.no_identitas
        );
      }
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
