import { NotificationOfficerAllert } from "$entities/Notification";
import { Context, Next } from "hono";
import { ErrorStructure, generateErrorStructure } from "./helper";
import { response_bad_request } from "$utils/response.utils";
import { prisma } from "$utils/prisma.utils";

export async function validateAllertToOfficer(c: Context, next: Next) {
  const data: NotificationOfficerAllert = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Validate required field
  if (!data.pengaduanId) {
    invalidFields.push(
      generateErrorStructure("idPengaduan", "Pengaduan ID cannot be empty")
    );
  }

  // Check if pengaduan exists
  if (data.pengaduanId) {
    const pengaduan = await prisma.pengaduan.findUnique({
      where: { id: data.pengaduanId },
    });

    if (!pengaduan) {
      invalidFields.push(
        generateErrorStructure(
          "idPengaduan",
          "Pengaduan with this ID does not exist"
        )
      );
    }

    // Check if a reminder notification was already sent recently
    const existingNotification = await prisma.notification.findFirst({
      where: {
        pengaduanId: data.pengaduanId,
        type: "REMINDER",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingNotification) {
      const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
      const timeDifference =
        new Date().getTime() -
        new Date(existingNotification.createdAt).getTime();

      if (timeDifference < oneDayInMilliseconds) {
        invalidFields.push(
          generateErrorStructure(
            "idPengaduan",
            "A reminder for this pengaduan was already sent within the last 24 hours"
          )
        );
      }
    }
  }

  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  c.set("pengaduanData", data);
  await next();
}
