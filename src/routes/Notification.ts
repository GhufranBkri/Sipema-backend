import { Hono } from "hono";
import * as NotificationController from "$controllers/rest/NotificationController";
import * as authMiddleware from "$middlewares/authMiddleware";
import * as notificationValidation from "$validations/NotificationValidation";

const NotificationRoutes = new Hono();

NotificationRoutes.get(
  "/",
  authMiddleware.checkJwt,
  NotificationController.getAll
);

NotificationRoutes.post(
  "/OfficerAlert",
  authMiddleware.checkJwt,
  authMiddleware.checkAccess("PEMBERITAHUAN_PETUGAS", "create"),
  notificationValidation.validateAllertToOfficer,
  NotificationController.notifyOfficerAlert
);

NotificationRoutes.get(
  "/:id",
  authMiddleware.checkJwt,
  NotificationController.getById
);

NotificationRoutes.put(
  "/:id",
  authMiddleware.checkJwt,
  NotificationController.update
);

NotificationRoutes.delete(
  "/",
  authMiddleware.checkJwt,
  NotificationController.deleteByIds
);

export default NotificationRoutes;
