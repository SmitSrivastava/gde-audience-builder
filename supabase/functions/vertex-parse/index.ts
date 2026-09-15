// Supabase Edge Function: vertex-parse
// Role: QueryIR compiler ONLY. Never returns a volume.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";
import { canonicalAnchor, normalizeAudienceBrief, semanticIrKey } from "../_shared/query-normalization.ts";

const PROJECT = Deno.env.get("GCP_PROJECT") ?? "acceleration-ga-poc";
const LOCATION = Deno.env.get("GCP_LOCATION") ?? "asia-south1";
const MODEL = Deno.env.get("GCP_MODEL") ?? "gemini-2.5-flash";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normBrief(s: string): string {
  return normalizeAudienceBrief(s);
}
async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SYSTEM = `You are the QueryIR compiler for WPP GDE Audience Intelligence (India).
You do NOT estimate audience size. You do NOT pick overlap percentages. You do NOT pick partners.
You do NOT pick catalog rows and you do NOT output synonym lists beyond obvious spelling variants.
Emit JSON only that matches the schema.

HARD RULES
H1. Anchors are product / category / platform nouns. Every product noun is its own anchor. Give each anchor an id: a1, a2, a3 in order.
H2. premium / luxury / affordable / heavy / organic / budget / affluent / hni are MODIFIERS when they qualify a product noun in the same piece ("premium skincare"). If the piece has NO product noun, the affluence/income/demographic concept itself IS the anchor with family "other" (e.g. "hni users", "affluent audience", "people earning more than 20 lakhs").
H3. female / male / young / metro / urban / bharat / tier 1-3 / above 25 / city names are DIMENSIONS, never modifiers, never anchors.
H4. "and" / "plus" / "who also" / "along with" → join=AND. "or" / "either" → join=OR. Single anchor → join=OR.
H5. A modifier attaches ONLY to the anchor it grammatically modifies, via applies_to = [anchor id].
    "premium skincare and beauty user" → premium applies_to ["a1"] (skincare) only, NOT beauty.
    "premium skincare and premium beauty" → two modifier objects, one per anchor.
    Ambiguous ("premium users who buy skincare and beauty") → attach to the primary anchor id only.
H6. above 25 → dimensions.above_age=25 and age_bucket=["23-28","29-34","35-40","41-46","47+"].
H7. City names go to dimensions.city; do not also fill geo_tier unless the user said Metro/Tier.
H8. mode="expected". Typo repair allowed (choclate→chocolate, quickcommerce→quick commerce). Inventing a family is not.
H9. NEVER output a number, volume or partner name (unless the user named it).
H10. If the brief contains "and" plus two product nouns you MUST emit two anchors. Never collapse to one.
H11. The input has already had conversational filler removed. Only retain anchors, modifiers, dimensions, Boolean operators and exclusions. Never put filler into canonical names or tokens.
H12. exclusions contains canonical concepts following NOT, excluding, without or except. Exclusions are never positive anchors.
H13. For two nouns joined by OR/either, emit both anchors and join=OR. Never collapse either side.

FILLER CONTRACT
Drop audience wrappers (people, users, audience, cohort, segment, consumers, customers, folks, individuals, personas, profiles, population), relative/person words (who, that, which, those, these, someone, anyone, everyone), generic intent verbs (like, love, prefer, interested in, likely to, looking for, want, need, use, consume, engage with), generic behaviour phrases (go for, go out for, visit for, spend time on, hang out, are into, based on, related to, associated with, affinity for), planning/request filler (find, show, give, get, create, build, identify, discover, search, estimate, calculate, size, audience size, scale, reach, target, planning, campaign, media, activation), and grammar filler (the, a, an, for, to, of, in, on, at, by, from, with, as, is, are, was, were, be, being, been, have, also).
Never drop AND, OR, NOT, excluding, without, except; dimensions such as female, male, women, men, metro, tiers, age bands and cities; or modifiers such as premium, luxury, superpremium, affluent, hni, high-value, organic, heavy, frequent, international and budget.

FEW-SHOTS
"premium skincare and beauty user" →
 join AND; anchors a1 canonical "skincare" family beauty role primary tokens ["skincare","skin care"], a2 canonical "beauty" family beauty role and tokens ["beauty"];
 modifiers [{token:"premium", op:"PREFER_ROW_ELSE_SCALE", param:0.12, applies_to:["a1"]}]; dimensions empty.
"premium skincare and are likely to travel internationally" →
 join AND; anchors a1 "skincare" (beauty, primary), a2 "international travel" (travel, and); modifier premium applies_to ["a1"]. Never drop skincare.
"quickcommerce user" → one anchor a1 canonical "quick commerce" family grocery_retail, tokens ["quick commerce","qcommerce","q-commerce","instant delivery"]; no modifier; no dimension; join OR.
"snack shopper" → one anchor a1 canonical "snacks" family snacks; join OR.
"quick commerce snack buyer" → join AND; a1 "quick commerce" (grocery_retail, primary), a2 "snacks" (snacks, and); no modifier.
"premium chocolate female above 25" → one anchor a1 "chocolate" family sweets; modifier premium applies_to ["a1"]; dimensions gender_bucket ["Female"], above_age 25.
"party people and dineout folks", "party and dineout", "people who party and go out for dineout", and "users who like partying and dine out" → the identical result: join AND; a1 canonical "party" family entertainment; a2 canonical "dine out" family dining.
"party or dineout" and "either party or dineout" → the identical result: join OR; a1 canonical "party" family entertainment role primary; a2 canonical "dine out" family dining role or.
"party excluding dineout" → join OR; a1 canonical "party" family entertainment; exclusions ["dine out"].

H14. SENTENCE SPLIT RULE. Split the brief only on join words: or / and / and-or / plus / either. Each resulting piece is ONE cohort. Words inside a piece are never joins. Inside a piece, juxtaposition means AND (platform x product, product x buyers): "quick commerce energy drink buyers" = quick commerce AND energy drink, exactly the same as if no join word were present anywhere in the sentence. A join word applies BETWEEN pieces only, once. The presence of one OR must never turn inside-piece AND logic into OR.
    "quick commerce energy drink buyers or sport nutrition product buyers" -> piece 1 = quick commerce AND energy drink, piece 2 = sport nutrition products, combined with OR.

KNOWN FAMILIES
sweets, ice_cream, bakery, snacks, biscuits, beverages_cold, beverages_hot, dairy, staples, fruits_veg, meat, packaged_food, baby, pet, beauty, personal_care, pharma, fitness, apparel, jewellery, electronics, appliances, home, auto, education, payments, grocery_retail, dining, travel, entertainment, finance, real_estate, agri, construction, industrial, toys, stationery, sexual_wellness, paan, luxury, fuel, utility`;


function responseSchema() {
  return {
    type: "OBJECT",
    properties: {
      join: { type: "STRING", enum: ["AND", "OR"] },
      anchors: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            canonical: { type: "STRING" },
            family: { type: "STRING" },
            role: { type: "STRING", enum: ["primary", "and", "or"] },
            tokens: { type: "ARRAY", items: { type: "STRING" } },
            confidence: { type: "NUMBER" },
          },
          required: ["id", "canonical", "family", "role", "tokens"],
        },
      },
      modifiers: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            token: { type: "STRING" },
            op: { type: "STRING" },
            param: { type: "NUMBER" },
            applies_to: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["token", "op", "applies_to"],
        },
      },

      dimensions: {
        type: "OBJECT",
        properties: {
          geo_tier: { type: "ARRAY", items: { type: "STRING" } },
          age_bucket: { type: "ARRAY", items: { type: "STRING" } },
          gender_bucket: { type: "ARRAY", items: { type: "STRING" } },
          city: { type: "STRING" },
          above_age: { type: "INTEGER" },
        },
      },
      exclusions: { type: "ARRAY", items: { type: "STRING" } },
      mode: { type: "STRING", enum: ["conservative", "expected", "aggressive"] },
      refuse: {
        type: "OBJECT",
        properties: { flag: { type: "BOOLEAN" }, reason: { type: "STRING" } },
        required: ["flag"],
      },
    },
    required: ["join", "anchors", "modifiers", "dimensions", "exclusions", "mode", "refuse"],
  };
}

async function accessToken(sa: Record<string, string>): Promise<string> {
  const key = await jose.importPKCS8(sa.private_key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/cloud-platform",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token failed ${r.status} ${JSON.stringify(j)}`);
  return j.access_token;
}

function canonicalize(ir: any) {
  ir.join = ir.join === "AND" ? "AND" : "OR";
  ir.mode = ir.mode || "expected";
  ir.dimensions = ir.dimensions || {};
  ir.dimensions.geo_tier = ir.dimensions.geo_tier || [];
  ir.dimensions.age_bucket = ir.dimensions.age_bucket || [];
  ir.dimensions.gender_bucket = ir.dimensions.gender_bucket || [];
  ir.dimensions.city = ir.dimensions.city ?? null;
  ir.dimensions.above_age = ir.dimensions.above_age ?? null;
  ir.refuse = ir.refuse || { flag: false, reason: null };
  ir.exclusions = [...new Set((ir.exclusions || []).map((x: unknown) => canonicalAnchor(String(x))).filter(Boolean))].sort();
  // Primary first, then declaration order. Ids are re-stamped a1..aN and modifiers remapped.
  const src = (ir.anchors || []).map((a: any, i: number) => ({
    oldId: String(a.id || `a${i + 1}`),
    canonical: canonicalAnchor(String(a.canonical || "")),
    family: String(a.family || "").toLowerCase().trim(),
    role: a.role || (i === 0 ? "primary" : "and"),
    tokens: [...new Set((a.tokens || []).map((t: string) => canonicalAnchor(String(t))).filter(Boolean))],
  })).filter((a: any) => a.canonical);
  const ordered = [
    ...src.filter((a: any) => a.role === "primary"),
    ...src.filter((a: any) => a.role !== "primary"),
  ];
  const idMap: Record<string, string> = {};
  ir.anchors = ordered.map((a: any, i: number) => {
    const id = `a${i + 1}`;
    idMap[a.oldId] = id;
    if (!a.tokens.includes(a.canonical)) a.tokens.push(a.canonical);
    return { id, canonical: a.canonical, family: a.family, role: i === 0 ? "primary" : (ir.join === "OR" ? "or" : "and"), tokens: [a.canonical] };
  });
  const primaryId = ir.anchors[0]?.id;
  ir.modifiers = (ir.modifiers || []).map((m: any) => {
    const at = (m.applies_to || []).map((x: string) => idMap[String(x)]).filter(Boolean);
    return {
      token: String(m.token || "").toLowerCase(),
      op: m.op || "PREFER_ROW_ELSE_SCALE",
      param: m.param ?? 0.12,
      applies_to: at.length ? at : (primaryId ? [primaryId] : []),
    };
  }).filter((m: any) => m.token);
  ir.modifiers.sort((a: any, b: any) => a.token.localeCompare(b.token));
  return ir;
}

/** Combine independently compiled OR sides: AND inside a side, OR across sides. */
function mergeSides(sides: any[]) {
  const anchors: any[] = [];
  const modifiers: any[] = [];
  const dimensions: any = { geo_tier: [], age_bucket: [], gender_bucket: [], city: null, above_age: null };
  const exclusions = new Set<string>();
  sides.forEach((side, g) => {
    const idMap: Record<string, string> = {};
    for (const a of side.anchors || []) {
      const id = `a${anchors.length + 1}`;
      idMap[a.id] = id;
      anchors.push({ ...a, id, group: g, role: anchors.length === 0 ? "primary" : (side.anchors.length > 1 ? "and" : "or") });
    }
    for (const m of side.modifiers || []) {
      modifiers.push({ ...m, applies_to: (m.applies_to || []).map((x: string) => idMap[x]).filter(Boolean) });
    }
    for (const key of ["geo_tier", "age_bucket", "gender_bucket"]) {
      for (const v of side.dimensions?.[key] || []) if (!dimensions[key].includes(v)) dimensions[key].push(v);
    }
    dimensions.city = dimensions.city ?? side.dimensions?.city ?? null;
    dimensions.above_age = dimensions.above_age ?? side.dimensions?.above_age ?? null;
    for (const x of side.exclusions || []) exclusions.add(x);
  });
  return {
    join: "OR",
    anchors,
    modifiers,
    dimensions,
    exclusions: [...exclusions].sort(),
    mode: sides[0]?.mode || "expected",
    refuse: { flag: false, reason: null },
  };
}

async function callVertex(token: string, brief: string, reminder?: string) {
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
  const body = {
    systemInstruction: { role: "system", parts: [{ text: SYSTEM + (reminder ? `\n\nREMINDER: ${reminder}` : "") }] },
    contents: [{ role: "user", parts: [{ text: brief }] }],
    generationConfig: {
      temperature: 0,
      topP: 0,
      candidateCount: 1,
      // Thinking tokens used to eat the whole budget and the call returned
      // MAX_TOKENS with no text, which silently dropped the parse to the
      // weak keyword fallback. No thinking, bigger budget.
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: responseSchema(),
      seed: 0,
    },
  };
  const vr = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const vj = await vr.json();
  const text = vj?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`vertex empty ${vr.status} ${JSON.stringify(vj).slice(0, 400)}`);
  return canonicalize(JSON.parse(text));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { brief } = await req.json();
    if (!brief || typeof brief !== "string") {
      return new Response(JSON.stringify({ error: "brief required" }), { status: 400, headers: CORS });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const n = normBrief(brief);
    if (!n) {
      return new Response(JSON.stringify({ error: "brief has no audience concepts" }), { status: 400, headers: CORS });
    }
    const PARSER_VERSION = "semantic-v5-piece-split";
    const h = await sha256(`${PARSER_VERSION}:${n}`);

    const cached = await sb.from("query_cache").select("query_ir, source").eq("brief_norm_hash", h).maybeSingle();
    if (cached.data?.query_ir) {
      return new Response(JSON.stringify({ query_ir: cached.data.query_ir, source: cached.data.source, cached: true }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const raw = Deno.env.get("GCP_SA_JSON");
    if (!raw) {
      return new Response(JSON.stringify({ error: "vertex_unconfigured" }), {
        status: 424, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const sa = JSON.parse(raw);
    const token = await accessToken(sa);

    // Each side of a top-level OR is compiled on its own so that
    // "quick commerce energy buyers OR sports nutrition buyers" becomes
    // (quick commerce AND energy drinks) OR (sports nutrition) instead of a
    // flat union that swallows a whole category.
    const sides = n.split(/\s+OR\s+/).map((s) => s.trim()).filter(Boolean);
    let ir: any;
    if (sides.length > 1) {
      const parsed = [] as any[];
      for (const side of sides) {
        const sideIr = await callVertex(token, side);
        if ((sideIr.anchors || []).length) parsed.push(sideIr);
      }
      if (parsed.length < sides.length) {
        ir = parsed[0] ?? { anchors: [], modifiers: [], exclusions: [], dimensions: {}, mode: "expected" };
        ir.refuse = { flag: true, reason: "Could not resolve every part of this request. Try naming each audience separately." };
      } else {
        ir = mergeSides(parsed);
      }
    } else {
      ir = await callVertex(token, n);
      const wantsAnd = /\bAND\b/.test(n);
      if (wantsAnd && (ir.anchors || []).length < 2 && !ir.refuse?.flag) {
        ir = await callVertex(
          token,
          n,
          `The brief joins two product nouns with AND. You MUST emit both anchors with join=AND, and attach each modifier only to the anchor it modifies.`,
        );
        if ((ir.anchors || []).length < 2) {
          ir.refuse = { flag: true, reason: "Could not resolve both parts of this brief. Try naming each audience separately." };
        }
      }
      if (wantsAnd && (ir.anchors || []).length >= 2) ir.join = "AND";
    }

    // Rebuild the object from its semantic form so model-only variation cannot
    // alter cache identity, retrieval text or downstream sizing.
    ir = JSON.parse(semanticIrKey(ir));

    await sb.from("query_cache").upsert({
      brief_norm_hash: h,
      brief_norm: `${PARSER_VERSION}:${n}`,
      query_ir: ir,
      source: "vertex",
    });
    return new Response(JSON.stringify({ query_ir: ir, source: "vertex", cached: false }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
