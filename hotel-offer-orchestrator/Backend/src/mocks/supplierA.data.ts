import { RawHotelOffer } from "../types/hotel.types";

/**
 * Mock hotel data for Supplier A.
 * Intentionally overlaps with Supplier B on some hotel names
 * but with different prices to test deduplication logic.
 */
export const supplierAHotels: RawHotelOffer[] = [
  { name: "The Grand Palace", price: 4500, supplier: "Supplier A", commissionPct: 12 },
  { name: "Blue Horizon Inn", price: 2200, supplier: "Supplier A", commissionPct: 10 },
  { name: "Sunset Retreat", price: 3100, supplier: "Supplier A", commissionPct: 8 },
  { name: "Metro Luxe Hotel", price: 5200, supplier: "Supplier A", commissionPct: 15 },
  { name: "City Comfort Suites", price: 1800, supplier: "Supplier A", commissionPct: 7 },
  { name: "Royal Heritage Resort", price: 7800, supplier: "Supplier A", commissionPct: 18 },
  { name: "Riverside Boutique", price: 2900, supplier: "Supplier A", commissionPct: 10 },
];
