/**
 * Centralized notification templates
 */

import { NotificationDTO } from "$entities/Notification";
import { PengaduanDTO } from "$entities/Pengaduan";

export const PengaduanNotifications = {
  /**
   * Notification for new complaint reports
   */
  newComplaint: (data: PengaduanDTO, userId: string): NotificationDTO => ({
    id: "",
    title: `📋 Laporan Baru: ${data.nameUnit}`,
    message: `Pengaduan baru telah masuk di unit Anda. Mohon segera ditinjau.`,
    isRead: false,
    userId: "",
    type: "NEW_REPORT",
  }),

  /**
   * Notification for complaint status updates
   */
  statusUpdate: (status: string) => ({
    title: `🔄 Status Diperbarui`,
    message: `Pengaduan Anda telah diperbarui ke status: ${status}`,
  }),

  /**
   * Notification for complaint resolution
   */
  resolved: (unitName: string) => ({
    title: `✅ Pengaduan Selesai`,
    message: `Pengaduan di unit ${unitName} telah diselesaikan`,
  }),
};
