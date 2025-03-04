import { Hono } from "hono";
import * as PengaduanController from "$controllers/rest/PengaduanController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as pengaudanValidation from "$validations/PengaduanValidation";

const PengaduanRoutes = new Hono();

PengaduanRoutes.get("/count", PengaduanController.getTotalCount);

PengaduanRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS",
    "PETUGAS_SUPER",
    "KEPALA_PETUGAS_UNIT",
    "DOSEN",
    "USER",
    "MAHASISWA",
  ]),
  PengaduanController.getAll
);

PengaduanRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS",
    "PETUGAS_SUPER",
    "KEPALA_PETUGAS_UNIT",
    "DOSEN",
    "USER",
    "MAHASISWA",
  ]),
  PengaduanController.getById
);

PengaduanRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole(["DOSEN", "USER", "MAHASISWA"]),
  pengaudanValidation.validatePengaduanDTO,
  PengaduanController.create
);

PengaduanRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS",
    "PETUGAS_SUPER",
    "KEPALA_PETUGAS_UNIT",
    "DOSEN",
    "USER",
    "MAHASISWA",
  ]),
  pengaudanValidation.validateUpdatePengaduanDTO,
  PengaduanController.update
);

PengaduanRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "PETUGAS",
    "PETUGAS_SUPER",
    "KEPALA_PETUGAS_UNIT",
    "DOSEN",
    "USER",
    "MAHASISWA",
  ]),
  PengaduanController.deleteByIds
);

export default PengaduanRoutes;
