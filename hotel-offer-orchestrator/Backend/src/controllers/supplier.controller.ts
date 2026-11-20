import { Request, Response } from "express";
import { supplierAHotels } from "../mocks/supplierA.data";
import { supplierBHotels } from "../mocks/supplierB.data";
import { logger } from "../config/logger";

/**
 * @route GET /supplierA/hotels
 * @description Mock Supplier A endpoint returning raw hotel offers.
 * @access Public
 */
export function getSupplierAHotels(req: Request, res: Response): void {
  logger.debug("Supplier A mock endpoint hit");
  res.json(supplierAHotels);
}

/**
 * @route GET /supplierB/hotels
 * @description Mock Supplier B endpoint returning raw hotel offers.
 * @access Public
 */
export function getSupplierBHotels(req: Request, res: Response): void {
  logger.debug("Supplier B mock endpoint hit");
  res.json(supplierBHotels);
}
