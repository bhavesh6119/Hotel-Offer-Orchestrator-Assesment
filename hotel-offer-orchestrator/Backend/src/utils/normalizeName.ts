/**
 * Normalises a hotel name to a consistent cache key:
 * lower-cased, trimmed, and collapsed whitespace.
 * Used to deduplicate hotels whose names differ only in casing/spacing.
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
