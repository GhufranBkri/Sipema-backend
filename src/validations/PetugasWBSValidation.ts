import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import { ErrorStructure, generateErrorStructure } from "./helper";

import { PetugasWBSDTO } from "$entities/PetugasWBS";
import { prisma } from "$utils/prisma.utils";

export async function validatePetugasWBSDTO(c: Context, next: Next) {
  const data: PetugasWBSDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  const existingPetugas = await prisma.user.findUnique({
    where: { no_identitas: data.petugasId },
  });
  const existingPetugasWbs = await prisma.petugasWBS.findFirst({
    where: { petugasId: data.petugasId },
  });

  if (!existingPetugas)
    invalidFields.push(generateErrorStructure("petugasId", " does not exist"));
  if (!data.petugasId)
    invalidFields.push(generateErrorStructure("petugasId", " cannot be empty"));

  if (existingPetugasWbs) {
    invalidFields.push(generateErrorStructure("petugasId", " already exists"));
  }

  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}
