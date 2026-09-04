import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateText, Output, NoObjectGeneratedError } from "npm:ai";
import { z } from "npm:zod";
import { createLovableAiGatewayProvider, getLovableAiGatewayRunId } from "../_shared/ai-gateway.ts";

const RuleSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.string(),
  logic: z.string(),
});

const ResultSchema = z.object({
  rules: z.array(RuleSchema),
  summary: z.string(),
});

const ALLOWED_OPERATORS = new Set(["=", "!=", "IN", "NOT IN", "CONTAINS"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "AI is not configured (missing LOVABLE_API_KEY)" }, 500);

    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt || prompt.length > 500) {
      return json({ error: "Provide a cohort description (1–500 characters)" }, 400);
    }

    // Load the attribute catalog (uploaded via Excel in Admin)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: catalog, error: dbError } = await supabase
      .from("attribute_catalog")
      .select("field, value, synonyms");
    if (dbError) return json({ error: "Failed to load attribute catalog" }, 500);
    if (!catalog || catalog.length === 0) {
      return json({ error: "Attribute catalog is empty. Upload the attribute Excel in Admin → Attribute Catalog first." }, 400);
    }

    // Group catalog by field for the prompt
    const byField = new Map<string, { values: Set<string>; synonyms: Set<string> }>();
    for (const row of catalog) {
      const entry = byField.get(row.field) ?? { values: new Set<string>(), synonyms: new Set<string>() };
      entry.values.add(row.value);
      if (row.synonyms) row.synonyms.split(",").map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => entry.synonyms.add(s));
      byField.set(row.field, entry);
    }
    const catalogText = [...byField.entries()]
      .map(([field, e]) => {
        const vals = [...e.values].slice(0, 60).join(", ");
        const syns = e.synonyms.size ? ` (related terms: ${[...e.synonyms].join(", ")})` : "";
        return `- ${field}: ${vals}${syns}`;
      })
      .join("\n");

    const gateway = createLovableAiGatewayProvider(key, getLovableAiGatewayRunId(req));
    const model = gateway("google/gemini-3.7-flash");

    const systemPrompt = `You are an audience segmentation expert for a data exchange platform. The user describes a target cohort in plain English. Map it to query rules using ONLY the attribute fields and values from the catalog below. Interpret synonyms and related meanings (e.g. "beauty" can map to cosmetics/skincare values, "premium" to high income or luxury values, "luxury" to premium/affluent values).

ATTRIBUTE CATALOG:
${catalogText}

Rules:
- Use ONLY fields and values that exist in the catalog above — never invent new ones.
- operator must be one of: "=", "!=", "IN", "NOT IN", "CONTAINS". Use "IN" or "CONTAINS" when multiple values of the same field match.
- For IN/CONTAINS put the values in "value" separated by ", ".
- logic is "AND" or "OR" (how this rule combines with the previous one). First rule is always "AND".
- Pick the 1-4 most relevant rules. Fewer, precise rules are better.
- summary: one short sentence explaining the interpretation to the user.`;

    let parsed: z.infer<typeof ResultSchema> | null = null;
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: ResultSchema }),
        system: systemPrompt,
        prompt: `Cohort description: "${prompt}"`,
      });
      parsed = output;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          parsed = ResultSchema.parse(JSON.parse(err.text));
        } catch {
          return json({ error: "Could not interpret the description. Try rephrasing it." }, 422);
        }
      } else {
        throw err;
      }
    }

    // Guardrail: keep only rules whose field exists in the catalog and values exist for that field
    const validRules = (parsed?.rules ?? [])
      .filter((r) => {
        const entry = byField.get(r.field);
        if (!entry || !ALLOWED_OPERATORS.has(r.operator)) return false;
        const vals = r.value.split(",").map((v) => v.trim()).filter(Boolean);
        const known = vals.filter((v) => entry.values.has(v));
        if (known.length === 0) return false;
        r.value = known.join(", ");
        return true;
      })
      .slice(0, 6)
      .map((r, i) => ({ ...r, logic: i === 0 ? "AND" : (r.logic === "OR" ? "OR" : "AND") }));

    if (validRules.length === 0) {
      return json({ error: "No catalog attributes matched that description. Try different wording or add more attributes to the catalog." }, 422);
    }

    return json({ rules: validRules, summary: parsed?.summary ?? "" });
  } catch (err) {
    console.error("interpret-cohort error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 429) return json({ error: "AI rate limit reached — please try again in a moment." }, 429);
    if (status === 402 || status === 403) return json({ error: "AI credits exhausted or blocked — please check workspace credits." }, 402);
    return json({ error: "Failed to interpret the cohort description." }, 500);
  }
});
