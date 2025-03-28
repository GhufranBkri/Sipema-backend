import { Hono } from "hono";
import * as AclController from "$controllers/rest/AclController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as AclValidation from "$validations/AclValidation";

const AclRoutes = new Hono();

AclRoutes.get(
  "/features",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkAccess("ACL", "read"),
  AclController.getAllFeatures
);

AclRoutes.get(
  "/:userLevelId",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkAccess("ACL", "read"),
  AclController.getByUserLevelId
);

AuthMiddleware.checkAccess("ACL", "read"),
  AclRoutes.get("/", AuthMiddleware.checkJwt, AclController.getAll);

AclRoutes.post(
  "/",
  AuthMiddleware.checkJwt,
  // AuthMiddleware.checkAccess("ACL", "create"),
  AclValidation.validateAclCreate,
  AclController.create
);

export default AclRoutes;
