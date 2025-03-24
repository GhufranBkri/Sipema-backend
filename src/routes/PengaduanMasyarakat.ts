import { Hono } from "hono";
import * as PengaduanMasyarakatController from "$controllers/rest/PengaduanMasyarakatController";
import * as PengaduanMasyarakatValidation from "$validations/PengaduanMasyarakatValidation";
import * as AuthMiddleware from "$middlewares/authMiddleware";
// import { Roles } from "@prisma/client";
const PengaduanMasyarakatRoutes = new Hono();

PengaduanMasyarakatRoutes.get(
  "/",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("PENGADUAN_MASYARAKAT", "read"),
  // AuthMiddleware.checkRole([
  //   Roles.KEPALA_PETUGAS_UNIT,
  //   Roles.PETUGAS_SUPER,
  //   Roles.PETUGAS,
  // ]),
  PengaduanMasyarakatController.getAll
);

PengaduanMasyarakatRoutes.get(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("PENGADUAN_MASYARAKAT", "read"),
  // AuthMiddleware.checkRole([
  //   Roles.KEPALA_PETUGAS_UNIT,
  //   Roles.PETUGAS_SUPER,
  //   Roles.PETUGAS,
  // ]),
  PengaduanMasyarakatController.getById
);

PengaduanMasyarakatRoutes.post(
  "/",
  PengaduanMasyarakatValidation.validatePengaduanMasyarakatDTO,
  PengaduanMasyarakatController.create
);

PengaduanMasyarakatRoutes.patch(
  "/:id",
  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("PENGADUAN_MASYARAKAT", "update"),
  // AuthMiddleware.checkRole(["PETUGAS_SUPER", "KEPALA_PETUGAS_UNIT", "PETUGAS"]),
  PengaduanMasyarakatController.update
);

PengaduanMasyarakatRoutes.delete(
  "/",

  AuthMiddleware.checkJwt,
  AuthMiddleware.checkAccess("PENGADUAN", "delete"),
  PengaduanMasyarakatController.deleteByIds
);

export default PengaduanMasyarakatRoutes;
