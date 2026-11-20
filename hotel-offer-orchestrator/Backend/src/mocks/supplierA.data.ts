import { RawSupplierHotel } from "../types/hotel.types";

/**
 * Mock hotel data for Supplier A.
 * - delhi: 7 hotels; 4 overlap with Supplier B names.
 *   "Radison " (trailing space) tests name normalisation against "radison" in Supplier B.
 * - mumbai: 5 hotels; 2 overlap with Supplier B names.
 */
const delhi: RawSupplierHotel[] = [
  { hotelId: "A-D1", name: "The Grand Palace",    price: 4500, city: "delhi",  commissionPct: 12 },
  { hotelId: "A-D2", name: "Blue Horizon Inn",    price: 2200, city: "delhi",  commissionPct: 10 },
  { hotelId: "A-D3", name: "Sunset Retreat",      price: 3100, city: "delhi",  commissionPct: 8  },
  { hotelId: "A-D4", name: "Metro Luxe Hotel",    price: 5200, city: "delhi",  commissionPct: 15 },
  { hotelId: "A-D5", name: "City Comfort Suites", price: 1800, city: "delhi",  commissionPct: 7  },
  { hotelId: "A-D6", name: "Royal Heritage Resort",price: 7800, city: "delhi", commissionPct: 18 },
  // Name with trailing space — normalises to "radison" for dedup against Supplier B
  { hotelId: "A-D7", name: "Radison ",            price: 3200, city: "delhi",  commissionPct: 11 },
];

const mumbai: RawSupplierHotel[] = [
  { hotelId: "A-M1", name: "Sea Pearl Hotel",     price: 5100, city: "mumbai", commissionPct: 13 },
  { hotelId: "A-M2", name: "Harbor Lights Inn",   price: 2800, city: "mumbai", commissionPct: 9  },
  { hotelId: "A-M3", name: "Marine Drive Suites", price: 4200, city: "mumbai", commissionPct: 12 },
  { hotelId: "A-M4", name: "Bandra Boutique",     price: 3500, city: "mumbai", commissionPct: 10 },
  { hotelId: "A-M5", name: "Gateway Grand",       price: 6300, city: "mumbai", commissionPct: 16 },
];

const dataByCity: Record<string, RawSupplierHotel[]> = { delhi, mumbai };

/** Returns hotels for a given city (case-insensitive). Unknown city → []. */
export function getSupplierAData(city: string): RawSupplierHotel[] {
  return dataByCity[city.trim().toLowerCase()] ?? [];
}
