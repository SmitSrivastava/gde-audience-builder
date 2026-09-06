// Supabase Edge Function: audience-strategy
// Role: suggestive strategy layer on top of an already-computed audience.
// It never recomputes reach and never changes the plan.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { CORS, gemini } from "../_shared/vertex.ts";

const SYSTEM =
  `You are one of the best audience strategists in India, advising a brand planning team on the WPP GDE Audience Intelligence platform.
You are given a cohort that has ALREADY been built: its description, its size, its evidence mix, the data partners behind it and its geo/age/gender profile.

Rules:
- Base every suggestion on the cohort facts you are given. Never invent audience sizes, never restate the maths, never explain how the cohort was computed.
- India market context, 2026. Be concrete: name real channel types, platforms, formats, offer mechanics and CRM triggers used in India.
- Every bullet is one short, actionable sentence (max 22 words). No filler, no jargon padding.
- Output JSON only, matching the schema.`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    positioning: { type: "STRING" },
    acquisition: { type: "ARRAY", items: { type: "STRING" } },
    aov_growth: { type: "ARRAY", items: { type: "STRING" } },
    paid_media: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          channel: { type: "STRING" },
          why: { type: "STRING" },
          format: { type: "STRING" },
        },
        required: ["channel", "why", "format"],
      },
    },
    crm: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          channel: { type: "STRING" },
          trigger: { type: "STRING" },
          message: { type: "STRING" },
        },
        required: ["channel", "trigger", "message"],
      },
    },
    watchouts: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["positioning", "acquisition", "aov_growth", "paid_media", "crm", "watchouts"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body = await req.json();
    const cohort = {
      cohort: body.base_cohort || body.brief || "audience",
      people_reach: body.people_reach ?? null,
      purchase_backed: body.actual_people ?? null,
      interest_backed: body.intent_people ?? null,
      focus: body.modifier_line || "none",
      filters: body.dimension_line || "none",
      data_partners: (body.partners || []).slice(0, 12),
      top_signals: (body.matched_signals || []).slice(0, 25).map((s: any) => s.audience_signal),
      geo_split: body.geo_split || [],
      age_split: body.age_split || [],
      gender_split: body.gender_split || [],
    };

    const user = `Cohort facts (JSON):
${JSON.stringify(cohort)}

Produce:
1. positioning: one line on who these people really are and what they respond to.
2. acquisition: 4 ways to acquire NEW people who look like this cohort.
3. aov_growth: 4 ways to lift average order value within this same cohort.
4. paid_media: 4 channels to reach them, each with why it fits this cohort and the best format.
5. crm: 4 CRM campaigns, each with the channel, the trigger and the message angle.
6. watchouts: 2 risks or things to test before scaling.`;

    const out = await gemini(SYSTEM, user, SCHEMA, 8192);
    return new Response(JSON.stringify(out), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
