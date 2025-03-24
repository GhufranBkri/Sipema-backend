// UnitValidation.ts
import { Context, Next } from "hono";
import { response_bad_request } from "$utils/response.utils";
import {
  ErrorStructure,
  generateErrorStructure,
  generateErrorStructureParams,
} from "./helper";
import { AddPetugasDTO, UnitCreateDTO, UnitUpdateDTO } from "$entities/Unit";
import { prisma } from "$utils/prisma.utils";
import { UserJWTDAO } from "$entities/User";

export async function validateUnitCreateDTO(c: Context, next: Next) {
  const data: UnitCreateDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Basic validations
  if (!data.nama_unit) {
    invalidFields.push(generateErrorStructure("nama_unit", "cannot be empty"));
  }
  if (!data.kepalaUnit) {
    invalidFields.push(generateErrorStructure("kepalaUnit", "cannot be empty"));
  }
  // Validate kepalaUnit if provided
  if (data.kepalaUnit) {
    // Check if user exists and is a KEPALA_PETUGAS_UNIT
    const existingUser = await prisma.user.findUnique({
      where: { no_identitas: data.kepalaUnit },
    });

    const finduserLevel = await prisma.userLevels.findUnique({
      where: { name: "KEPALA_PETUGAS_UNIT" },
    });
    if (!existingUser) {
      invalidFields.push(
        generateErrorStructure("kepalaUnit", "user not found")
      );
    } else if (existingUser.userLevelId !== finduserLevel?.id) {
      invalidFields.push(
        generateErrorStructure(
          "kepalaUnit",
          "user does not have the required role"
        )
      );
    }
  }

  // Check if unit name already exists
  const existingUnit = await prisma.unit.findUnique({
    where: { nama_unit: data.nama_unit },
  });

  if (existingUnit) {
    invalidFields.push(
      generateErrorStructure("nama_unit", "unit name already exists")
    );
  }

  // Return validation errors if any
  if (invalidFields.length > 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  await next();
}

export async function validateUnitUpdateDTO(c: Context, next: Next) {
  const data: UnitUpdateDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  // Validate petugas if provided
  if (data.petugasId) {
    // Check if user exists and is a PETUGAS
    const existingUser = await prisma.user.findUnique({
      where: { no_identitas: data.petugasId },
    });

    const finduserLevel = await prisma.userLevels.findUnique({
      where: { name: "KEPALA_PETUGAS_UNIT" },
    });

    if (!existingUser) {
      invalidFields.push(generateErrorStructure("petugasId", "user not found"));
    } else if (existingUser.userLevelId !== finduserLevel?.id) {
      invalidFields.push(
        generateErrorStructure(
          "petugasId",
          "user does not have the required role"
        )
      );
    }

    // Check if petugas is already assigned to another unit
    const existingAssignment = await prisma.unit.findFirst({
      where: { petugas: { some: { no_identitas: data.petugasId } } },
    });

    if (existingAssignment) {
      invalidFields.push(
        generateErrorStructure(
          "petugasId",
          "user is already assigned to a unit"
        )
      );
    }
  }
  await next();
}

export async function validateAddPetugasDTO(c: Context, next: Next) {
  const data: AddPetugasDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];
  const user: UserJWTDAO = c.get("jwtPayload");

  // Basic validations
  const unit = await prisma.unit.findUnique({
    where: { id: user.unitId },
  });
  if (!unit?.id) {
    invalidFields.push(generateErrorStructure("unit", "notfound"));
  }

  if (!unit?.nama_unit) {
    invalidFields.push(generateErrorStructure("nama_unit", "cannot be empty"));
  }

  if (
    !data.petugasIds ||
    !Array.isArray(data.petugasIds) ||
    data.petugasIds.length === 0
  ) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "must be a non-empty array")
    );
  }

  // Check if all petugasIds exist and are PETUGAS
  if (data.petugasIds && Array.isArray(data.petugasIds)) {
    const existingPetugas = await prisma.user.findMany({
      where: {
        no_identitas: {
          in: data.petugasIds,
        },
      },
    });

    if (existingPetugas.length !== data.petugasIds.length) {
      invalidFields.push(
        generateErrorStructure("petugasIds", "petugas IDs do not exist")
      );
    } else {
      // Check if all users have PETUGAS role
      const finduserLevel = await prisma.userLevels.findUnique({
        where: { name: "KEPALA_PETUGAS_UNIT" },
      });

      const nonPetugasUsers = existingPetugas.filter(
        (user) => user.userLevelId !== finduserLevel?.id
      );
      if (nonPetugasUsers.length > 0) {
        invalidFields.push(
          generateErrorStructure("petugasIds", "users do not have PETUGAS role")
        );
      }

      // Check if any petugas is already in this unit

      // Check if petugas is in another unit
      const petugasInOtherUnit = await prisma.unit.findFirst({
        where: {
          nama_unit: { not: unit?.nama_unit },
          petugas: { some: { no_identitas: { in: data.petugasIds } } },
        },
      });

      if (petugasInOtherUnit) {
        invalidFields.push(
          generateErrorStructure(
            "petugasIds",
            "petugas already in another unit"
          )
        );
      }
    }
  }
  // Return validation errors if any
  if (invalidFields.length > 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  await next();
}

export async function validateRemovePetugasDTO(c: Context, next: Next) {
  const data: AddPetugasDTO = await c.req.json();
  const invalidFields: ErrorStructure[] = [];

  const nama_unit = c.req.param("nama_unit");

  // Basic validations
  if (!nama_unit) {
    invalidFields.push(generateErrorStructure("nama_unit", "cannot be empty"));
  }

  if (
    !data.petugasIds ||
    !Array.isArray(data.petugasIds) ||
    data.petugasIds.length === 0
  ) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "must be a non-empty array")
    );
  }
  // Check if petugas exists in the specified unit
  const existingPetugas = await prisma.user.findMany({
    where: {
      no_identitas: {
        in: data.petugasIds,
      },
    },
  });

  if (existingPetugas.length !== data.petugasIds.length) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "petugas IDs do not exist")
    );
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  await next(); // Add this line to continue the middleware chain
}

export async function validationDeletedUnit(c: Context, next: Next) {
  const ids = c.req.query("ids") as string;
  const invalidFields: ErrorStructure[] = [];
  if (!ids) {
    invalidFields.push(generateErrorStructureParams("ids", " cannot be empty"));
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  const idArray: string[] = JSON.parse(ids);
  // Check all unit exist before proceeding
  await Promise.all(
    idArray.map(async (name) => {
      const unit = await prisma.unit.findUnique({
        where: { nama_unit: name },
      });
      if (!unit) {
        invalidFields.push(
          generateErrorStructureParams("ids", `User with id: ${name} not found`)
        );
      }
      return unit;
    })
  );

  if (invalidFields.length !== 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }
  await next();
}
