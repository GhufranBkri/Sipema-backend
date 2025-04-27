import { Hono } from "hono";
import * as unitController from "$controllers/rest/UnitController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as unitValidation from "$validations/UnitValidation";

const unitRoutes = new Hono();

unitRoutes.get("/", AuthMiddleware.decodeJwt, unitController.getAll);
unitRoutes.get("/:id", unitController.getById);

unitRoutes.get(
  "/petugas/unit",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkRole([Roles.KEPALA_PETUGAS_UNIT]),
  unitController.getAllPetugas
);

unitRoutes.post(
  "/",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkRole([Roles.ADMIN]),
  AuthMiddleware.checkAccess("UNIT", "create"),
  unitValidation.validateUnitCreateDTO,
  unitController.create
);

unitRoutes.post(
  "/petugas",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkRole([Roles.KEPALA_PETUGAS_UNIT]),
  unitValidation.validateAddPetugasDTO,
  unitController.addPetugas
);

unitRoutes.put(
  "/petugas",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkRole([Roles.KEPALA_PETUGAS_UNIT]),

  unitValidation.validateRemovePetugasDTO,
  unitController.removePetugas
);

unitRoutes.put(
  "/:id",
  unitValidation.validateUnitUpdateDTO,

  AuthMiddleware.checkAccess("UNIT", "update"),
  AuthMiddleware.checkJwt,
  unitController.update
);

unitRoutes.delete(
  "/",
  AuthMiddleware.checkJwt,
  unitValidation.validationDeletedUnit,
  AuthMiddleware.checkAccess("UNIT", "delete"),

  unitController.deleteByIds
);

export default unitRoutes;
