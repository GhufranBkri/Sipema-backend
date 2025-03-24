import { Hono } from "hono";
import * as PengaduanController from "$controllers/rest/PengaduanController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as pengaudanValidation from "$validations/PengaduanValidation";

const PengaduanRoutes = new Hono();

PengaduanRoutes.get("/count", PengaduanController.getTotalCount);

PengaduanRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN", "read"),
  // authMiddleware.checkRole([
  //   "PETUGAS",
  //   "PETUGAS_SUPER",
  //   "KEPALA_PETUGAS_UNIT",
  //   "DOSEN",
  //   "TENAGA_KEPENDIDIKAN",
  //   "MAHASISWA",
  // ]),
  PengaduanController.getAll
);

PengaduanRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN", "read"),
  // authMiddleware.checkRole([
  //   "PETUGAS",
  //   "PETUGAS_SUPER",
  //   "KEPALA_PETUGAS_UNIT",
  //   "DOSEN",
  //   "TENAGA_KEPENDIDIKAN",
  //   "MAHASISWA",
  // ]),
  PengaduanController.getById
);

PengaduanRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN", "create"),
  // authMiddleware.checkRole(["DOSEN", "TENAGA_KEPENDIDIKAN", "MAHASISWA"]),
  pengaudanValidation.validatePengaduanDTO,
  PengaduanController.create
);

PengaduanRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN", "update"),
  // authMiddleware.checkRole([
  //   "PETUGAS",
  //   "PETUGAS_SUPER",
  //   "KEPALA_PETUGAS_UNIT",
  //   "DOSEN",
  //   "TENAGA_KEPENDIDIKAN",
  //   "MAHASISWA",
  // ]),
  pengaudanValidation.validateUpdatePengaduanDTO,
  PengaduanController.update
);

PengaduanRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN", "delete"),
  // authMiddleware.checkRole([
  //   "PETUGAS",
  //   "PETUGAS_SUPER",
  //   "KEPALA_PETUGAS_UNIT",
  //   "DOSEN",
  //   "TENAGA_KEPENDIDIKAN",
  //   "MAHASISWA",
  // ]),
  PengaduanController.deleteByIds
);

export default PengaduanRoutes;
