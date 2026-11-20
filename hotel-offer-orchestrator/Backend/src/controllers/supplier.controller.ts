import { Request, Response } from "express";
import { getSupplierAData } from "../mocks/supplierA.data";
import { getSupplierBData } from "../mocks/supplierB.data";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * @route GET /supplierA/hotels
 * @description Mock Supplier A endpoint returning raw hotel offers.
 * @access Public
 */
export function getSupplierAHotels(req: Request, res: Response): void {
  logger.debug({ query: req.query }, "Supplier A mock endpoint hit");

  if (env.SUPPLIER_A_DOWN) {
    logger.warn("Supplier A simulated down");
    res.status(503).json({ message: "Supplier A unavailable" });
    return;
  }

  const city = typeof req.query.city === "string" ? req.query.city : "";
  const hotels = getSupplierAData(city);
  res.json(hotels);
}

/**
 * @route GET /supplierB/hotels
 * @description Mock Supplier B endpoint returning raw hotel offers.
 * @access Public
 */
export function getSupplierBHotels(req: Request, res: Response): void {
  logger.debug({ query: req.query }, "Supplier B mock endpoint hit");

  if (env.SUPPLIER_B_DOWN) {
    logger.warn("Supplier B simulated down");
    res.status(503).json({ message: "Supplier B unavailable" });
    return;
  }

  const city = typeof req.query.city === "string" ? req.query.city : "";
  const hotels = getSupplierBData(city);
  res.json(hotels);
}
