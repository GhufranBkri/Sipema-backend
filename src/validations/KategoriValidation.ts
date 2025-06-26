import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import {
  ErrorStructure,
  generateErrorStructure,
  generateErrorStructureParams,
} from "./helper";

import { KategoriDTO } from "$entities/Kategori";
import { prisma } from "$utils/prisma.utils";

export async function validateKategoriDTO(c: Context, next: Next) {
  const data: KategoriDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  if (!data.nama)
    invalidFields.push(generateErrorStructure("nama", "nama cannot be empty"));
  if (data.nama) {
    const alreadyNaame = await prisma.kategori.findFirst({
      where: {
        nama: data.nama,
      },
    });
    if (alreadyNaame)
      invalidFields.push(
        generateErrorStructure("nama", "Kategory already exist")
      );
  }

  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}

export async function deleteValidationKatergori(c: Context, next: Next) {
  const ids = c.req.query("ids") as string;
  const invalidFields: ErrorStructure[] = [];
  if (!ids) {
    invalidFields.push(generateErrorStructureParams("ids", " cannot be empty"));
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  const idArray: string[] = JSON.parse(ids);
  await Promise.all(
    idArray.map(async (id) => {
      const kategori = await prisma.kategori.findUnique({
        where: { id },
      });
      if (!kategori) {
        invalidFields.push(
          generateErrorStructureParams(
            "ids",
            `Kategori with id: ${id} not found`
          )
        );
      }
      return kategori;
    })
  );

  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  await next();
}
