import { RawHotelOffer } from "../types/hotel.types";

/**
 * Mock hotel data for Supplier B.
 * Intentionally overlaps with Supplier A on some hotel names
 * but with different prices to test deduplication logic.
 */
export const supplierBHotels: RawHotelOffer[] = [
  { name: "The Grand Palace", price: 4200, supplier: "Supplier B", commissionPct: 11 },   // cheaper than A
  { name: "Blue Horizon Inn", price: 2500, supplier: "Supplier B", commissionPct: 9 },    // more expensive than A
  { name: "Sunset Retreat", price: 2950, supplier: "Supplier B", commissionPct: 9 },      // cheaper than A
  { name: "Pearl Continental", price: 6100, supplier: "Supplier B", commissionPct: 14 },
  { name: "Dew Drop Lodge", price: 1500, supplier: "Supplier B", commissionPct: 6 },
  { name: "Summit View Hotel", price: 3400, supplier: "Supplier B", commissionPct: 11 },
  { name: "Metro Luxe Hotel", price: 4900, supplier: "Supplier B", commissionPct: 13 },   // cheaper than A
];
