// app/api/runtime-config/route.ts
import { NextResponse } from "next/server";
import { DEFAULT_RUNTIME_CONFIG, RuntimeConfig } from "@/types/runtime-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config: RuntimeConfig = {
    iframeSrcDemoB2B: process.env.PISHKAR_B2B_DEMO_IFRAME_SRC?.trim() || DEFAULT_RUNTIME_CONFIG.iframeSrcDemoB2B,
    iframeSrcDemoB2C: process.env.PISHKAR_B2C_DEMO_IFRAME_SRC?.trim() || DEFAULT_RUNTIME_CONFIG.iframeSrcDemoB2C,
    apiUrl: process.env.PISHKAR_API_URL?.trim() || DEFAULT_RUNTIME_CONFIG.apiUrl,
  };

  return NextResponse.json(config);
}
