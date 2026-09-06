import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeAudienceBrief, semanticIrKey } from "../_shared/query-normalization.ts";

const wrappers = ["people", "users", "audience", "cohort", "segment", "consumers", "customers", "folks", "individuals", "personas"];
const joins = ["and", "and also", "along with", "together with", "combined with"];
const behaviors = ["dineout", "dine out", "go out for dineout", "interested in dineout", "who like dining out"];
const PARTY_DINE_OUT_VARIANTS = wrappers.flatMap((wrapper, i) =>
  joins.flatMap((join, j) => behaviors.slice((i + j) % behaviors.length).map((behavior) => `${wrapper} who like partying ${join} ${behavior} folks`))
).slice(0, 100);

Deno.test("100 Party AND Dine Out paraphrases normalize identically", () => {
  assertEquals(PARTY_DINE_OUT_VARIANTS.length, 100);
  for (const phrase of PARTY_DINE_OUT_VARIANTS) {
    assertEquals(normalizeAudienceBrief(phrase), "party AND dine out", phrase);
  }
});

Deno.test("keeps modifiers and dimensions", () => {
  assertEquals(normalizeAudienceBrief("audience interested in premium skincare"), "premium skincare");
  assertEquals(normalizeAudienceBrief("people who are likely to travel internationally"), "travel international");
  assertEquals(
    normalizeAudienceBrief("female users above 25 in metro interested in premium chocolate"),
    "female above 25 metro premium chocolate",
  );
});

Deno.test("keeps exclusions and true Boolean operators", () => {
  assertEquals(normalizeAudienceBrief("users who like party but not dineout"), "party NOT dine out");
  assertEquals(normalizeAudienceBrief("party excluding dineout"), "party NOT dine out");
  assertEquals(normalizeAudienceBrief("party or dineout"), "party OR dine out");
  assertEquals(normalizeAudienceBrief("either party or dineout"), "party OR dine out");
});

Deno.test("semantic identity separates AND, OR, and exclusions", () => {
  const base = {
    anchors: [
      { canonical: "party", family: "entertainment" },
      { canonical: "dineout", family: "dining" },
    ],
    modifiers: [], dimensions: {}, mode: "expected", refuse: { flag: false, reason: null },
  };
  const andKey = semanticIrKey({ ...base, join: "AND", exclusions: [] });
  const orKey = semanticIrKey({ ...base, join: "OR", exclusions: [] });
  const notKey = semanticIrKey({ ...base, anchors: base.anchors.slice(0, 1), join: "OR", exclusions: ["dine out"] });
  assertEquals(andKey === orKey, false);
  assertEquals(orKey === notKey, false);
});