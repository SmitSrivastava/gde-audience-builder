// Shared Vertex AI helpers (service-account auth + text embeddings).
import * as jose from "https://deno.land/x/jose@v5.9.6/index.ts";

export const PROJECT = Deno.env.get("GCP_PROJECT") ?? "acceleration-ga-poc";
export const LOCATION = Deno.env.get("GCP_LOCATION") ?? "asia-south1";
export const MODEL = Deno.env.get("GCP_MODEL") ?? "gemini-2.5-flash";
export const EMBED_MODEL = "text-embedding-004";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let cachedToken: { token: string; exp: number } | null = null;

export async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 120 > now) return cachedToken.token;
  const raw = Deno.env.get("GCP_SA_JSON");
  if (!raw) throw new Error("vertex_unconfigured");
  const sa = JSON.parse(raw);
  const key = await jose.importPKCS8(sa.private_key, "RS256");
  const jwt = await new jose.SignJWT({ scope: "https://www.googleapis.com/auth/cloud-platform" })
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
  cachedToken = { token: j.access_token, exp: now + (j.expires_in ?? 3600) };
  return j.access_token;
}

export async function embed(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY",
): Promise<number[][]> {
  if (!texts.length) return [];
  const token = await accessToken();
  const url =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${EMBED_MODEL}:predict`;
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 20) {
    const chunk = texts.slice(i, i + 20);
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: chunk.map((content) => ({ content: content.slice(0, 4000), task_type: taskType })),
      }),
    });
    const j = await r.json();
    if (!j?.predictions) throw new Error(`embed failed ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
    for (const p of j.predictions) out.push(p.embeddings.values as number[]);
  }
  return out;
}

export async function gemini(system: string, user: string, schema: unknown, maxTokens = 1024) {
  const token = await accessToken();
  const url =
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0,
        topP: 0,
        candidateCount: 1,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
        seed: 0,
      },
    }),
  });
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`vertex empty ${r.status} ${JSON.stringify(j).slice(0, 400)}`);
  return JSON.parse(text);
}
