import { Hono } from "hono";
import * as KategoriWBSController from "$controllers/rest/KategoriWBSController";
import { validateKategoriWBSDTO } from "$validations/KategoriWBSValidation";

const KategoriWBSRoutes = new Hono();

KategoriWBSRoutes.get("/", KategoriWBSController.getAll);

KategoriWBSRoutes.get("/:id", KategoriWBSController.getById);

KategoriWBSRoutes.post(
  "/",
  validateKategoriWBSDTO,
  KategoriWBSController.create
);

KategoriWBSRoutes.put("/:id", KategoriWBSController.update);

KategoriWBSRoutes.delete("/", KategoriWBSController.deleteByIds);

export default KategoriWBSRoutes;
