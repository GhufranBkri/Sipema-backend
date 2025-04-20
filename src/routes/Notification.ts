import { Hono } from "hono";
import * as NotificationController from "$controllers/rest/NotificationController";
import * as authMiddleware from "$middlewares/authMiddleware";

const NotificationRoutes = new Hono();

NotificationRoutes.get(
  "/",
  authMiddleware.checkJwt,
  NotificationController.getAll
);

NotificationRoutes.get("/:id", NotificationController.getById);

NotificationRoutes.put("/:id", NotificationController.update);

NotificationRoutes.delete("/", NotificationController.deleteByIds);

export default NotificationRoutes;
