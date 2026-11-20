export type Supplier = "Supplier A" | "Supplier B";

export interface HotelOffer {
  name: string;
  price: number;
  supplier: Supplier;
  commissionPct: number;
}

export interface RawHotelOffer {
  name: string;
  price: number;
  supplier: Supplier;
  commissionPct: number;
}

export interface GetHotelsQuery {
  city: string;
  minPrice?: number;
  maxPrice?: number;
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
