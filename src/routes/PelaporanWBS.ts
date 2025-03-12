import { Hono } from "hono";
import * as PelaporanWBSController from "$controllers/rest/PelaporanWBSController";
import * as pengaudanValidation from "$validations/PelaporanWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";

const PelaporanWBSRoutes = new Hono();

PelaporanWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS_WBS",
    "KEPALA_WBS",
    "PETUGAS_SUPER",
    "DOSEN",
    "TENAGA_KEPENDIDIKAN",
  ]),
  PelaporanWBSController.getAll
);

PelaporanWBSRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS_WBS",
    "KEPALA_WBS",
    "PETUGAS_SUPER",
    "DOSEN",
    "TENAGA_KEPENDIDIKAN",
  ]),
  PelaporanWBSController.getById
);

PelaporanWBSRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["DOSEN", "TENAGA_KEPENDIDIKAN"]),
  pengaudanValidation.validatePelaporanWBSDTO,
  PelaporanWBSController.create
);

PelaporanWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS_WBS",
    "KEPALA_WBS",
    "PETUGAS_SUPER",
    "DOSEN",
    "TENAGA_KEPENDIDIKAN",
  ]),
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
    "TENAGA_KEPENDIDIKAN",
  ]),
  PelaporanWBSController.deleteByIds
);

export default PelaporanWBSRoutes;
