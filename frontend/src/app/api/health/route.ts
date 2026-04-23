import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "domina-receita-api",
    runtime: "vercel-serverless",
    timestamp: new Date().toISOString(),
  });
}
