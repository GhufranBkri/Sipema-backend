import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";
import { PelaporanWBSDTO } from "$entities/PelaporanWBS";
import { prisma } from "$utils/prisma.utils";
import { UserJWTDAO } from "$entities/User";

export async function validatePelaporanWBSDTO(c: Context, next: Next) {
  const data: PelaporanWBSDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Required field validations
  if (!data.judul)
    invalidFields.push(generateErrorStructure("judul", "cannot be empty"));
  if (!data.deskripsi)
    invalidFields.push(generateErrorStructure("deskripsi", "cannot be empty"));
  if (!data.lokasi)
    invalidFields.push(generateErrorStructure("lokasi", "cannot be empty"));
  if (!data.kategoriId)
    invalidFields.push(generateErrorStructure("kategoriId", "cannot be empty"));
  if (!data.tanggalKejadian)
    invalidFields.push(
      generateErrorStructure("tanggalKejadian", "cannot be empty")
    );

  // Validate date format
  if (data.tanggalKejadian) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.tanggalKejadian))) {
      invalidFields.push(
        generateErrorStructure(
          "tanggalKejadian",
          "Date must be in YYYY-MM-DD format"
        )
      );
    }
  }

  // Validate kategoriId exists
  if (data.kategoriId) {
    const kategori = await prisma.kategoriWBS.findUnique({
      where: { id: data.kategoriId },
    });
    if (!kategori) {
      invalidFields.push(
        generateErrorStructure("kategoriId", "kategori not found")
      );
    }
  }

  // Check for duplicate complaint
  if (invalidFields.length === 0) {
    const isDuplicate = await prisma.pelaporanWBS.findFirst({
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
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });
    if (isDuplicate) {
      invalidFields.push(
        generateErrorStructure(
          "pengaduan",
          "Similar complaint already exists within 24 hours"
        )
      );
    }
  }

  // Validate pelaporId exists if provided
  if (data.pelaporId) {
    const pelapor = await prisma.user.findUnique({
      where: { no_identitas: data.pelaporId },
    });
    if (!pelapor) {
      invalidFields.push(
        generateErrorStructure("pelaporId", "pelapor not found")
      );
    }
  }

  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  await next();
}

export async function validatePelaporanWBSUpdateDTO(c: Context, next: Next) {
  const data: PelaporanWBSDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  const user: UserJWTDAO = c.get("jwtPayload");

  const id = c.req.param("id");

  const pelaporan = await prisma.pelaporanWBS.findUnique({
    where: { id },
    include: { pelapor: true },
  });

  if (!pelaporan) {
    invalidFields.push(generateErrorStructure("id", "complaint not found"));
  } else if (
    pelaporan.pelapor.no_identitas !== user.no_identitas &&
    user.role === "DOSEN"
  ) {
    invalidFields.push(
      generateErrorStructure("id", "not authorized to update this complaint")
    );
  }

  if (user.role === "DOSEN") {
    if (data.status) {
      invalidFields.push(
        generateErrorStructure("status", "not authorized to update status")
      );
    }
  }

  if (
    user.role === "KEPALA_WBS" ||
    user.role === "PETUGAS_WBS" ||
    user.role === "PETUGAS_SUPER"
  ) {
    const allowedFields = ["status", "response"];
    const updatedFields = Object.keys(data);

    for (const field of updatedFields) {
      if (!allowedFields.includes(field)) {
        invalidFields.push(
          generateErrorStructure(field, `not allowed to update ${field}`)
        );
      }
    }
  }
  // Return error response if validation fails
  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  // Continue to the next middleware if validation passes
  await next();
}
