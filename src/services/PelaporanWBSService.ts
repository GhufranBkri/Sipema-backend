import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";

import { PelaporanWBSDTO } from "$entities/PelaporanWBS";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import { NotificationUtils } from "$utils/notification.utils";
import { PengaduanWBS } from "@prisma/client";

export type CreateResponse = PengaduanWBS | {};
export async function create(
  user: UserJWTDAO,
  data: PelaporanWBSDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    // Format tanggalKejadian to yyyy-mm-dd if it exists
    if (data.tanggalKejadian) {
      data.tanggalKejadian = new Date(data.tanggalKejadian);
    }

    const pelaporanWBS = await prisma.pengaduanWBS.create({
      data: {
        ...data,
        pelaporId: user.no_identitas,
      },
    });

    const staff = await prisma.user.findMany({
      where: {
        userLevel: {
          name: { in: ["KEPALA_WBS", "PETUGAS_WBS"] },
        },
      },
    });

    for (const staffMember of staff) {
      await NotificationUtils.sendNewComplaintWBSNotfication(
        pelaporanWBS.judul,
        staffMember.no_identitas,
        pelaporanWBS.id
      );
    }

    return {
      status: true,
      data: pelaporanWBS,
    };
  } catch (err) {
    Logger.error(`PelaporanWBSService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<PengaduanWBS[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    // petugas universitas
    usedFilters.include = {
      pelapor: true,
      kategori: true,
    };

    const userLevel = await prisma.userLevels.findUnique({
      where: {
        id: user.userLevelId,
      },
    });

    if (!userLevel) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    // dosen or pelapor
    if (
      userLevel.name === "DOSEN" ||
      userLevel.name === "TENAGA_KEPENDIDIKAN" ||
      userLevel.name === "MAHASISWA"
    ) {
      usedFilters.where.AND.push({
        pelaporId: user.no_identitas,
      });
    }

    // petugasWBS
    if (userLevel.name === "PETUGAS_WBS" || userLevel.name === "KEPALA_WBS") {
      usedFilters.include = {
        pelapor: false,
        pelaporId: false,
        kategori: true,
      };
    }

    const [pelaporanWBS, totalData] = await Promise.all([
      prisma.pengaduanWBS.findMany(usedFilters),
      prisma.pengaduanWBS.count({
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

export type GetByIdResponse = PengaduanWBS | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let pelaporanWBS = await prisma.pengaduanWBS.findUnique({
      where: {
        id,
      },
      include: {
        kategori: true,
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

export type UpdateResponse = PengaduanWBS | {};
export async function update(
  id: string,
  data: PelaporanWBSDTO,
  user: UserJWTDAO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let pelaporanWBS = await prisma.pengaduanWBS.findUnique({
      where: {
        id,
      },
    });

    if (!pelaporanWBS) return INVALID_ID_SERVICE_RESPONSE;

    const userLevel = await prisma.userLevels.findUnique({
      where: {
        id: user.userLevelId,
      },
    });

    if (!userLevel) {
      return INVALID_ID_SERVICE_RESPONSE;
    }

    if (
      userLevel.name === "PETUGAS_WBS" ||
      userLevel.name === "KEPALA_WBS" ||
      userLevel.name === "PETUGAS_SUPER"
    ) {
      pelaporanWBS = await prisma.pengaduanWBS.update({
        where: {
          id,
        },
        data: {
          ...data,
          approvedBy: user.no_identitas,
        },
      });
      await NotificationUtils.sendStatusUpdateNotificationWBS(
        pelaporanWBS.judul,
        pelaporanWBS.status,
        pelaporanWBS.pelaporId,
        pelaporanWBS.id,
        user.no_identitas
      );
    }

    {
      pelaporanWBS = await prisma.pengaduanWBS.update({
        where: {
          id,
        },
        data,
      });
    }

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
      await prisma.pengaduanWBS.delete({
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
