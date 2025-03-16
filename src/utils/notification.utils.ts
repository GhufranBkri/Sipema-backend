import { randomUUID } from "crypto";
import { PengaduanNotifications } from "./notif_tmplt.utils";
import { NotificationDTO } from "$entities/Notification";
import * as NotificationService from "$services/NotificationService";
import { PengaduanDTO } from "$entities/Pengaduan";

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
      const template = PengaduanNotifications.newComplaint(data, staffId);

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
    status: string,
    userId: string,
    pengaduanId: string
  ) => {
    try {
      // Get template (only has title and message)
      const template = PengaduanNotifications.statusUpdate(status);

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: userId,
        type: "REPORT_UPDATED",
        pengaduanId: pengaduanId,
      };

      // Send the notification
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send status update notification:", error);
      throw error;
    }
  },

  /**
   * Send notification when a complaint is resolved
   */
  sendResolvedNotification: async (
    unitName: string,
    userId: string,
    pengaduanId: string
  ) => {
    try {
      // Get template (only has title and message)
      const template = PengaduanNotifications.resolved(unitName);

      // Build complete notification
      const notification: NotificationDTO = {
        ...template,
        id: randomUUID(),
        isRead: false,
        userId: userId,
        type: "REPORT_UPDATED",
        pengaduanId: pengaduanId,
      };

      // Send the notification
      return await NotificationService.create(notification);
    } catch (error) {
      console.error("Failed to send resolved notification:", error);
      throw error;
    }
  },
};
