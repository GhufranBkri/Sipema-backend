// PengaduanMasyarakatValidation.ts
import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";
// import { PengaduanMasyarakatDTO } from '$entities/PengaduanMasyarakat'
import { prisma } from "$utils/prisma.utils";

export async function validatePengaduanMasyarakatDTO(c: Context, next: Next) {
  const data = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Form fields validation
  if (!data.deskripsi)
    invalidFields.push(generateErrorStructure("deskripsi", "cannot be empty"));
  if (!data.judul)
    invalidFields.push(generateErrorStructure("judul", "cannot be empty"));
  if (!data.kategoriId)
    invalidFields.push(generateErrorStructure("kategoriId", "cannot be empty"));
  if (!data.nama)
    invalidFields.push(generateErrorStructure("nama", "cannot be empty"));
  if (!data.nameUnit)
    invalidFields.push(generateErrorStructure("nameUnit", "cannot be empty"));
  if (!data.no_telphone)
    invalidFields.push(
      generateErrorStructure("no_telphone", "cannot be empty")
    );

  if (data.kategoriId) {
    const kategori = await prisma.kategori.findUnique({
      where: { id: String(data.kategoriId) },
    });
    if (!kategori)
      invalidFields.push(
        generateErrorStructure("kategoriId", "is not valid. Category not found")
      );
  }

  if (data.nameUnit) {
    const unit = await prisma.unit.findUnique({
      where: { nama_unit: String(data.nameUnit) },
    });
    if (!unit)
      invalidFields.push(
        generateErrorStructure("nameUnit", "is not valid. Unit not found")
      );
  }

  // Check duplicates
  if (data.judul && data.deskripsi && data.nameUnit && data.kategoriId) {
    const existingReport = await prisma.pengaduan.findFirst({
      where: {
        AND: [
          { judul: String(data.judul) },
          { deskripsi: String(data.deskripsi) },
          { unitId: String(data.unitId) },
          { kategoriId: String(data.kategoriId) },
          { nama: String(data.nama) },
        ],
      },
    });
    if (existingReport) {
      invalidFields.push(
        generateErrorStructure("report", "duplicate report found")
      );
    }
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Invalid Fields", invalidFields);
  }

  await next();
}
