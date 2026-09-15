const BOOLEAN_PHRASES: Array<[RegExp, string]> = [
  [/\bbut\s+not\b/g, " __not__ "],
  [/\b(and also|plus also|who also|that also|along with|together with|combined with)\b/g, " __and__ "],
  [/\b(and|plus)\b/g, " __and__ "],
  [/\b(or|either)\b/g, " __or__ "],
  [/\b(excluding|without|except|not)\b/g, " __not__ "],
];

// Longest phrases are removed before individual words. Boolean operators,
// exclusions, modifiers and dimensions are deliberately absent from this list.
const FILLER_PHRASES = [
  "having affinity towards", "having affinity for", "showing interest in",
  "platform audience instance", "kind of people", "type of people", "set of users",
  "group of users", "likely to have", "likely to be", "spending time on",
  "associated with", "interested in", "show interest in", "preference for",
  "looking for", "searching for", "spend time on", "going out for", "hang out for",
  "activation for", "planning for", "campaign for", "available scale", "reach for",
  "audience size", "go out for", "visit for", "hangout for", "engaging with",
  "engaged with", "engage with", "related to", "affinity towards", "affinity for",
  "are into", "based on", "media for", "scale for", "likely to", "hang out",
  "hangout", "consuming", "consumes", "consume", "preferred", "prefers",
  "loving", "loves", "liked", "likes", "seeking", "targeting", "identify",
  "discover", "estimate", "calculate", "create", "build", "search", "find",
  "show", "give", "get", "target", "someone", "anyone", "everyone",
  "individuals", "personas", "profiles", "population", "consumers", "consumer",
  "customers", "customer", "segments", "segment", "audience", "cohort", "people",
  "users", "user", "folks", "who", "that", "which", "those", "these", "want",
  "wants", "need", "needs", "using", "uses", "use", "prefer", "love", "like",
  "around", "the", "a", "an", "for", "to", "of", "in", "on", "at", "by",
  "from", "with", "as", "is", "are", "was", "were", "be", "being", "been",
  "have", "also",
].sort((a, b) => b.length - a.length);

const ALIASES: Array<[RegExp, string]> = [
  [/\bparty(?:ing|goers?)?\b/g, "party"],
  [/\bparty\s*\/\s*nightlife\b/g, "party"],
  [/\bnightlife\b/g, "party"],
  [/\bdine[\s-]?out\b/g, "dine out"],
  [/\bdining\s+out\b/g, "dine out"],
  [/\bquickcommerce\b/g, "quick commerce"],
  [/\bchoclate\b/g, "chocolate"],
  [/\binternationally\b/g, "international"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeAudienceBrief(input: string): string {
  let value = String(input || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9+\s/-]/g, " ");
  for (const [pattern, replacement] of ALIASES) value = value.replace(pattern, replacement);
  for (const [pattern, replacement] of BOOLEAN_PHRASES) value = value.replace(pattern, replacement);
  for (const phrase of FILLER_PHRASES) {
    value = value.replace(new RegExp(`\\b${escapeRegExp(phrase).replace(/\\ /g, "\\s+")}\\b`, "g"), " ");
  }
  value = value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(?:__and__\s*){2,}/g, "__and__ ")
    .replace(/(?:__or__\s*){2,}/g, "__or__ ")
    .replace(/^(?:__and__|__or__)\s+|\s+(?:__and__|__or__)$/g, "")
    .trim();
  return value
    .replace(/__and__/g, "AND")
    .replace(/__or__/g, "OR")
    .replace(/__not__/g, "NOT")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalAnchor(value: string): string {
  let normalized = String(value || "").toLowerCase().trim();
  for (const [pattern, replacement] of ALIASES) normalized = normalized.replace(pattern, replacement);
  return normalizeAudienceBrief(normalized).toLowerCase();
}

export function semanticIrKey(ir: Record<string, unknown>): string {
  const anchors = Array.isArray(ir.anchors) ? ir.anchors : [];
  const modifiers = Array.isArray(ir.modifiers) ? ir.modifiers : [];
  const dimensions = (ir.dimensions && typeof ir.dimensions === "object")
    ? ir.dimensions as Record<string, unknown>
    : {};
  return JSON.stringify({
    join: ir.join === "AND" ? "AND" : "OR",
    anchors: anchors.map((raw: unknown, index: number) => {
      const anchor = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
      const group = Number(anchor.group);
      return {
        id: `a${index + 1}`,
        canonical: canonicalAnchor(String(anchor.canonical || "")),
        family: String(anchor.family || "").toLowerCase().trim(),
        role: index === 0 ? "primary" : (ir.join === "AND" ? "and" : "or"),
        group: Number.isFinite(group) ? group : 0,
        tokens: [canonicalAnchor(String(anchor.canonical || ""))].filter(Boolean),
      };
    }),
    modifiers: modifiers.map((raw: unknown) => {
      const modifier = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
      return {
        token: String(modifier.token || "").toLowerCase().trim(),
        op: String(modifier.op || "PREFER_ROW_ELSE_SCALE"),
        param: modifier.param ?? 0.12,
        applies_to: Array.isArray(modifier.applies_to) ? [...modifier.applies_to].sort() : [],
      };
    }).sort((a, b) => a.token.localeCompare(b.token)),
    dimensions: {
      geo_tier: Array.isArray(dimensions.geo_tier) ? [...dimensions.geo_tier].sort() : [],
      age_bucket: Array.isArray(dimensions.age_bucket) ? [...dimensions.age_bucket].sort() : [],
      gender_bucket: Array.isArray(dimensions.gender_bucket) ? [...dimensions.gender_bucket].sort() : [],
      city: dimensions.city ?? null,
      above_age: dimensions.above_age ?? null,
    },
    exclusions: Array.isArray(ir.exclusions)
      ? ir.exclusions.map((value) => canonicalAnchor(String(value))).filter(Boolean).sort()
      : [],
    mode: ir.mode || "expected",
    refuse: {
      flag: Boolean((ir.refuse as Record<string, unknown> | undefined)?.flag),
      reason: (ir.refuse as Record<string, unknown> | undefined)?.reason ?? null,
    },
  });
}