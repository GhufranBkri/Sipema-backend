import { Hono } from "hono";
import * as PelaporanWBSController from "$controllers/rest/PelaporanWBSController";
import * as pengaudanValidation from "$validations/PelaporanWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";

const PelaporanWBSRoutes = new Hono();

PelaporanWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["PETUGAS_WBS", "KEPALA_WBS", "PETUGAS_SUPER"]),
  PelaporanWBSController.getAll
);

PelaporanWBSRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  PelaporanWBSController.getById
);

PelaporanWBSRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["DOSEN"]),
  pengaudanValidation.validatePelaporanWBSDTO,
  PelaporanWBSController.create
);

PelaporanWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["PETUGAS_WBS", "KEPALA_WBS", "PETUGAS_SUPER"]),
  PelaporanWBSController.update
);

PelaporanWBSRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS_WBS",
    "KEPALA_WBS",
    "PETUGAS_SUPER",
    "DOSEN",
  ]),
  PelaporanWBSController.deleteByIds
);

export default PelaporanWBSRoutes;
