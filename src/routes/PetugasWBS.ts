import { Hono } from "hono";
import * as PetugasWBSController from "$controllers/rest/PetugasWBSController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as petugasWBSValidation from "$validations/PetugasWBSValidation";

const PetugasWBSRoutes = new Hono();

PetugasWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  PetugasWBSController.getAll
);

PetugasWBSRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  PetugasWBSController.getById
);

PetugasWBSRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  petugasWBSValidation.validatePetugasWBSDTO,
  PetugasWBSController.create
);

PetugasWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  PetugasWBSController.update
);

PetugasWBSRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  PetugasWBSController.deleteByIds
);

export default PetugasWBSRoutes;
