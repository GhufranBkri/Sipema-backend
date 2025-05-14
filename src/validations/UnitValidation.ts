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
  const user: UserJWTDAO = c.get("jwtPayload");
  const invalidFields: ErrorStructure[] = [];

  // Basic validations
  if (
    !data.petugasIds ||
    !Array.isArray(data.petugasIds) ||
    data.petugasIds.length === 0
  ) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "must be a non-empty array")
    );
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  // Find the unit where the user is either kepala unit or pimpinan unit
  const unit = await prisma.unit.findFirst({
    where: {
      OR: [
        { kepalaUnitId: user.no_identitas },
        { pimpinanUnitId: user.no_identitas },
      ],
    },
    include: { petugas: true },
  });

  if (!unit) {
    invalidFields.push(
      generateErrorStructure(
        "unit",
        "user is not a kepala unit or pimpinan unit of any unit"
      )
    );
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  // Continue with validations using the found unit.id instead of user.unitId
  // Check if all petugasIds exist and are PETUGAS
  const existingPetugas = await prisma.user.findMany({
    where: {
      no_identitas: { in: data.petugasIds },
      userLevel: {
        name: "PETUGAS",
      },
    },
  });

  if (existingPetugas.length === 0) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "no valid petugas found")
    );
  } else if (existingPetugas.length !== data.petugasIds.length) {
    invalidFields.push(
      generateErrorStructure(
        "petugasIds",
        "one or more petugas IDs are invalid"
      )
    );
  }

  // Check if any petugas is already assigned to another unit
  const alreadyAssignedPetugas = await prisma.user.findMany({
    where: {
      no_identitas: { in: data.petugasIds },
      unitId: { not: null },
    },
  });

  if (alreadyAssignedPetugas.length > 0) {
    invalidFields.push(
      generateErrorStructure(
        "petugasIds",
        "one or more petugas are already assigned to a unit"
      )
    );
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  await next();
}

export async function validateRemovePetugasDTO(c: Context, next: Next) {
  const data: AddPetugasDTO = await c.req.json();
  const user: UserJWTDAO = c.get("jwtPayload");
  const invalidFields: ErrorStructure[] = [];

  // Basic validation for petugasIds
  if (
    !data.petugasIds ||
    !Array.isArray(data.petugasIds) ||
    data.petugasIds.length === 0
  ) {
    invalidFields.push(
      generateErrorStructure("petugasIds", "must be a non-empty array")
    );
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  // Find the unit where the user is either kepala unit or pimpinan unit
  const unit = await prisma.unit.findFirst({
    where: {
      OR: [
        { kepalaUnitId: user.no_identitas },
        { pimpinanUnitId: user.no_identitas },
      ],
    },
    include: { petugas: true },
  });

  if (!unit) {
    invalidFields.push(
      generateErrorStructure(
        "unit",
        "user is not a kepala unit or pimpinan unit of any unit"
      )
    );
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  // Verify users exist and belong to the specified unit
  const existingUsers = await prisma.user.findMany({
    where: {
      no_identitas: { in: data.petugasIds },
      unitId: unit.id, // Use unit.id instead of user.unitId
      userLevel: {
        name: "PETUGAS",
      },
    },
  });

  if (existingUsers.length === 0) {
    invalidFields.push(
      generateErrorStructure(
        "petugasIds",
        "no valid petugas found in the specified unit"
      )
    );
  } else if (existingUsers.length !== data.petugasIds.length) {
    invalidFields.push(
      generateErrorStructure(
        "petugasIds",
        "one or more petugas IDs are invalid or not in this unit"
      )
    );
  }

  if (invalidFields.length > 0) {
    return response_bad_request(c, "Validation Error", invalidFields);
  }

  await next();
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
    idArray.map(async (id) => {
      const unit = await prisma.unit.findUnique({
        where: { id },
      });
      if (!unit) {
        invalidFields.push(
          generateErrorStructureParams("ids", `unit with id: ${id} not found`)
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
