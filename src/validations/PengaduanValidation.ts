import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";

import { PengaduanDTO } from "$entities/Pengaduan";
import { prisma } from "$utils/prisma.utils";

async function isDuplicatePengaduan(data: PengaduanDTO): Promise<boolean> {
  // Check for similar complaints within last 24 hours
  const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existingPengaduan = await prisma.pengaduan.findFirst({
    where: {
      AND: [
        {
          judul: {
            contains: data.judul,
            mode: "insensitive",
          },
        },
        {
          deskripsi: {
            contains: data.deskripsi,
            mode: "insensitive",
          },
        },
        {
          pelaporId: data.pelaporId,
        },
        {
          createdAt: {
            gte: timeWindow,
          },
        },
      ],
    },
  });

  return !!existingPengaduan;
}

export async function validatePengaduanDTO(c: Context, next: Next) {
  const data: PengaduanDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  if (!data.deskripsi)
    invalidFields.push(generateErrorStructure("deskripsi", " cannot be empty"));
  if (!data.judul)
    invalidFields.push(generateErrorStructure("judul", " cannot be empty"));
  if (!data.kategoriId)
    invalidFields.push(
      generateErrorStructure("kategoriId", " cannot be empty")
    );
  if (!data.nameUnit)
    invalidFields.push(generateErrorStructure("nameUnit", " cannot be empty"));
  if (!data.nameUnit)
    invalidFields.push(generateErrorStructure("nameUnit", " cannot be empty"));

  // Check for duplicate complaint
  if (invalidFields.length === 0) {
    const isDuplicate = await isDuplicatePengaduan(data);
    if (isDuplicate) {
      invalidFields.push(
        generateErrorStructure(
          "pengaduan",
          "Similar complaint already exists within 24 hours"
        )
      );
    }
  }

  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}
