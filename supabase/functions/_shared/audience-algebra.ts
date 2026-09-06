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
  const intersection = boundedIntersection(left, right, population, rho);
  return unionFromIntersection(left, right, intersection);
}

export type BooleanReach = { left: number; right: number; intersection: number; union: number; difference: number };

/**
 * Calculate the intersection once, then derive OR and NOT from that exact value.
 * This is the sole Boolean arithmetic path for total, purchase and interest reach.
 */
export function booleanReach(left: number, right: number, population: number, rho: number): BooleanReach {
  const a = Math.min(finite(left), finite(population));
  const b = Math.min(finite(right), finite(population));
  const intersection = boundedIntersection(a, b, population, rho);
  const result = {
    left: a,
    right: b,
    intersection,
    union: unionFromIntersection(a, b, intersection),
    difference: Math.max(0, a - intersection),
  };
  assertBooleanReach(result);
  return result;
}

export function unionFromIntersection(left: number, right: number, intersection: number) {
  return finite(left) + finite(right) - Math.min(finite(intersection), finite(left), finite(right));
}

/** Throws rather than allowing mathematically inconsistent audience results to ship. */
export function assertBooleanReach(result: BooleanReach) {
  const { left: a, right: b, intersection: and, union: or, difference: not } = result;
  const epsilon = 1e-6;
  if (and > Math.min(a, b) + epsilon) throw new Error("Audience invariant failed: AND > min(A,B)");
  if (Math.abs(or - (a + b - and)) > epsilon) throw new Error("Audience invariant failed: OR != A+B-AND");
  if (or + epsilon < Math.max(a, b)) throw new Error("Audience invariant failed: OR < max(A,B)");
  if (or > a + b + epsilon) throw new Error("Audience invariant failed: OR > A+B");
  if (Math.abs(not - (a - and)) > epsilon) throw new Error("Audience invariant failed: NOT != A-AND");
  if (not < -epsilon) throw new Error("Audience invariant failed: NOT < 0");
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
  return booleanReach(included, excluded, population, rho).difference;
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
