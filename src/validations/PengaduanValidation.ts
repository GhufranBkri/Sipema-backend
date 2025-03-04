import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";
import { Roles } from "@prisma/client";

import { PengaduanDTO } from "$entities/Pengaduan";
import { prisma } from "$utils/prisma.utils";
import { UserJWTDAO } from "$entities/User";

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
  const existingUnit = await prisma.unit.findUnique({
    where: { nama_unit: data.nameUnit },
  });
  const existingKategori = await prisma.kategori.findUnique({
    where: { id: data.kategoriId },
  });

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

  if (!existingUnit)
    invalidFields.push(generateErrorStructure("nameUnit", "unit not found"));

  if (!existingKategori)
    invalidFields.push(
      generateErrorStructure("kategoriId", "category not found")
    );

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

export async function validateUpdatePengaduanDTO(c: Context, next: Next) {
  // const data: PengaduanDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  const user: UserJWTDAO = c.get("jwtPayload");

  const id = c.req.param("id");
  const pengaduan = await prisma.pengaduan.findUnique({
    where: { id },
    include: { pelapor: true },
  });

  if (!pengaduan) {
    invalidFields.push(generateErrorStructure("id", "complaint not found"));
  } else if (
    pengaduan.pelapor.no_identitas !== user.no_identitas &&
    (user.role === Roles.MAHASISWA || user.role === Roles.DOSEN)
  ) {
    invalidFields.push(
      generateErrorStructure("id", "not authorized to update this complaint")
    );
  }

  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}
