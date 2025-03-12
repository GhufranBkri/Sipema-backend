import { Hono } from "hono";
import * as UserController from "$controllers/rest/UserController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as UserValidation from "$validations/UserValidation";
import * as authMiddleware from "$middlewares/authMiddleware";

const UserRoutes = new Hono();

UserRoutes.get(
  "/",
  AuthMiddleware.checkJwt,
  authMiddleware.checkRole(["ADMIN"]),
  UserController.getAll
);

UserRoutes.get(
  "/:id",
  AuthMiddleware.checkJwt,
  authMiddleware.checkRole(["ADMIN"]),
  UserController.getById
);

UserRoutes.post(
  "/",
  UserValidation.validateUserRegisterDTO,
  AuthMiddleware.checkJwt,
  authMiddleware.checkRole(["ADMIN"]),
  UserController.create
);

UserRoutes.put(
  "/:id",
  AuthMiddleware.checkJwt,
  authMiddleware.checkRole(["ADMIN"]),
  UserController.update
);

UserRoutes.delete(
  "/",
  UserValidation.validationDeletedUsers,
  AuthMiddleware.checkJwt,
  authMiddleware.checkRole(["ADMIN"]),
  UserController.deleteByIds
);

export default UserRoutes;
