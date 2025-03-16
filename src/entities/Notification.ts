import { NotificationType } from "@prisma/client";

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  type: NotificationType;
  pengaduanId?: string;
  pengaduanMasyarakatId?: string;
  pelaporanWBSId?: string;
}
