export type ReachParts = { total: number; actual: number; intent: number };

const finite = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;

export function boundedIntersection(left: number, right: number, population: number, rho: number) {
  const a = finite(left);
  const b = finite(right);
  const pop = Math.max(1, finite(population));
  const lower = Math.max(0, a + b - pop);
  const upper = Math.min(a, b);
  return lower + Math.min(1, Math.max(0, rho)) * (upper - lower);
}

export function boundedUnion(left: number, right: number, population: number, rho: number) {
  return Math.min(finite(population), finite(left) + finite(right) - boundedIntersection(left, right, population, rho));
}

export function reconcileReach(total: number, actual: number): ReachParts {
  const safeTotal = finite(total);
  const safeActual = Math.min(safeTotal, finite(actual));
  return { total: safeTotal, actual: safeActual, intent: Math.max(0, safeTotal - safeActual) };
}

export function selectEvidence(parts: ReachParts, evidence: "actual" | "intent" | null): ReachParts {
  if (evidence === "actual") return { total: parts.actual, actual: parts.actual, intent: 0 };
  if (evidence === "intent") return { total: parts.intent, actual: 0, intent: parts.intent };
  return parts;
}

export function subtractAudience(included: number, excluded: number, population: number, rho: number) {
  return Math.max(0, finite(included) - boundedIntersection(included, excluded, population, rho));
}

/**
 * Purchase-backed and interest-backed are each counted in full and overlap each other.
 * Their union can never be smaller than the larger one, nor larger than their sum.
 */
export function reconcileUnion(total: number, actual: number, intent: number) {
  const a = finite(actual);
  const i = finite(intent);
  return Math.min(a + i, Math.max(Math.max(a, i), finite(total)));
}

/** Scale a whole result down to a ceiling, keeping the parts in proportion. */
export function capParts(total: number, actual: number, intent: number, ceiling: number): ReachParts {
  const t = finite(total);
  const c = Math.max(0, finite(ceiling));
  if (t <= c || t === 0) return { total: t, actual: finite(actual), intent: finite(intent) };
  const k = c / t;
  return { total: c, actual: finite(actual) * k, intent: finite(intent) * k };
}
