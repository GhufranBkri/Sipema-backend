import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";

import { KategoriWBSDTO } from "$entities/KategoriWBS";
import { prisma } from "$utils/prisma.utils";

export async function validateKategoriWBSDTO(c: Context, next: Next) {
  const data: KategoriWBSDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  const existingKategori = await prisma.kategori.findFirst({
    where: {
      nama: data.nama,
    },
  });

  if (existingKategori) {
    invalidFields.push(
      generateErrorStructure(
        "nama",
        "WBS Category with this name already exists"
      )
    );
  }

  if (!data.nama)
    invalidFields.push(generateErrorStructure("nama", "nama cannot be empty"));
  if (!data.deskripsi)
    invalidFields.push(
      generateErrorStructure("deskripsi", "deskripsi cannot be empty")
    );

  if (!data) invalidFields.push(generateErrorStructure("", " cannot be empty"));

  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}
