import { Hono } from "hono";
import * as NotificationController from "$controllers/rest/NotificationController";
import * as authMiddleware from "$middlewares/authMiddleware";

const NotificationRoutes = new Hono();

NotificationRoutes.get(
  "/",
  authMiddleware.checkJwt,
  authMiddleware.checkRole([
    "DOSEN",
    "KEPALA_PETUGAS_UNIT",
    "KEPALA_WBS",
    "MAHASISWA",
    "PETUGAS",
    "PETUGAS_SUPER",
    "PETUGAS_WBS",
    "TENAGA_KEPENDIDIKAN",
  ]),
  NotificationController.getAll
);

NotificationRoutes.get("/:id", NotificationController.getById);

// NotificationRoutes.post("/", NotificationController.create);

NotificationRoutes.put("/:id", NotificationController.update);

NotificationRoutes.delete("/", NotificationController.deleteByIds);

export default NotificationRoutes;
