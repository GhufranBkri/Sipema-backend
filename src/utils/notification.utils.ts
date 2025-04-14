import { randomUUID } from "crypto";
import { PengaduanNotifications } from "./notif_tmplt.utils";
import { NotificationDTO } from "$entities/Notification";
import * as NotificationService from "$services/NotificationService";
import { prisma } from "./prisma.utils";
import { PengaduanDTO } from "$entities/Pengaduan";
import Logger from "$pkg/logger";

/**
 * Utility functions for sending notifications
 */
export const NotificationUtils = {
  /**
   * Send notification to staff about a new complaint
   */
  sendNewComplaintNotification: async (
    data: PengaduanDTO,
    staffId: string,
    pengaduanId: string
  ) => {
    try {
      const getUnit = await prisma.unit.findUnique({
        where: { id: data.unitId },
      });

      if (!getUnit) {
        throw new Error("Unit not found");
      }
      // Get notification template
      const template = PengaduanNotifications.newComplaint(
        getUnit.nama_unit,
        data.judul
      );

      // Build complete notification object
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        userId: staffId,
        pengaduanId: pengaduanId,
      };

      // Send the notification
      Logger.info("Message sent successfully: to", staffId);
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send new complaint notification:", error);
      throw error;
    }
  },

  /**
   * Send notification to staff WBS about a new complaint
   */
  sendNewComplaintWBSNotfication: async (
    judul: string,
    staffId: string,
    pengaduanId: string
  ) => {
    try {
      // Get notification template
      const template = PengaduanNotifications.newComplaintWBS(judul);

      // Build complete notification object
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        userId: staffId,
        pengaduanWBSId: pengaduanId,
      };
      Logger.info("Message sent successfully: to", staffId);

      // Send the notification
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send new complaint notification:", error);
      throw error;
    }
  },

  /**
   * Send notification about status updates
   */
  sendStatusUpdateNotification: async (
    judul: string,
    status: string,
    userId: string,
    pengaduanId: string,
    namaPetugas: string
  ) => {
    try {
      // Get template (only has title and message)
      const template = PengaduanNotifications.statusUpdate(judul, status);

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: userId,
        type: "REPORT_UPDATED",
        pengaduanId: pengaduanId,
      };

      // Send the notification for user
      const notifications = await prisma.notification.findMany({
        where: {
          pengaduanId: pengaduanId,
          type: "NEW_REPORT",
        },
      });

      // Update semua notifikasi
      for (const notif of notifications) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            message: `Laporan dengan Judul ${judul} sedang ditangani oleh ${namaPetugas}`,
            title: `🔄 Laporan Dalam Proses`,
            type: "REPORT_IN_PROCESS",
          },
        });
      }
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send status update notification:", error);
      throw error;
    }
  },

  sendStatusUpdateNotificationWBS: async (
    judul: string,
    status: string,
    userId: string,
    pengaduanId: string,
    namaPetugas: string
  ) => {
    try {
      // Get template (only has title and message)
      const template = PengaduanNotifications.statusUpdate(judul, status);

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: userId,
        type: "REPORT_UPDATED",
        pengaduanWBSId: pengaduanId,
      };

      // Send the notification for user
      const notifications = await prisma.notification.findMany({
        where: {
          pengaduanWBSId: pengaduanId,
          type: "NEW_REPORT",
        },
      });

      // Update semua notifikasi
      for (const notif of notifications) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            message: `Laporan dengan Judul ${judul} sedang ditangani oleh ${namaPetugas}`,
            title: `🔄 Laporan Dalam Proses`,
            type: "REPORT_IN_PROCESS",
          },
        });
      }
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send status update notification:", error);
      throw error;
    }
  },

  /**
   * Send notification when a complaint is resolved
   */
  sendResolvedNotification: async (data: PengaduanDTO, userId: string) => {
    try {
      const getUnit = await prisma.unit.findUnique({
        where: { id: data.unitId },
      });

      if (!getUnit) {
        throw new Error("Unit not found");
      }
      // Get template (only has title and message)
      const template = PengaduanNotifications.resolved(
        data.judul,
        getUnit?.nama_unit
      );

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: userId,
        type: "REPORT_UPDATED",
        pengaduanId: data.id,
      };

      // Send the notification
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send resolved notification:", error);
      throw error;
    }
  },
};
