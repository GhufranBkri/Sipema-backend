import { Hono } from "hono";
import * as KategoriController from "$controllers/rest/KategoriController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as KategoriValidation from "$validations/KategoriValidation";

const KategoriRoutes = new Hono();

KategoriRoutes.get("/", KategoriController.getAll);

KategoriRoutes.get("/:id", KategoriController.getById);

KategoriRoutes.post(
  "/",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("KATEGORI", "create"),
  KategoriValidation.validateKategoriDTO,
  KategoriController.create
);

KategoriRoutes.put(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("KATEGORI", "update"),
  KategoriController.update
);

KategoriRoutes.delete(
  "/",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("KATEGORI", "delete"),
  KategoriValidation.deleteValidationKatergori,
  KategoriController.deleteByIds
);

export default KategoriRoutes;
