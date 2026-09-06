import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { boundedIntersection, boundedUnion, reconcileReach, selectEvidence, subtractAudience } from "../_shared/audience-algebra.ts";

Deno.test("Boolean reach obeys ordering and population bounds", () => {
  const andReach = boundedIntersection(300, 200, 1000, 0.25);
  const orReach = boundedUnion(300, 200, 1000, 0.25);
  assertEquals(andReach, 50);
  assertEquals(orReach, 450);
  assertEquals(orReach >= 300 && 300 >= andReach, true);
});

Deno.test("evidence classes reconcile exactly to total", () => {
  const all = reconcileReach(450, 300);
  assertEquals(all, { total: 450, actual: 300, intent: 150 });
  assertEquals(selectEvidence(all, "actual"), { total: 300, actual: 300, intent: 0 });
  assertEquals(selectEvidence(all, "intent"), { total: 150, actual: 0, intent: 150 });
});

Deno.test("exclusion never increases or makes reach negative", () => {
  assertEquals(subtractAudience(300, 200, 1000, 0.25), 250);
  assertEquals(subtractAudience(10, 900, 1000, 1), 0);
});