import { Router } from "express";
import { getHealthController } from "../controllers/health.controller";

const router = Router();

// using all the routes here
router.get("/", getHealthController);

export default router;
