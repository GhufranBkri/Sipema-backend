import { Hono } from "hono";
import * as PelaporanWBSController from "$controllers/rest/PelaporanWBSController";
import * as pengaudanValidation from "$validations/PelaporanWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";

const PelaporanWBSRoutes = new Hono();

PelaporanWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN_WBS", "read"),
  PelaporanWBSController.getAll
);

PelaporanWBSRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN_WBS", "read"),
  PelaporanWBSController.getById
);

PelaporanWBSRoutes.post(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN_WBS", "create"),

  pengaudanValidation.validatePelaporanWBSDTO,
  PelaporanWBSController.create
);

PelaporanWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN_WBS", "update"),
  pengaudanValidation.validatePelaporanWBSUpdateDTO,
  PelaporanWBSController.update
);

PelaporanWBSRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PENGADUAN_WBS", "delete"),
  PelaporanWBSController.deleteByIds
);

export default PelaporanWBSRoutes;
