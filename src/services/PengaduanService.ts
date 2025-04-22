import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  BadRequestWithMessage,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import { prisma } from "$utils/prisma.utils";
import { Pengaduan, TypePengaduan } from "@prisma/client";
import { ErrorHandler } from "$utils/errorHandler";
import Logger from "$pkg/logger";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import { NotificationUtils } from "$utils/notification.utils";
import { PengaduanDTO } from "$entities/Pengaduan";

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
        nama: user.name,
        tipePengaduan: TypePengaduan.USER,
        no_telphone: user.no_telphone || "",
      },
    });

    // Get staff members
    const unit = await prisma.unit.findUnique({
      where: { nama_unit: data.unitId },
    });

    const staff = await prisma.user.findMany({
      where: {
        unitId: unit?.id,
        userLevel: {
          name: {
            in: ["PETUGAS", "KEPALA_PETUGAS_UNIT"],
          },
        },
      },
    });

    Logger.info(
      "staff id:",
      staff.map((s) => s.no_identitas)
    );
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

    usedFilters.where = {
      AND: [
        {
          tipePengaduan: TypePengaduan.USER,
        },
      ],
    };
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
    const userLevel = await prisma.userLevels.findUnique({
      where: {
        id: user.userLevelId,
      },
    });

    if (!userLevel) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    if (
      userLevel.name === "DOSEN" ||
      userLevel.name === "MAHASISWA" ||
      userLevel.name === "MAHASISWA"
    ) {
      usedFilters.where.AND.push({
        pelaporId: user.no_identitas,
      });

      usedFilters.include = {
        unit: {
          select: {
            id: true,
            nama_unit: true,
          },
        },
        kategori: true,
      };
    }

    if (
      userLevel.name === "PETUGAS" ||
      userLevel.name === "KEPALA_PETUGAS_UNIT"
    ) {
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
        unitId: officerUnit.id, // Menggunakan nameUnit bukan unit
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
      prisma.pengaduan.count({
        where: {
          tipePengaduan: "MASYARAKAT",
        },
      }),
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
      include: {
        unit: {
          select: {
            id: true,
            nama_unit: true,
          },
        },
        kategori: true,
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

    const userLevel = await prisma.userLevels.findUnique({
      where: {
        id: user.userLevelId,
      },
    });

    if (!userLevel) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    if (
      userLevel.name === "PETUGAS" ||
      userLevel.name === "KEPALA_PETUGAS_UNIT" ||
      userLevel.name === "PETUGAS_SUPER"
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
          Pengaduan.pelaporId || "",
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
