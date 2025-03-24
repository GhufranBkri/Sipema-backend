import { Hono } from "hono";
import * as AclController from "$controllers/rest/AclController";
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as AclValidation from "$validations/AclValidation";

const AclRoutes = new Hono();

AclRoutes.get(
  "/features",
  AuthMiddleware.checkJwt,
  AclController.getAllFeatures
);

AclRoutes.get(
  "/:userLevelId",
  AuthMiddleware.checkJwt,
  AclController.getByUserLevelId
);

AclRoutes.get("/", AuthMiddleware.checkJwt, AclController.getAll);

AclRoutes.post(
  "/",
  AuthMiddleware.checkJwt,
  AclValidation.validateAclCreate,
  AclController.create
);

export default AclRoutes;
