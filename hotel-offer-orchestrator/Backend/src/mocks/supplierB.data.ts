import { RawSupplierHotel } from "../types/hotel.types";

/**
 * Mock hotel data for Supplier B.
 * - delhi: 7 hotels; 4 overlap with Supplier A names.
 *   The cheaper supplier DIFFERS per hotel:
 *     "The Grand Palace"  → B cheaper (4200 < 4500)
 *     "Blue Horizon Inn"  → A cheaper (2200 < 2500)
 *     "Sunset Retreat"    → B cheaper (2950 < 3100)
 *     "Metro Luxe Hotel"  → B cheaper (4900 < 5200)
 *   "radison" tests name normalisation against "Radison " in Supplier A.
 * - mumbai: 5 hotels; 2 overlap with Supplier A names.
 */
const delhi: RawSupplierHotel[] = [
  { hotelId: "B-D1", name: "The Grand Palace",  price: 4200, city: "delhi",  commissionPct: 11 },  // B cheaper
  { hotelId: "B-D2", name: "Blue Horizon Inn",  price: 2500, city: "delhi",  commissionPct: 9  },  // A cheaper
  { hotelId: "B-D3", name: "Sunset Retreat",    price: 2950, city: "delhi",  commissionPct: 9  },  // B cheaper
  { hotelId: "B-D4", name: "Metro Luxe Hotel",  price: 4900, city: "delhi",  commissionPct: 13 },  // B cheaper
  { hotelId: "B-D5", name: "Pearl Continental", price: 6100, city: "delhi",  commissionPct: 14 },
  { hotelId: "B-D6", name: "Dew Drop Lodge",    price: 1500, city: "delhi",  commissionPct: 6  },
  // "radison" normalises to same key as "Radison " from Supplier A; A is cheaper (3200 < 3600)
  { hotelId: "B-D7", name: "radison",           price: 3600, city: "delhi",  commissionPct: 10 },
];

const mumbai: RawSupplierHotel[] = [
  { hotelId: "B-M1", name: "Sea Pearl Hotel",    price: 4800, city: "mumbai", commissionPct: 12 }, // B cheaper
  { hotelId: "B-M2", name: "Gateway Grand",      price: 7000, city: "mumbai", commissionPct: 17 }, // A cheaper
  { hotelId: "B-M3", name: "Juhu Beach Resort",  price: 3900, city: "mumbai", commissionPct: 11 },
  { hotelId: "B-M4", name: "Colaba Comforts",    price: 2600, city: "mumbai", commissionPct: 8  },
  { hotelId: "B-M5", name: "Worli Skyline Hotel",price: 5500, city: "mumbai", commissionPct: 14 },
];

const dataByCity: Record<string, RawSupplierHotel[]> = { delhi, mumbai };

/** Returns hotels for a given city (case-insensitive). Unknown city → []. */
export function getSupplierBData(city: string): RawSupplierHotel[] {
  return dataByCity[city.trim().toLowerCase()] ?? [];
}
