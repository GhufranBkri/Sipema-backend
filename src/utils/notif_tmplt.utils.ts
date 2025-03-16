/**
 * Centralized notification templates
 */

import { NotificationDTO } from "$entities/Notification";
import { PengaduanDTO } from "$entities/Pengaduan";
import { Pengaduan } from "@prisma/client";

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
   * Notification for complaint status updates
   */
  statusUpdate: (pengaduan: Pengaduan) => ({
    title: `🔄 Status Diperbarui`,
    message: `Pengaduan Anda dengan judu; ${pengaduan.judul} telah diperbarui ke status: ${pengaduan.status}`,
  }),

  /**
   * Notification for complaint resolution
   */
  resolved: (data: PengaduanDTO) => ({
    title: `✅ Pengaduan Selesai`,
    message: `Pengaduan dengan judul ${data.judul} di unit ${data.nameUnit} telah diselesaikan`,
  }),
};
