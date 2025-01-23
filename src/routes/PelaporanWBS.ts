import { Hono } from "hono";
import * as PelaporanWBSController from "$controllers/rest/PelaporanWBSController";
import * as pengaudanValidation from "$validations/PelaporanWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";
import { Roles } from "@prisma/client";
// import * as filterPengaduanMiddleware from "$middlewares/filterPengaduanMiddleware";

const PelaporanWBSRoutes = new Hono();

PelaporanWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([Roles.PETUGAS, Roles.USER, Roles.PETUGAS_SUPER]),
  //   filterPengaduanMiddleware.filterPengaduanByRole,
  PelaporanWBSController.getAll
);

PelaporanWBSRoutes.get("/:id", PelaporanWBSController.getById);

PelaporanWBSRoutes.post(
  "/",
  pengaudanValidation.validatePelaporanWBSDTO,
  PelaporanWBSController.create
);

PelaporanWBSRoutes.put("/:id", PelaporanWBSController.update);

PelaporanWBSRoutes.delete("/", PelaporanWBSController.deleteByIds);

export default PelaporanWBSRoutes;
