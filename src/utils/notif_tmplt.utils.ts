/**
 * Centralized notification templates
 */

import { NotificationDTO } from "$entities/Notification";
import { PengaduanDTO } from "$entities/Pengaduan";

export const PengaduanNotifications = {
  /**
   * Notification for new complaint reports
   */
  newComplaint: (data: PengaduanDTO): NotificationDTO => ({
    id: "",
    title: `📋 Laporan Baru: ${data.nameUnit}`,
    message: `Pengaduan baru telah masuk di unit Anda dengan judul ${data.judul}. Mohon segera ditinjau.`,
    isRead: false,
    userId: "",
    type: "NEW_REPORT",
  }),

  /**
   * Notification for new WBS complaint reports to all WBS officers
   */
  newComplaintWBS: (judul: string): NotificationDTO => ({
    id: "",
    title: `🔒 Laporan WBS Baru`,
    message: `Pengaduan Whistle Blowing System baru telah masuk dengan judul ${judul}. Mohon segera ditinjau .`,
    isRead: false,
    userId: "",
    type: "NEW_REPORT",
  }),
  /**
   * Notification for complaint status updates
   */
  statusUpdate: (judul: string, status: string) => ({
    title: `🔄 Status Diperbarui`,
    message: `Pengaduan Anda dengan judu; ${judul} telah diperbarui ke status: ${status}`,
  }),

  /**
   * Notification for complaint resolution
   */
  resolved: (data: PengaduanDTO) => ({
    title: `✅ Pengaduan Selesai`,
    message: `Pengaduan dengan judul ${data.judul} di unit ${data.nameUnit} telah diselesaikan`,
  }),
};
