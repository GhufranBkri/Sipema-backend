import { randomUUID } from "crypto";
import { PengaduanNotifications } from "./notif_tmplt.utils";
import { NotificationDTO } from "$entities/Notification";
import * as NotificationService from "$services/NotificationService";
import { PengaduanDTO } from "$entities/Pengaduan";
import { prisma } from "./prisma.utils";
import { Pengaduan } from "@prisma/client";

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
      // Get notification template
      const template = PengaduanNotifications.newComplaint(data);

      // Build complete notification object
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        userId: staffId,
        pengaduanId: pengaduanId,
      };

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
    pengaduan: Pengaduan,
    namaPetugas: string
  ) => {
    try {
      // Get template (only has title and message)
      const template = PengaduanNotifications.statusUpdate(pengaduan);

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: pengaduan.pelaporId,
        type: "REPORT_UPDATED",
        pengaduanId: pengaduan.id,
      };

      // Send the notification for user
      const notifications = await prisma.notification.findMany({
        where: {
          pengaduanId: pengaduan.id,
          type: "NEW_REPORT",
        },
      });

      // Update semua notifikasi
      for (const notif of notifications) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: {
            message: `Laporan dengan Judul ${pengaduan.judul} sedang ditangani oleh ${namaPetugas}`,
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
      // Get template (only has title and message)
      const template = PengaduanNotifications.resolved(data);

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
