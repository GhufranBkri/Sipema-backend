/**
 * Centralized notification templates
 */

import { NotificationDTO } from "$entities/Notification";

export const PengaduanNotifications = {
  /**
   * Notification for new complaint reports
   */
  newComplaint: (nameUnit: string, judul: string): NotificationDTO => ({
    id: "",
    title: `📋 Laporan Baru: ${nameUnit}`,
    message: `Pengaduan baru telah masuk di unit Anda dengan judul ${judul}. Mohon segera ditinjau.`,
    isRead: false,
    userId: "",
    type: "NEW_REPORT",
  }),

  newAllertToOfficer: (reportId: string, judul: string): NotificationDTO => ({
    id: "",
    title: `⚠️ Peringatan: Laporan Tertunda`,
    message: `Laporan dengan ID ${reportId} dan judul "${judul}" belum diproses selama 3 hari. Mohon segera ditindaklanjuti.`,
    isRead: false,
    userId: "",
    type: "REMINDER",
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
  resolved: (judul: string, nameUnit: string) => ({
    title: `✅ Pengaduan Selesai`,
    message: `Pengaduan dengan judul ${judul} di unit ${nameUnit} telah diselesaikan`,
  }),
};
