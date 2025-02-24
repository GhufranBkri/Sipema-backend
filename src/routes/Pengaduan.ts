import { Hono } from "hono";
import * as PengaduanController from "$controllers/rest/PengaduanController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as pengaudanValidation from "$validations/PengaduanValidation";
import { Roles } from "@prisma/client";

const PengaduanRoutes = new Hono();

PengaduanRoutes.get("/count", PengaduanController.getTotalCount);

PengaduanRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    Roles.PETUGAS,
    Roles.DOSEN,
    Roles.KEPALA_PETUGAS_UNIT,
    Roles.MAHASISWA,
    Roles.USER,
    Roles.PETUGAS_SUPER,
  ]),
  PengaduanController.getAll
);

PengaduanRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    Roles.PETUGAS,
    Roles.DOSEN,
    Roles.MAHASISWA,
    Roles.USER,
    Roles.PETUGAS_SUPER,
    Roles.KEPALA_PETUGAS_UNIT,
  ]),
  PengaduanController.getById
);

PengaduanRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.USER, Roles.DOSEN, Roles.MAHASISWA]),
  pengaudanValidation.validatePengaduanDTO,
  PengaduanController.create
);

PengaduanRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.PETUGAS_SUPER]),
  PengaduanController.update
);

PengaduanRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.PETUGAS_SUPER]),
  PengaduanController.deleteByIds
);

export default PengaduanRoutes;
