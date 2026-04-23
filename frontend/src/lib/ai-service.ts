/**
 * AI Service — portable adapter (mock / anthropic / openai).
 * Mirrors the NestJS AiService logic but as a standalone function.
 */

const AI_PROVIDER = process.env.AI_PROVIDER || "mock";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export async function aiComplete(prompt: string, system?: string): Promise<string> {
  if (AI_PROVIDER === "mock" || !AI_API_KEY) {
    return mockComplete(prompt);
  }

  try {
    if (AI_PROVIDER === "anthropic") return await anthropicComplete(prompt, system);
    if (AI_PROVIDER === "openai") return await openaiComplete(prompt, system);
  } catch (err) {
    console.error("AI provider error; falling back to mock", err);
  }
  return mockComplete(prompt);
}

function mockComplete(prompt: string): string {
  return JSON.stringify({
    _mock: true,
    echo: prompt.slice(0, 200),
    generatedAt: new Date().toISOString(),
  });
}

async function anthropicComplete(prompt: string, system?: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": AI_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data: any = await res.json();
  return data?.content?.[0]?.text ?? "";
}

async function openaiComplete(prompt: string, system?: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data: any = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
