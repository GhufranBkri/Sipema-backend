import { Hono } from "hono";
import * as KategoriWBSController from "$controllers/rest/KategoriWBSController";
import { validateKategoriWBSDTO } from "$validations/KategoriWBSValidation";
import * as authMiddleware from "$middlewares/authMiddleware";

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
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("KATEGORI_WBS", "create"),
  validateKategoriWBSDTO,
  KategoriWBSController.create
);

KategoriWBSRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("KATEGORI_WBS", "update"),
  KategoriWBSController.update
);

KategoriWBSRoutes.delete(
  "/",
  // authMiddleware.checkRole([Roles.ADMIN]),
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("KATEGORI_WBS", "delete"),
  KategoriWBSController.deleteByIds
);

export default KategoriWBSRoutes;
