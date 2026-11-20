import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mergeOffers } from "./mergeOffers";
import { HotelOffer } from "../types/hotel.types";

describe("mergeOffers", () => {
  test("keeps the cheaper offer when names overlap", () => {
    const offersA: HotelOffer[] = [
      { name: "Grand Palace", price: 4500, supplier: "Supplier A", commissionPct: 12 },
    ];
    const offersB: HotelOffer[] = [
      { name: "Grand Palace", price: 4200, supplier: "Supplier B", commissionPct: 11 },
    ];

    const result = mergeOffers(offersA, offersB);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      name: "Grand Palace",
      price: 4200,
      supplier: "Supplier B",
      commissionPct: 11,
    });
  });

  test("keeps unique hotels from both suppliers", () => {
    const offersA: HotelOffer[] = [
      { name: "Hotel Alpha", price: 3000, supplier: "Supplier A", commissionPct: 10 },
    ];
    const offersB: HotelOffer[] = [
      { name: "Hotel Beta", price: 3500, supplier: "Supplier B", commissionPct: 8 },
    ];

    const result = mergeOffers(offersA, offersB);
    assert.equal(result.length, 2);
    const names = result.map((r) => r.name);
    assert.ok(names.includes("Hotel Alpha"));
    assert.ok(names.includes("Hotel Beta"));
  });

  test("normalises hotel names (casing and whitespace) to deduplicate", () => {
    const offersA: HotelOffer[] = [
      { name: "  Radison   Plaza ", price: 3200, supplier: "Supplier A", commissionPct: 10 },
    ];
    const offersB: HotelOffer[] = [
      { name: "radison plaza", price: 3500, supplier: "Supplier B", commissionPct: 12 },
    ];

    const result = mergeOffers(offersA, offersB);
    assert.equal(result.length, 1);
    assert.equal(result[0].price, 3200);
    assert.equal(result[0].supplier, "Supplier A");
  });

  test("breaks price tie by lower commissionPct", () => {
    const offersA: HotelOffer[] = [
      { name: "Sunset Inn", price: 2000, supplier: "Supplier A", commissionPct: 15 },
    ];
    const offersB: HotelOffer[] = [
      { name: "Sunset Inn", price: 2000, supplier: "Supplier B", commissionPct: 10 },
    ];

    const result = mergeOffers(offersA, offersB);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      name: "Sunset Inn",
      price: 2000,
      supplier: "Supplier B",
      commissionPct: 10,
    });
  });

  test("breaks price and commissionPct tie in favour of Supplier A", () => {
    const offersA: HotelOffer[] = [
      { name: "Ocean Breeze", price: 5000, supplier: "Supplier A", commissionPct: 10 },
    ];
    const offersB: HotelOffer[] = [
      { name: "Ocean Breeze", price: 5000, supplier: "Supplier B", commissionPct: 10 },
    ];

    const res1 = mergeOffers(offersA, offersB);
    assert.equal(res1[0].supplier, "Supplier A");

    const res2 = mergeOffers(offersB, offersA);
    assert.equal(res2[0].supplier, "Supplier A");
  });
});
