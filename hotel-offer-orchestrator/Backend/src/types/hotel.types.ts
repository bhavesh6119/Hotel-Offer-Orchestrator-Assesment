export type Supplier = "Supplier A" | "Supplier B";

/** Shape returned by /supplierA/hotels and /supplierB/hotels mock endpoints */
export interface RawSupplierHotel {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

/** Normalised offer shape used throughout the application */
export interface HotelOffer {
  name: string;
  price: number;
  supplier: Supplier;
  commissionPct: number;
}

/** Query params accepted by GET /api/hotels */
export interface GetHotelsQuery {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

/** Return value of hotelOfferWorkflow */
export interface WorkflowResult {
  hotels: HotelOffer[];
  warnings: string[];
}

export interface SupplierHealthStatus {
  status: "ok" | "error";
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded" | "error";
  redis: { status: "ok" | "error"; error?: string };
  temporal: { status: "ok" | "error"; error?: string };
  supplierA: SupplierHealthStatus;
  supplierB: SupplierHealthStatus;
  timestamp: string;
}
