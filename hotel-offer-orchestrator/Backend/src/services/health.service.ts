import axios from "axios";
import { redis } from "../config/redis";
import { getTemporalClient } from "../config/temporal";
import { HealthReport, SupplierHealthStatus } from "../types/hotel.types";
import { env } from "../config/env";
import { logger } from "../config/logger";

async function pingSupplier(
  url: string,
  name: string,
): Promise<SupplierHealthStatus> {
  const start = Date.now();
  try {
    await axios.get(url, { timeout: 3000 });
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    logger.warn({ err, name }, "Supplier health check failed");
    return { status: "error", error: (err as Error).message };
  }
}

async function pingRedis(): Promise<{ status: "ok" | "error"; error?: string }> {
  try {
    await redis.ping();
    return { status: "ok" };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}

async function pingTemporal(): Promise<{ status: "ok" | "error"; error?: string }> {
  try {
    const client = await getTemporalClient();
    await client.connection.workflowService.getSystemInfo({});
    return { status: "ok" };
  } catch (err) {
    return { status: "error", error: (err as Error).message };
  }
}

/**
 * Runs all health checks concurrently and returns a HealthReport.
 * Status rules:
 * - "ok": redis ok, temporal ok, supplierA ok, supplierB ok
 * - "degraded": redis ok, temporal ok, and AT LEAST ONE supplier ok
 * - "error": otherwise (e.g. redis/temporal error or both suppliers down)
 */
export async function getHealthReport(): Promise<HealthReport> {
  const [redisStatus, temporalStatus, supplierA, supplierB] = await Promise.all([
    pingRedis(),
    pingTemporal(),
    pingSupplier(env.SUPPLIER_A_URL, "Supplier A"),
    pingSupplier(env.SUPPLIER_B_URL, "Supplier B"),
  ]);

  const infraOk = redisStatus.status === "ok" && temporalStatus.status === "ok";
  const bothSuppliersOk = supplierA.status === "ok" && supplierB.status === "ok";
  const atLeastOneSupplierOk = supplierA.status === "ok" || supplierB.status === "ok";

  let status: "ok" | "degraded" | "error";
  if (infraOk && bothSuppliersOk) {
    status = "ok";
  } else if (infraOk && atLeastOneSupplierOk) {
    status = "degraded";
  } else {
    status = "error";
  }

  return {
    status,
    redis: redisStatus,
    temporal: temporalStatus,
    supplierA,
    supplierB,
    timestamp: new Date().toISOString(),
  };
}
