import { Hono } from "hono";
import * as PetugasWBSController from "$controllers/rest/PetugasWBSController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as petugasWBSValidation from "$validations/PetugasWBSValidation";

const PetugasWBSRoutes = new Hono();

PetugasWBSRoutes.get("/", PetugasWBSController.getAll);

PetugasWBSRoutes.get("/:id", PetugasWBSController.getById);

PetugasWBSRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["KEPALA_WBS"]),
  petugasWBSValidation.validatePetugasWBSDTO,
  PetugasWBSController.create
);

PetugasWBSRoutes.put("/:id", PetugasWBSController.update);

PetugasWBSRoutes.delete("/", PetugasWBSController.deleteByIds);

export default PetugasWBSRoutes;
