import { Hono } from "hono";
import * as UserLevelsController from "$controllers/rest/UserLevelsController";

const UserLevelsRoutes = new Hono();

UserLevelsRoutes.get("/", UserLevelsController.getAll);

UserLevelsRoutes.get("/:id", UserLevelsController.getById);

UserLevelsRoutes.post("/", UserLevelsController.create);

UserLevelsRoutes.put("/:id", UserLevelsController.update);

UserLevelsRoutes.delete("/", UserLevelsController.deleteByIds);

export default UserLevelsRoutes;
