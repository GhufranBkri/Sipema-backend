import { Hono } from "hono";
import * as PelaporanWBSController from "$controllers/rest/PelaporanWBSController";
import * as pengaudanValidation from "$validations/PelaporanWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";
import { Roles } from "@prisma/client";
import * as filterPengaduanMiddleware from "$middlewares/filterPengaduanMiddleware";

const PelaporanWBSRoutes = new Hono();

PelaporanWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.USER, Roles.PETUGAS_SUPER]),
  filterPengaduanMiddleware.filterPengaduanByRole,
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
  authMiddleware.checkRole([Roles.PETUGAS, Roles.USER, Roles.PETUGAS_SUPER]),
  pengaudanValidation.validatePelaporanWBSDTO,
  PelaporanWBSController.create
);

PelaporanWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.USER, Roles.PETUGAS_SUPER]),
  PelaporanWBSController.update
);

PelaporanWBSRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.USER, Roles.PETUGAS_SUPER]),
  PelaporanWBSController.deleteByIds
);

export default PelaporanWBSRoutes;
