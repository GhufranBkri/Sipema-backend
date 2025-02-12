
import { Hono } from "hono"
import * as PengaduanMasyarakatController from "$controllers/rest/PengaduanMasyarakatController"
import * as PengaduanMasyarakatValidation from "$validations/PengaduanMasyarakatValidation"
import * as AuthMiddleware from "$middlewares/authMiddleware";
import * as filterPengaduanMiddleware from "$middlewares/filterPengaduanMiddleware";
import { Roles } from "@prisma/client";
const PengaduanMasyarakatRoutes = new Hono();


PengaduanMasyarakatRoutes.get("/",
    AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.KEPALA_PETUGAS_UNIT, Roles.PETUGAS_SUPER, Roles.PETUGAS]),
    filterPengaduanMiddleware.filterPengaduanByRole,
    PengaduanMasyarakatController.getAll
)

PengaduanMasyarakatRoutes.get("/:id", AuthMiddleware.checkJwt,
    AuthMiddleware.checkRole([Roles.KEPALA_PETUGAS_UNIT, Roles.PETUGAS_SUPER, Roles.PETUGAS]),
    PengaduanMasyarakatController.getById
)


PengaduanMasyarakatRoutes.post("/",
    PengaduanMasyarakatValidation.validatePengaduanMasyarakatDTO,
    PengaduanMasyarakatController.create
)

PengaduanMasyarakatRoutes.patch("/:id", AuthMiddleware.checkJwt,
    PengaduanMasyarakatController.update
)

PengaduanMasyarakatRoutes.delete("/", AuthMiddleware.checkJwt,
    PengaduanMasyarakatController.deleteByIds
)

export default PengaduanMasyarakatRoutes
