import { FilteringQueryV2, PagedList } from "$entities/Query";
import {
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  INVALID_ID_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import Logger from "$pkg/logger";
import { prisma } from "$utils/prisma.utils";
import { Notification } from "@prisma/client";
import {
  NotificationDTO,
  NotificationOfficerAllert,
} from "$entities/Notification";
import { buildFilterQueryLimitOffsetV2 } from "./helpers/FilterQueryV2";
import { UserJWTDAO } from "$entities/User";
import { NotificationUtils } from "$utils/notification.utils";

export type CreateResponse = Notification | {};
export async function create(
  data: NotificationDTO
): Promise<ServiceResponse<CreateResponse>> {
  try {
    const notification = await prisma.notification.create({
      data,
    });

    return {
      status: true,
      data: notification,
    };
  } catch (err) {
    Logger.error(`NotificationService.create : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type sendAllertToOfficer = Notification | {};
export async function sendAllertToOfficerAllert(
  data: NotificationOfficerAllert
): Promise<ServiceResponse<sendAllertToOfficer>> {
  try {
    const pengaduan = await prisma.pengaduan.findUnique({
      where: {
        id: data.pengaduanId,
      },
    });

    if (!pengaduan) {
      Logger.error(`Pengaduan with ID ${data.pengaduanId} not found`);
      return INVALID_ID_SERVICE_RESPONSE;
    }

    const staff = await prisma.user.findMany({
      where: {
        unitId: pengaduan.unitId,
        userLevel: {
          name: {
            in: ["PETUGAS", "KEPALA_PETUGAS_UNIT"],
          },
        },
      },
    });

    Logger.info(
      `Found ${staff.length} staff members for unit ${pengaduan.unitId}`
    );

    // Track notifications sent
    let notificationsSent = 0;

    for (const staffMember of staff) {
      await NotificationUtils.sendNewNotifyOfficerAlert(
        pengaduan.judul,
        staffMember.no_identitas,
        pengaduan.id
      );
      notificationsSent++;
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id: pengaduan.unitId,
      },
    });

    if (unit && unit.kepalaUnitId) {
      await NotificationUtils.sendNewNotifyOfficerAlert(
        pengaduan.judul,
        unit.kepalaUnitId,
        pengaduan.id
      );
      notificationsSent++;
    }

    return {
      status: true,
      data: {
        successCount: notificationsSent,
        message: `Successfully sent ${notificationsSent} notifications`,
      },
    };
  } catch (err) {
    Logger.error(`NotificationService.sendAllertToOfficerAllert : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetAllResponse = PagedList<Notification[]> | {};
export async function getAll(
  filters: FilteringQueryV2,
  user: UserJWTDAO
): Promise<ServiceResponse<GetAllResponse>> {
  try {
    const usedFilters = buildFilterQueryLimitOffsetV2(filters);

    usedFilters.where.AND.push({
      userId: user.no_identitas,
    });

    const [notification, totalData] = await Promise.all([
      prisma.notification.findMany(usedFilters),
      prisma.notification.count({
        where: usedFilters.where,
      }),
    ]);

    const notRead = await prisma.notification.count({
      where: {
        userId: user.no_identitas,
        isRead: false,
      },
    });

    let totalPage = 1;
    if (totalData > usedFilters.take)
      totalPage = Math.ceil(totalData / usedFilters.take);

    return {
      status: true,
      data: {
        entries: notification,
        notRead,
        totalData,
        totalPage,
      },
    };
  } catch (err) {
    Logger.error(`NotificationService.getAll : ${err} `);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type GetByIdResponse = Notification | {};
export async function getById(
  id: string
): Promise<ServiceResponse<GetByIdResponse>> {
  try {
    let notification = await prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) return INVALID_ID_SERVICE_RESPONSE;

    return {
      status: true,
      data: notification,
    };
  } catch (err) {
    Logger.error(`NotificationService.getById : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export type UpdateResponse = Notification | {};
export async function update(
  id: string,
  data: NotificationDTO
): Promise<ServiceResponse<UpdateResponse>> {
  try {
    let notification = await prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) return INVALID_ID_SERVICE_RESPONSE;

    notification = await prisma.notification.update({
      where: {
        id,
      },
      data,
    });

    return {
      status: true,
      data: notification,
    };
  } catch (err) {
    Logger.error(`NotificationService.update : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function deleteByIds(ids: string): Promise<ServiceResponse<{}>> {
  try {
    const idArray: string[] = JSON.parse(ids);

    idArray.forEach(async (id) => {
      await prisma.notification.delete({
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
    Logger.error(`NotificationService.deleteByIds : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}
