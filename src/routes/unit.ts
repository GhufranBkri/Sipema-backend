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
  AuthMiddleware.checkAccess("UNIT", "getAllPetugas"),
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
  AuthMiddleware.checkAccess("UNIT", "addPetugas"),
  unitValidation.validateAddPetugasDTO,
  unitController.addPetugas
);

unitRoutes.put(
  "/petugas",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("UNIT", "removePetugas"),
  unitValidation.validateRemovePetugasDTO,
  unitController.removePetugas
);

unitRoutes.put(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("UNIT", "update"),
  unitValidation.validateUnitUpdateDTO,
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
