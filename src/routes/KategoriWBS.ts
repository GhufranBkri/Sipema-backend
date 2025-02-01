import { Hono } from "hono";
import * as KategoriWBSController from "$controllers/rest/KategoriWBSController";
import { validateKategoriWBSDTO } from "$validations/KategoriWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";
import { Roles } from "@prisma/client";

const KategoriWBSRoutes = new Hono();

KategoriWBSRoutes.get(
  "/",
  authMiddleware.checkJwt,
  KategoriWBSController.getAll
);

KategoriWBSRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  KategoriWBSController.getById
);

KategoriWBSRoutes.post(
  "/",
  authMiddleware.checkRole([Roles.ADMIN]),
  authMiddleware.checkJwt,
  validateKategoriWBSDTO,
  KategoriWBSController.create
);

KategoriWBSRoutes.put(
  "/:id",
  authMiddleware.checkRole([Roles.ADMIN]),
  authMiddleware.checkJwt,
  KategoriWBSController.update
);

KategoriWBSRoutes.delete(
  "/",
  authMiddleware.checkRole([Roles.ADMIN]),
  authMiddleware.checkJwt,
  KategoriWBSController.deleteByIds
);

export default KategoriWBSRoutes;
