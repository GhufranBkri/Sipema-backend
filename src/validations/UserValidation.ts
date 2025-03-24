import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import {
  ErrorStructure,
  generateErrorStructure,
  generateErrorStructureParams,
} from "./helper";

import { UserRegisterDTO } from "$entities/User";
import { prisma } from "$utils/prisma.utils";

export async function validateUserRegisterDTO(c: Context, next: Next) {
  const data: UserRegisterDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  if (!data.email)
    invalidFields.push(generateErrorStructure("email", " cannot be empty"));
  if (!data.name)
    invalidFields.push(generateErrorStructure("name", " cannot be empty"));
  if (!data.password)
    invalidFields.push(generateErrorStructure("password", " cannot be empty"));
  if (!data.no_identitas)
    invalidFields.push(
      generateErrorStructure("no_identitas", " cannot be empty")
    );
  if (!data.userLevelName)
    invalidFields.push(
      generateErrorStructure("userLevelName", " cannot be empty")
    );
  if (invalidFields.length !== 0)
    return response_bad_request(c, "Validation Error", invalidFields);
  await next();
}

export async function validationDeletedUsers(c: Context, next: Next) {
  const ids = c.req.query("ids") as string;
  const invalidFields: ErrorStructure[] = [];
  if (!ids) {
    invalidFields.push(generateErrorStructureParams("ids", " cannot be empty"));
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  const idArray: string[] = JSON.parse(ids);
  // Check all users exist before proceeding
  await Promise.all(
    idArray.map(async (no_identitas) => {
      const user = await prisma.user.findUnique({
        where: { no_identitas },
      });
      if (!user) {
        invalidFields.push(
          generateErrorStructureParams(
            "id",
            `User with id: ${no_identitas} not found`
          )
        );
      }
      return user;
    })
  );

  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  await next();
}
