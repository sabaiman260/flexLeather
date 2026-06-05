import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { getSettings, updateSettings } from "./settings.controller.js";

const settingsRouter = Router();

settingsRouter.get("/", getSettings);
settingsRouter.put("/", isLoggedIn, isAdmin, updateSettings);

export default settingsRouter;
