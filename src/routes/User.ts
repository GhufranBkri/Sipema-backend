import { Hono } from "hono";
import * as UserController from "$controllers/rest/UserController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as UserValidation from "$validations/UserValidation";

const UserRoutes = new Hono();

UserRoutes.get(
  "/",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("USER_MANAGEMENT", "read"),
  // authMiddleware.checkRole(["ADMIN"]),
  UserController.getAll
);

UserRoutes.get(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("USER_MANAGEMENT", "read"),
  // authMiddleware.checkRole(["ADMIN"]),
  UserController.getById
);

UserRoutes.post(
  "/",
  UserValidation.validateUserRegisterDTO,
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("USER_MANAGEMENT", "create"),

  // authMiddleware.checkRole(["ADMIN"]),
  UserController.create
);

UserRoutes.put(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("USER_MANAGEMENT", "update"),
  // authMiddleware.checkRole(["ADMIN"]),
  UserController.update
);

UserRoutes.delete(
  "/",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("USER_MANAGEMENT", "update"),
  UserValidation.validationDeletedUsers,
  // authMiddleware.checkRole(["ADMIN"]),
  UserController.deleteByIds
);

export default UserRoutes;
