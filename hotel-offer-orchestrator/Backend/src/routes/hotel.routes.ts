import { Router } from "express";
import { validateQuery } from "../middleware/validate.middleware";
import { getHotelsController, getHotelsQuerySchema } from "../controllers/hotel.controller";

const router = Router();

// using all the routes here
router.get("/", validateQuery(getHotelsQuerySchema), getHotelsController);

export default router;
