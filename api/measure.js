import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/measure  —  photo of wood + a reference object  ->  real dimensions.
 *
 * The Anthropic key lives only here (server-side). Works unchanged as a Vercel /
 * Netlify serverless function and, in dev, as the Vite middleware wired in
 * vite.config.js. Request:  { image: <base64 or data-URL>, reference: <string> }
 */

const MODEL = process.env.MEASURE_MODEL || "claude-opus-5";

const SHAPE = `{
  "items": [
    { "label": "Board 1", "length_cm": 190, "width_cm": 60, "thickness_cm": 1.8,
      "material_guess": "MDF", "condition": "new" }
  ],
  "total_boards": 1,
  "reference_detected": true,
  "confidence": "high",
  "recommended_product": "cabinet side panels"
}`;

async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

/** Split a data-URL or bare base64 into { mediaType, data }. */
function parseImage(raw) {
  if (typeof raw !== "string" || !raw) return null;
  const m = raw.match(/^data:(image\/[a-zA-Z.+-]+);base64,(.*)$/s);
  if (m) return { mediaType: m[1], data: m[2] };
  return { mediaType: "image/jpeg", data: raw };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "POST only." });
  if (!process.env.ANTHROPIC_API_KEY) {
    return send(res, 500, {
      error: "Measurement is not configured — set ANTHROPIC_API_KEY on the server.",
    });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: "Bad request body." });
  }

  const img = parseImage(body.image);
  if (!img) return send(res, 400, { error: "No image supplied." });
  const reference = (body.reference || "a standard reference object").toString().slice(0, 200);

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } },
            {
              type: "text",
              text:
                `You measure wood for a furniture workshop in Ghana. A reference object is in the photo for scale: ${reference}. ` +
                `Identify every distinct board or piece of wood and estimate its real-world length, width and thickness in centimetres by comparing against the reference. ` +
                `Set "reference_detected" to false if you cannot see the reference clearly, and lower "confidence" ("high" | "medium" | "low") accordingly. ` +
                `"recommended_product" should say what these boards are best used for (e.g. "cabinet side panels", "shelf stock", "door frame"). ` +
                `Respond with ONLY the JSON object, no markdown, in exactly this shape:\n${SHAPE}`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return send(res, 422, { error: "Could not process that photo." });
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return send(res, 502, {
        error: "The measurement came back unreadable. Try a clearer photo with the reference object fully visible.",
      });
    }
    if (!parsed || !Array.isArray(parsed.items)) {
      return send(res, 502, { error: "The measurement had no boards in it. Try another photo." });
    }
    return send(res, 200, {
      items: parsed.items,
      total_boards: Number(parsed.total_boards) || parsed.items.length,
      reference_detected: parsed.reference_detected !== false,
      confidence: parsed.confidence || "medium",
      recommended_product: parsed.recommended_product || "",
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return send(res, 500, { error: "Measurement key is invalid — check ANTHROPIC_API_KEY." });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return send(res, 429, { error: "Too many measurements just now. Wait a moment and try again." });
    }
    return send(res, 502, {
      error: "Could not analyse the photo. Try better lighting and a clearly visible reference object.",
    });
  }
}
